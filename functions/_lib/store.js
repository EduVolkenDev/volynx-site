// functions/_lib/store.js
// Cloudflare KV wrapper (mesma “cara” do seu store usado no Netlify)
export function volynxStore(env) {
  const kv = env?.VOLYNX_KV;
  if (!kv) {
    throw new Error("Missing VOLYNX_KV binding (Pages > Settings > Bindings).");
  }

  return {
    async get(key, opts = {}) {
      const type = opts?.type || "text";
      if (type === "json") return await kv.get(key, { type: "json" });
      return await kv.get(key, { type: "text" });
    },

    async set(key, value) {
      await kv.put(key, String(value));
    },

    async setJSON(key, obj) {
      await kv.put(key, JSON.stringify(obj));
    },
  };
}
