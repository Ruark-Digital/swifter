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

// A stored file URL (e.g. a contract document's `url`) bakes in whatever API
// host/base was active when the file was uploaded, so it does NOT follow
// `VITE_API_BASE_URL` when the environment changes — unlike every axios call.
// Re-home such URLs onto the env-configured base so the file is always fetched
// from the current environment. Only the path after the API base (e.g.
// `/upload/...`) is intrinsic to the file; the base comes from `baseUrl`.
// Absolute API URLs only — relative, non-http, and genuinely external URLs
// (whose path doesn't sit under the API base) are returned unchanged.
export const resolveEnvFileUrl = (rawUrl: string): string => {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return rawUrl;
    const base = new URL(baseUrl);
    const basePath = base.pathname.replace(/\/+$/, ""); // e.g. "/api/v1/dev"
    if (basePath && url.pathname.startsWith(basePath)) {
      const rest = url.pathname.slice(basePath.length); // e.g. "/upload/..."
      return `${base.origin}${basePath}${rest}${url.search}${url.hash}`;
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
};
