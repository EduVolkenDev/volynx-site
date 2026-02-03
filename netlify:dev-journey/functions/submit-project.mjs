import { volynxStore } from "./_lib/store.mjs";
import {
  jsonResponse, badRequest, unauthorized, methodNotAllowed,
  normalizeEmail, makeCertId, hmacSha256Hex, parseGithubRepo, safeJson
} from "./_lib/utils.mjs";

async function githubRequest(path, token) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, status: res.status, text };
  }
  return { ok: true, json: await res.json() };
}

export default async (request) => {
  if (request.method === "OPTIONS") return jsonResponse({ ok: true });
  if (request.method !== "POST") return methodNotAllowed();

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const SIGN_SECRET = process.env.CERT_SIGNING_SECRET;
  const PREFIX = process.env.VOLYNX_CERT_PREFIX || "VLX-DJ";

  if (!GITHUB_TOKEN) return jsonResponse({ ok: false, error: "Missing GITHUB_TOKEN env var" }, 500);
  if (!SIGN_SECRET) return jsonResponse({ ok: false, error: "Missing CERT_SIGNING_SECRET env var" }, 500);

  const body = await safeJson(request);
  const email = normalizeEmail(body?.email);
  const repoUrl = String(body?.repoUrl || "").trim();

  if (!email) return badRequest("Informe o e-mail usado na compra.");
  if (!repoUrl) return badRequest("Informe a URL do repositório GitHub.");

  const parsed = parseGithubRepo(repoUrl);
  if (!parsed) return badRequest("Repo inválido. Use https://github.com/owner/repo");

  const store = volynxStore();
  const purchaseKey = `purchase:${email}`;
  const purchase = await store.get(purchaseKey, { type: "json" });

  if (!purchase?.isActive) return unauthorized("Compra não encontrada ou não elegível (precisa estar APROVADA/COMPLETA).");

  const { owner, repo } = parsed;

  // 1) repo exists
  const repoInfo = await githubRequest(`/repos/${owner}/${repo}`, GITHUB_TOKEN);
  if (!repoInfo.ok) return badRequest("Não consegui acessar esse repo (confira se é público e o link está correto).", repoInfo);

  // 2) workflow file exists
  const wfPath = "/.github/workflows/volynx-validate.yml";
  const wf = await githubRequest(`/repos/${owner}/${repo}/contents${wfPath}`, GITHUB_TOKEN);
  if (!wf.ok) {
    return badRequest(
      "Faltou o workflow de validação VOLYNX. Crie o arquivo .github/workflows/volynx-validate.yml e faça push.",
      { requiredPath: wfPath }
    );
  }

  // 3) last run success
  const runs = await githubRequest(`/repos/${owner}/${repo}/actions/workflows/volynx-validate.yml/runs?per_page=1`, GITHUB_TOKEN);
  if (!runs.ok) return badRequest("Não consegui ler os runs do GitHub Actions. O Actions está habilitado?", runs);

  const last = runs.json?.workflow_runs?.[0];
  if (!last) return badRequest("Ainda não há execução do workflow. Faça um push para disparar a validação.");

  const conclusion = String(last.conclusion || "").toLowerCase();
  const status = String(last.status || "").toLowerCase();

  if (!(status === "completed" && conclusion === "success")) {
    return badRequest("Seu projeto ainda não passou na validação automática (GitHub Actions).", {
      workflow: "volynx-validate.yml",
      lastRun: { status: last.status, conclusion: last.conclusion, html_url: last.html_url }
    });
  }

  // 4) issue cert (idempotent per repo+email)
  const certIndexKey = `certIndex:${email}:${owner}/${repo}`;
  const existingId = await store.get(certIndexKey, { type: "text" });
  if (existingId) {
    return jsonResponse({
      ok: true,
      alreadyIssued: true,
      certId: existingId,
      verifyUrl: `https://volynx.world/verify/${existingId}`
    });
  }

  const certId = makeCertId(PREFIX);
  const issuedAt = new Date().toISOString();
  const buyerName = purchase?.buyerName || null;

  const payload = {
    certId,
    program: "VOLYNX.Lab Education • Dev Journey",
    issuedAt,
    buyer: { email, name: buyerName },
    repo: { owner, name: repo, url: `https://github.com/${owner}/${repo}` },
    validation: {
      workflow: "volynx-validate.yml",
      runUrl: last.html_url,
      runId: last.id
    }
  };

  const fingerprint = hmacSha256Hex(SIGN_SECRET, JSON.stringify(payload));
  const record = { ...payload, fingerprint };

  await store.setJSON(`cert:${certId}`, record);
  await store.set(certIndexKey, certId);

  return jsonResponse({
    ok: true,
    certId,
    verifyUrl: `https://volynx.world/verify/${certId}`
  });
};
