import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

vi.mock("react-pdf", () => {
  const getTextContent = vi.fn(async () => ({
    items: [
      { str: 'Hello **World**', transform: [0, 0, 0, 0, 0, 100] },
      { str: "www.example.com", transform: [0, 0, 0, 0, 0, 98] },
      { str: "<script>alert(1)</script>", transform: [0, 0, 0, 0, 0, 96] },
    ],
  }));

  const getPage = vi.fn(async () => ({ getTextContent }));

  const getDocument = vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage,
    }),
  }));

  return {
    pdfjs: { getDocument },
  };
});

import { convertPdfToHtml } from "../fileUtils";

describe("convertPdfToHtml (fast mode)", () => {
  it("does not apply markdown heuristics (no <strong>, no linkify) and still escapes HTML", async () => {
    const html = await convertPdfToHtml(new ArrayBuffer(8), { mode: "fast" });
    expect(html).toContain("Hello **World**");
    expect(html).not.toContain("<strong>");
    expect(html).toContain("www.example.com");
    expect(html).not.toContain("<a ");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("<p>");
  });
});

