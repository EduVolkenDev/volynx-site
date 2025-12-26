// functions/.netlify/functions/verify.js
import { volynxStore } from "../../_lib/store.js";
import { jsonResponse, badRequest, methodNotAllowed } from "../../_lib/utils.js";

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") return jsonResponse({ ok: true });
  if (request.method !== "GET") return methodNotAllowed();

  const url = new URL(request.url);
  const id = url.searchParams.get("id") || "";

  const certId = String(id).trim().toUpperCase();
  if (!certId) return badRequest("Missing id");

  const store = volynxStore(env);
  const record = await store.get(`cert:${certId}`, { type: "json" });

  if (!record) return jsonResponse({ ok: false, error: "Certificate not found" }, 404);

  return jsonResponse({ ok: true, cert: record });
}
