import { getStore } from "@netlify/blobs";

export function volynxStore() {
  // In Netlify Functions runtime, Blobs site context (siteID/token) is populated automatically,
  // so getStore can be called with only the store name.
  return getStore("volynx-devjourney");
}
