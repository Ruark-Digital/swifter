const baseUrl =
  import.meta.env?.VITE_API_BASE_URL ?? "https://dev.swiftpro.tech/api/v1/dev";

// The AI chat (MCP) service is hosted on the same origin as the REST API in
// every environment — bug (bug-api.swiftpro.tech), staging (dev.swiftpro.tech),
// prod (api.swiftpro.tech). Derive its origin from `baseUrl` so it always tracks
// the selected environment; no separate env var to configure (or mistype).
const deriveChatBaseUrl = (apiBaseUrl: string): string => {
  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return "https://dev.swiftpro.tech";
  }
};

export const config = {
  baseUrl,
  chatBaseUrl: deriveChatBaseUrl(baseUrl),
};
