import { volynxStore } from "./_lib/store.mjs";
import { jsonResponse, badRequest, unauthorized, normalizeEmail, envList, safeJson } from "./_lib/utils.mjs";

function mapStatus(raw) {
  const s = String(raw || "").trim().toUpperCase();
  const pt = {
    "APROVADA": "APPROVED",
    "COMPLETA": "COMPLETE",
    "REEMBOLSADA": "REFUNDED",
    "CANCELADA": "CANCELLED",
    "AGUARDANDO PAGAMENTO": "WAITING_PAYMENT",
    "EM ANÁLISE": "UNDER_ANALYSIS"
  };
  return pt[s] || s;
}

function isActiveStatus(s) {
  return s === "APPROVED" || s === "COMPLETE";
}
function isNegativeStatus(s) {
  return s === "REFUNDED" || s === "CHARGEBACK" || s === "CANCELLED";
}

export default async (request) => {
  if (request.method === "OPTIONS") return jsonResponse({ ok: true });
  if (request.method !== "POST") return jsonResponse({ ok: false, error: "Use POST" }, 405);

  const hottokExpected = process.env.HOTMART_HOTTOK;
  if (!hottokExpected) return jsonResponse({ ok: false, error: "Missing HOTMART_HOTTOK env var" }, 500);

  const url = new URL(request.url);
  const body = await safeJson(request);

  // Hotmart docs: request includes hottok (token único por conta) para garantir que é a Hotmart chamando.
  const hottok = url.searchParams.get("hottok") || body?.hottok;
  if (!hottok || hottok !== hottokExpected) return unauthorized("Invalid hottok");

  // best-effort extraction across payload variants
  const data = body?.data || body?.payload || body;
  const buyer = data?.buyer || data?.purchase?.buyer || data?.customer || {};
  const email = normalizeEmail(buyer?.email || data?.buyer_email || data?.email);
  if (!email) return badRequest("Missing buyer email in payload");

  const productId = String(data?.product?.id || data?.product_id || data?.purchase?.product_id || "").trim();
  const allowed = envList("HOTMART_ALLOWED_PRODUCT_IDS");
  if (allowed.length && productId && !allowed.includes(productId)) {
    return unauthorized("Product not allowed");
  }

  const rawStatus = data?.purchase?.status || data?.status || data?.transaction?.status || data?.purchase_status;
  const status = mapStatus(rawStatus);

  const transactionId =
    String(data?.purchase?.transaction || data?.transaction || data?.purchase?.id || data?.transaction_id || "").trim()
    || String(Date.now());

  const record = {
    email,
    productId: productId || null,
    status,
    transactionId,
    buyerName: buyer?.name || data?.buyer_name || null,
    receivedAt: new Date().toISOString(),
    raw: body
  };

  const store = volynxStore();

  const key = `purchase:${email}`;
  const existing = (await store.get(key, { type: "json" })) || { email, latestStatus: null, transactions: [] };

  existing.latestStatus = status;
  existing.updatedAt = record.receivedAt;
  existing.productId = productId || existing.productId || null;
  existing.buyerName = record.buyerName || existing.buyerName || null;
  existing.transactions = Array.isArray(existing.transactions) ? existing.transactions : [];
  existing.transactions.unshift(record);
  existing.transactions = existing.transactions.slice(0, 20);

  existing.isActive = isActiveStatus(status) ? true : (isNegativeStatus(status) ? false : (existing.isActive ?? false));

  await store.setJSON(key, existing);

  return jsonResponse({ ok: true });
};
