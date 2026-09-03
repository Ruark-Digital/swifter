import { describe, it, expect } from "vitest";
import { config, resolveEnvFileUrl } from "../index";

// Derive expectations from the resolved env base so the suite holds regardless
// of what VITE_API_BASE_URL is set to in the test environment.
const base = new URL(config.baseUrl);
const envOrigin = base.origin;
const basePath = base.pathname.replace(/\/+$/, ""); // e.g. "/api/v1/dev"

describe("resolveEnvFileUrl — re-home stored file URLs onto the env API base", () => {
  it("swaps a stored URL's host for the env base host, keeping the file path", () => {
    const stored = `https://old-host.example${basePath}/upload/file-123/My%20Doc.docx`;
    expect(resolveEnvFileUrl(stored)).toBe(
      `${envOrigin}${basePath}/upload/file-123/My%20Doc.docx`,
    );
  });

  it("preserves query string and hash", () => {
    const stored = `https://old-host.example${basePath}/upload/f/x.docx?v=2#p1`;
    expect(resolveEnvFileUrl(stored)).toBe(
      `${envOrigin}${basePath}/upload/f/x.docx?v=2#p1`,
    );
  });

  it("is a no-op when the URL already points at the env base", () => {
    const url = `${envOrigin}${basePath}/upload/f/x.docx`;
    expect(resolveEnvFileUrl(url)).toBe(url);
  });

  it("leaves genuinely external URLs (not under the API base path) unchanged", () => {
    const external = "https://cdn.example.com/assets/x.pdf";
    expect(resolveEnvFileUrl(external)).toBe(external);
  });

  it("returns empty, relative, and non-http values unchanged", () => {
    expect(resolveEnvFileUrl("")).toBe("");
    expect(resolveEnvFileUrl("upload/f/x.docx")).toBe("upload/f/x.docx");
    expect(resolveEnvFileUrl("blob:https://app/abc")).toBe("blob:https://app/abc");
  });
});
