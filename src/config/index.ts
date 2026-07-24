const baseUrl =
  import.meta.env?.VITE_API_BASE_URL ?? "https://dev.swiftpro.tech/api/v1/dev";

// The AI chat (MCP) service is hosted on the same origin as the REST API in
// every environment — bug (bug-api.swiftpro.tech), staging (dev.swiftpro.tech),
// prod (api.swiftpro.tech). Derive its origin from `baseUrl` so it tracks the
// selected environment automatically; allow an explicit override if the chat
// service ever moves off the API host.
const deriveChatBaseUrl = (apiBaseUrl: string): string => {
  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return "https://dev.swiftpro.tech";
  }
};

export const config = {
  baseUrl,
  chatBaseUrl:
    import.meta.env?.VITE_MCP_BASE_URL ?? deriveChatBaseUrl(baseUrl),
};
