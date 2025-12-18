import crypto from "node:crypto";

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      ...extraHeaders
    }
  });
}

export function badRequest(message, details) {
  return jsonResponse({ ok: false, error: message, details }, 400);
}

export function unauthorized(message = "Unauthorized") {
  return jsonResponse({ ok: false, error: message }, 401);
}

export function methodNotAllowed() {
  return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function makeCertId(prefix = "VLX-DJ") {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${y}${m}${day}-${rand}`;
}

export function hmacSha256Hex(secret, payload) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function parseGithubRepo(repoUrl) {
  const raw = String(repoUrl || "").trim();

  if (/^[\w.-]+\/[\w.-]+$/.test(raw)) {
    const [owner, repo] = raw.split("/");
    return { owner, repo };
  }

  try {
    const u = new URL(raw);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/i, "") };
  } catch {
    return null;
  }
}

export async function safeJson(request) {
  const ct = request.headers.get("content-type") || "";
  const text = await request.text();
  if (!text) return {};
  if (ct.includes("application/json")) {
    try { return JSON.parse(text); } catch { return {}; }
  }
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

export function envList(name) {
  const v = process.env[name];
  if (!v) return [];
  return v.split(",").map(s => s.trim()).filter(Boolean);
}
