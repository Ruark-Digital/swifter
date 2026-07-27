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

// Environment inferred from the API host so Sentry, chat, and any future
// env-aware code all agree on which backend they're pointed at. Order matters:
// `bug-api` must be checked before the generic `api` prefix.
export type AppEnv = "prod" | "staging" | "bug" | "dev";

const deriveEnv = (apiBaseUrl: string): AppEnv => {
  try {
    const host = new URL(apiBaseUrl).hostname;
    if (host === "bug-api.swiftpro.tech") return "bug";
    if (host === "api.swiftpro.tech") return "prod";
    if (host === "dev.swiftpro.tech") return "staging";
    return "dev";
  } catch {
    return "dev";
  }
};

export const config = {
  baseUrl,
  chatBaseUrl: deriveChatBaseUrl(baseUrl),
  env: deriveEnv(baseUrl),
};
