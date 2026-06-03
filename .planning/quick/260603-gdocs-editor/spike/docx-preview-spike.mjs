// docx-preview spike — verify docx-preview produces richer output than
// mammoth for the Hyperscale supply agreement. Run from repo root with:
//   pnpm add jsdom -D   (if not already installed)
//   node .planning/quick/260603-gdocs-editor/spike/docx-preview-spike.mjs
//
// Findings (260603, docx-preview@0.3.7, against
// .qa/reference-docs/hyperscale-supply-agreement.docx):
//
// - Renders 11 `<section>` elements (Word PAGES) with explicit dimensions
//   `width: 612pt; min-height: 792pt; padding: 72pt;` — that's 8.5×11in
//   with 1in margins. Page structure baked into the output, no
//   pagination plugin needed for the basic case.
// - text-align: center IS preserved on title-block paragraphs that
//   mammoth's gated transformDocument missed.
// - Per-paragraph styling preserved via inline styles + class names.
//   Each <span> carries font-family / font-size / min-height.
// - Headers, footers, lists, tables — all rendered structurally
//   (renderHeaders / renderFooters / renderFootnotes options).
// - Output: ~700KB body + ~160KB style for our test doc. Comparable to
//   mammoth (~170KB body) but with FAR more structural fidelity.
//
// Trailing rAF error in jsdom is harmless: VML graphics handling tries
// container.firstElementChild.getBBox which jsdom's SVG doesn't
// implement. Browser environment doesn't hit this.

import fs from "node:fs";
import { JSDOM } from "jsdom";

const dom = new JSDOM(
  "<!DOCTYPE html><html><body><div id='style'></div><div id='body'></div></body></html>"
);
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;
globalThis.NodeFilter = dom.window.NodeFilter;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLDivElement = dom.window.HTMLDivElement;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.Element = dom.window.Element;
globalThis.URL = dom.window.URL;
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

const docx = await import("docx-preview");
const buf = fs.readFileSync(".qa/reference-docs/hyperscale-supply-agreement.docx");
const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const styleEl = document.getElementById("style");
const bodyEl = document.getElementById("body");

try {
  await docx.renderAsync(arrayBuffer, bodyEl, styleEl, {
    breakPages: true,
    renderHeaders: true,
    renderFooters: true,
    inWrapper: true,
    ignoreFonts: true,
  });
} catch (err) {
  // Trailing rAF errors from VML graphics are expected in jsdom — the
  // body content has already rendered before they fire.
  if (!err.message?.includes("getBBox")) throw err;
}

console.log("=== Render stats ===");
console.log(`<section> count (Word pages): ${bodyEl.querySelectorAll("section").length}`);
console.log(`Total elements with class containing "page": ${bodyEl.querySelectorAll('[class*="page"]').length}`);
console.log(`Body HTML length: ${bodyEl.innerHTML.length} chars`);
console.log(`Style HTML length: ${styleEl.innerHTML.length} chars`);

const dumpPath = ".planning/quick/260603-gdocs-editor/spike/docx-preview-output.html";
fs.writeFileSync(
  dumpPath,
  `<!DOCTYPE html>\n<html><head><style>${styleEl.innerHTML}</style></head><body>${bodyEl.innerHTML}</body></html>`
);
console.log(`\nFull output written to ${dumpPath}`);
console.log(`Open in browser to see docx-preview's native rendering of the Hyperscale doc.`);
