// functions/_lib/utils.js

function corsHeaders(extra = {}) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    ...extra,
  };
}

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(extraHeaders),
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

export function parseGithubRepo(repoUrl) {
  const s = String(repoUrl || "").trim();
  const m = s.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/|$)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/i, "") };
}

export async function safeJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function makeCertId(prefix = "VLX-DJ") {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const rnd = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `${prefix}-${rnd}`;
}

export async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
