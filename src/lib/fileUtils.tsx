import { DocSVG } from "@/assets/icons/Doc";
import { PdfSVG } from "@/assets/icons/Pdf";
import PowerPointSVG from "@/assets/icons/PowerPoint";
import { ExcelSVG } from "@/assets/icons/Excel";

/**
 * Helper function to get file extension from name or type
 * @param fileName - The file name
 * @param fileType - The file MIME type or type string
 * @returns The file extension in uppercase
 */
export const getFileExtension = (
  fileName: string,
  fileType: string
): string => {
  if (!fileName) return "";
  const extension = fileName.split(".").pop()?.toUpperCase();
  if (extension) return extension;

  // Fallback to type if no extension in name
  const lowerType = fileType.toLowerCase();

  // PDF files
  if (
    lowerType.includes("pdf") ||
    lowerType.includes("portable document format")
  ) {
    return "PDF";
  }

  // Word/DOC files
  if (
    lowerType.includes("doc") ||
    lowerType.includes("word") ||
    lowerType.includes("msword") ||
    lowerType.includes("wordprocessingml") ||
    lowerType.includes("opendocument.text") ||
    lowerType.includes("rtf")
  ) {
    return "DOC";
  }

  // Excel/Spreadsheet files
  if (
    lowerType.includes("excel") ||
    lowerType.includes("sheet") ||
    lowerType.includes("spreadsheet") ||
    lowerType.includes("ms-excel") ||
    lowerType.includes("spreadsheetml") ||
    lowerType.includes("opendocument.spreadsheet") ||
    lowerType.includes("csv") ||
    lowerType.includes("comma-separated")
  ) {
    return "XLS";
  }

  // PowerPoint/Presentation files
  if (
    lowerType.includes("powerpoint") ||
    lowerType.includes("presentation") ||
    lowerType.includes("ms-powerpoint") ||
    lowerType.includes("presentationml") ||
    lowerType.includes("opendocument.presentation") ||
    lowerType.includes("slideshow")
  ) {
    return "PPT";
  }

  return "FILE";
};

/**
 * Simple helper function to get file extension from filename only
 * @param filename - The file name
 * @returns The file extension in lowercase
 */
export const getSimpleFileExtension = (filename: string): string => {
  if (!filename) return "";
  return filename.split(".").pop()?.toLowerCase() || "";
};

/**
 * Helper function to get the appropriate file icon based on file extension
 * @param fileExtension - The file extension (case insensitive)
 * @returns JSX element for the file icon
 */
export const getFileIcon = (fileExtension: string) => {
  if (!fileExtension) return <PdfSVG />;
  const ext = fileExtension.toUpperCase();

  const excelExtension = [
    "XLS",
    "XLSX",
    "XLSM",
    "XLSB",
    "XLT",
    "XLTX",
    "XLTM",
    "CSV",
    "ODS",
  ];

  const powerPointExtension = [
    "PPT",
    "PPTX",
    "PPTM",
    "PPS",
    "PPSX",
    "PPSM",
    "POT",
    "POTX",
    "POTM",
    "ODP",
  ];

  const wordExtension = ["DOC", "DOCX", "RTF", "ODT"];

  if (excelExtension.includes(ext)) {
    return <ExcelSVG />;
  }

  if (powerPointExtension.includes(ext)) {
    return <PowerPointSVG />;
  }

  if (wordExtension.includes(ext)) {
    return <DocSVG />;
  }

  return <PdfSVG />
};

/**
 * Helper function to format file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Check if a file extension represents a document file
 * @param extension - File extension
 * @returns True if it's a document file
 */
export const isDocumentFile = (extension: string): boolean => {
  const docExtensions = ["DOC", "DOCX", "RTF", "ODT"];
  return docExtensions.includes(extension.toUpperCase());
};

/**
 * Check if a file extension represents a PDF file
 * @param extension - File extension
 * @returns True if it's a PDF file
 */
export const isPdfFile = (extension: string): boolean => {
  return extension.toUpperCase() === "PDF";
};

/**
 * Check if a file extension represents a spreadsheet file
 * @param extension - File extension
 * @returns True if it's a spreadsheet file
 */
export const isSpreadsheetFile = (extension: string): boolean => {
  const spreadsheetExtensions = [
    "XLS",
    "XLSX",
    "XLSM",
    "XLSB",
    "XLT",
    "XLTX",
    "XLTM",
    "CSV",
    "ODS",
  ];
  return spreadsheetExtensions.includes(extension.toUpperCase());
};

/**
 * Check if a file extension represents a presentation file
 * @param extension - File extension
 * @returns True if it's a presentation file
 */
export const isPresentationFile = (extension: string): boolean => {
  const presentationExtensions = [
    "PPT",
    "PPTX",
    "PPTM",
    "PPS",
    "PPSX",
    "PPSM",
    "POT",
    "POTX",
    "POTM",
    "ODP",
  ];
  return presentationExtensions.includes(extension.toUpperCase());
};

/**
 * Check if a file is viewable/amendable (supports documents, PDFs, and spreadsheets)
 * @param fileName - The file name
 * @param fileType - The file MIME type or type string
 * @returns True if the file can be viewed/amended
 */
export const isViewableFile = (fileName: string, fileType?: string): boolean => {
  if (!fileName && !fileType) return false;
  
  const extension = getFileExtension(fileName, fileType || "");
  
  return (
    isDocumentFile(extension) ||
    isPdfFile(extension) ||
    isSpreadsheetFile(extension)
  );
};

/**
 * Phase 02 docx-preview-rewrite: rich-fidelity DOCX → TipTap-compatible
 * content pipeline. Replaces `convertDocxToHtml` (mammoth-based) once
 * fully wired. This function uses docx-preview to render the DOCX into
 * a detached DOM container, then walks the resulting HTML and extracts
 * structural side-channels (page boundaries, headers, footers) needed
 * by the pagination plugin.
 *
 * Returns:
 *   html              — TipTap-compatible HTML for setContent (no <section>
 *                       wrappers; <header>/<footer> stripped from main flow)
 *   styleHtml         — Word's stylesheet rendered as <style> content;
 *                       caller may inject into the document head to enable
 *                       per-Word-style CSS class rendering
 *   sectionBoundaries — doc-position offsets where each new page starts;
 *                       consumed by pagination plugin via meta-set tr
 *   headers           — per-page-index source-doc header HTML
 *   footers           — per-page-index source-doc footer HTML
 *
 * Current scope (T2a — skeleton):
 *   Returns docx-preview's raw output untranslated. Side channels are
 *   stubbed. Subsequent T2 sub-tasks fill in the translation logic.
 */
export type DocxTipTapContent = {
  html: string;
  styleHtml: string;
  sectionBoundaries: number[];
  headers: Array<{ pageIndex: number; html: string }>;
  footers: Array<{ pageIndex: number; html: string }>;
};

export async function convertDocxToTipTapContent(
  arrayBuffer: ArrayBuffer
): Promise<DocxTipTapContent> {
  const docxPreview = await import("docx-preview");

  // Detached containers — never attached to the document tree. docx-preview
  // writes structural HTML into bodyEl and a <style> block into styleEl.
  const bodyEl = document.createElement("div");
  const styleEl = document.createElement("div");

  await docxPreview.renderAsync(arrayBuffer, bodyEl, styleEl, {
    breakPages: true,
    renderHeaders: true,
    renderFooters: true,
    renderFootnotes: true,
    renderEndnotes: true,
    inWrapper: true,
    // ignoreFonts true: don't try to download/embed Word fonts from the
    // docx zip. We keep the inline font-family on spans via TextStyle marks
    // (T2f + T3); browser font fallback handles missing faces.
    ignoreFonts: true,
  });

  // T2b: compute per-page block-index boundaries from <section> children.
  // Done BEFORE structural unwrap (T2c) so we can read .docx-wrapper >
  // section > article hierarchy. Side channel format: array of
  // TOP-LEVEL BLOCK INDICES where each new page starts.
  const sectionBoundaries = computeSectionBoundaries(bodyEl);

  // T2d: extract <header> / <footer> content from each section into
  // side channels keyed by page index. Headers/footers don't survive
  // TipTap setContent as DOM elements (no extension preserves them);
  // pagination plugin renders them as Decoration.widget overlays.
  // MUST run before T2c's structural unwrap which strips header/footer.
  const { headers, footers } = extractHeadersFooters(bodyEl);

  // T2c: structural unwrap — strip docx-preview's <div class="docx-wrapper">,
  // <section> (one per Word page), and <article> wrappers. After this pass
  // the body's direct children are the actual content blocks (<p>, <table>,
  // <hr>, etc.) ready for TipTap setContent. <p style="text-align: ...">
  // passthrough is automatic — docx-preview emits exactly the form TipTap's
  // TextAlign extension parses.
  unwrapDocxStructure(bodyEl);

  // T2f: prep inline-font spans for TipTap's TextStyle mark.
  // docx-preview emits <span style="font-family: X; font-size: Yp;
  // min-height: Yp;">text</span>. TipTap's TextStyle + FontFamily +
  // FontSize extensions (registered in T3) parse these spans during
  // setContent and convert to text marks. min-height is a docx-preview
  // rendering artifact (line-height-ish adjustment) with no meaning in
  // a TipTap editor — strip it so it doesn't end up as a TextStyle
  // attribute via the style="" parser.
  cleanupInlineFontSpans(bodyEl);

  // T2e: translate Word-style class names to data-docx-style attributes.
  // docx-preview emits classes like `docx_bodytext`, `docx_heading_1`,
  // `docx_article_l2` — the Word style ID prefixed with `docx_`. We
  // translate each to `data-docx-style="<word-style-name>"` so CSS rules
  // in collaboration.css (T5) can target them via attribute selectors
  // without depending on TipTap preserving class attributes.
  //
  // Requires the Paragraph extension to preserve the data-docx-style
  // attribute (added in T3 alongside TextStyle / FontFamily / FontSize).
  // Until T3 ships, the attribute is emitted in HTML but stripped by
  // TipTap's default Paragraph node on setContent — harmless.
  translateWordStyleClasses(bodyEl);

  return {
    html: bodyEl.innerHTML,
    styleHtml: styleEl.innerHTML,
    sectionBoundaries,
    headers,
    footers,
  };
}

/**
 * Strip docx-preview's `min-height` artifact from inline-style spans.
 * docx-preview adds `min-height: Yp` to spans alongside `font-family`
 * and `font-size` to control line-height in its rendered output. We
 * don't need it in TipTap; removing prevents it from leaking into
 * TextStyle marks via TipTap's style="" parser.
 *
 * Leaves `font-family` and `font-size` intact — TipTap's FontFamily /
 * FontSize extensions (registered in T3) parse them on setContent.
 */
function cleanupInlineFontSpans(bodyEl: HTMLElement): void {
  const spans = bodyEl.querySelectorAll(
    "span[style]"
  ) as NodeListOf<HTMLSpanElement>;
  spans.forEach((span) => {
    const cleaned = span
      .getAttribute("style")!
      .split(";")
      .map((decl) => decl.trim())
      .filter(
        (decl) => decl.length > 0 && !decl.toLowerCase().startsWith("min-height")
      )
      .join("; ");
    if (cleaned) {
      span.setAttribute("style", cleaned);
    } else {
      span.removeAttribute("style");
    }
  });
}

/**
 * Translate Word-style class names (`docx_bodytext`, `docx_heading_1`,
 * `docx_article_l2`, etc.) emitted by docx-preview into stable
 * `data-docx-style="<style-name>"` attributes that CSS rules in
 * collaboration.css can target.
 *
 * Conversion: strip the `docx_` prefix, snake_case → Title Case with
 * spaces. So `docx_bodytext` → "BodyText", `docx_heading_1` → "Heading 1",
 * `docx_article_l2` → "Article L2". These match Word's style display
 * names closely enough that CSS rule authoring can use familiar names.
 *
 * Removes the original `docx_*` class from the element to avoid double
 * styling once CSS rules land — the per-Word-style appearance becomes
 * data-attribute-driven, not class-driven.
 */
function translateWordStyleClasses(bodyEl: HTMLElement): void {
  const candidates = bodyEl.querySelectorAll(
    "[class*='docx_']"
  ) as NodeListOf<HTMLElement>;
  candidates.forEach((el) => {
    const docxClasses = Array.from(el.classList).filter((c) =>
      c.startsWith("docx_")
    );
    if (docxClasses.length === 0) return;
    // Use the first docx_* class — typically there's just one per element.
    const wordStyleId = docxClasses[0].slice("docx_".length);
    const wordStyleName = wordStyleId
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    el.setAttribute("data-docx-style", wordStyleName);
    // Strip docx_* classes so CSS theming becomes purely data-attr driven.
    docxClasses.forEach((c) => el.classList.remove(c));
    if (el.classList.length === 0) {
      el.removeAttribute("class");
    }
  });
}

/**
 * Extract <header> and <footer> content from each .docx-wrapper > section.
 * Returns side-channel arrays keyed by 0-based page index. Strips ONLY
 * empty headers/footers from the DOM during extraction; non-empty
 * elements are left for unwrapDocxStructure (T2c) to remove after.
 *
 * REQ-R-04: pagination plugin consumes these to render Decoration.widget
 * overlays at page boundaries. Headers with no meaningful content
 * (whitespace only, single <br>, etc.) are skipped — empty source-doc
 * headers should produce empty margins, not blank widget chrome.
 */
function extractHeadersFooters(bodyEl: HTMLElement): {
  headers: Array<{ pageIndex: number; html: string }>;
  footers: Array<{ pageIndex: number; html: string }>;
} {
  const headers: Array<{ pageIndex: number; html: string }> = [];
  const footers: Array<{ pageIndex: number; html: string }> = [];

  const sections = Array.from(
    bodyEl.querySelectorAll(".docx-wrapper > section, :scope > section")
  );

  sections.forEach((section, pageIndex) => {
    const header = section.querySelector(":scope > header");
    if (header && hasContent(header)) {
      headers.push({ pageIndex, html: header.innerHTML });
    }
    const footer = section.querySelector(":scope > footer");
    if (footer && hasContent(footer)) {
      footers.push({ pageIndex, html: footer.innerHTML });
    }
  });

  return { headers, footers };
}

/** Returns true if element has visible/meaningful content (any non-whitespace text OR any non-<br> child element). */
function hasContent(el: Element): boolean {
  if ((el.textContent || "").trim().length > 0) return true;
  const children = Array.from(el.children);
  return children.some((c) => c.tagName !== "BR");
}

/**
 * Unwrap docx-preview's structural containers (`.docx-wrapper`, `<section>`,
 * `<article>`) so the body's direct children become a flat list of content
 * blocks that TipTap can consume via setContent. Operates in-place.
 *
 * `<header>` and `<footer>` are also removed here (T2d extracts their
 * content to side channels first; this pass just strips the now-empty
 * elements from the tree).
 */
function unwrapDocxStructure(bodyEl: HTMLElement): void {
  // Find docx-wrapper (the outer container). If present, its children
  // are <section>s; unwrap the wrapper so sections become direct children
  // of bodyEl.
  const wrapper = bodyEl.querySelector(":scope > .docx-wrapper");
  if (wrapper) {
    while (wrapper.firstChild) {
      bodyEl.insertBefore(wrapper.firstChild, wrapper);
    }
    wrapper.remove();
  }

  // Now bodyEl's direct children are <section>s. Unwrap each.
  const sections = Array.from(bodyEl.querySelectorAll(":scope > section"));
  sections.forEach((section) => {
    // Remove headers/footers (their content already extracted to side
    // channels by T2d; here we just strip the empty containers).
    section.querySelectorAll(":scope > header, :scope > footer").forEach(
      (el) => el.remove()
    );
    // Unwrap <article>: move its children up to <section>, remove <article>.
    const article = section.querySelector(":scope > article");
    if (article) {
      while (article.firstChild) {
        section.insertBefore(article.firstChild, article);
      }
      article.remove();
    }
    // Now <section>'s children are the actual content blocks. Unwrap
    // <section> itself by moving children to bodyEl.
    while (section.firstChild) {
      bodyEl.insertBefore(section.firstChild, section);
    }
    section.remove();
  });
}

function computeSectionBoundaries(bodyEl: HTMLElement): number[] {
  // docx-preview wraps content in `.docx-wrapper > section > article`.
  // Each <section> is one Word page. Block count is the number of
  // direct children of <article> within that section (headers/footers
  // live as direct children of <section>, NOT inside article, so they
  // don't count toward block indices).
  const sections = Array.from(
    bodyEl.querySelectorAll(".docx-wrapper > section, :scope > section")
  );
  if (sections.length === 0) return [];

  const boundaries: number[] = [];
  let cumulativeBlocks = 0;

  sections.forEach((section, sectionIdx) => {
    if (sectionIdx > 0) {
      // New page starts here. Record the block index of its first block.
      boundaries.push(cumulativeBlocks);
    }
    const article = section.querySelector(":scope > article");
    if (article) {
      cumulativeBlocks += article.children.length;
    }
  });

  return boundaries;
}

export async function convertDocxToHtml(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  // Preserve paragraph alignment (Word direct formatting) so centered
  // titles / "TABLE OF CONTENTS" headings don't collapse to left. Mammoth
  // drops alignment by default; we tag aligned paragraphs with a synthetic
  // styleName, map it to a marker class via styleMap, then post-process to
  // an inline `style="text-align: ..."` so TipTap's TextAlign extension
  // picks it up on setContent.
  // Style IDs that map to heading tags (h1-h6) via mammoth's default
  // styleMap OR our custom rules below. Preserved here — alignment
  // override skipped — so the heading mapping survives. Trade-off: a
  // paragraph that has BOTH a heading style AND direct-alignment
  // formatting loses the alignment in the rendered output (e.g.
  // "TABLE OF CONTENTS" is style=Heading2 + alignment=center →
  // becomes <h2> left-aligned). Acceptable for legal-doc review: most
  // centered content lives on the cover page with style=BodyText (which
  // is NOT in this set, so alignment WILL be preserved there).
  const HEADING_STYLE_IDS = new Set([
    "Heading1",
    "Heading2",
    "Heading3",
    "Heading4",
    "Heading5",
    "Heading6",
    "Title",
    "Subtitle",
    "Article",
    "ArticleL2",
    "ScheduleL1",
    "ScheduleL2",
  ]);

  const transformParagraph = (element: { alignment?: string; styleId?: string; children?: Array<{ type?: string; children?: Array<{ type?: string; breakType?: string; value?: string }> }> } & Record<string, unknown>) => {
    // Detect "page-break-only" paragraphs FIRST — Word inserts empty
    // paragraphs containing only a `<w:r><w:br w:type="page"/></w:r>`
    // to force a page break in the middle of a doc. Mammoth's default
    // behavior skips these. We detect and mark them so the styleMap
    // below can emit an <hr> the pagination plugin recognizes as a
    // forced break.
    const runs = (element.children || []).filter((c) => c.type === "run");
    const hasPageBreak = runs.some((r) =>
      (r.children || []).some((c) => c.type === "break" && c.breakType === "page")
    );
    const hasText = runs.some((r) =>
      (r.children || []).some((c) => c.type === "text" && !!c.value)
    );
    if (hasPageBreak && !hasText) {
      return {
        ...element,
        styleId: "PageBreakMarker",
        styleName: "Page Break Marker",
      };
    }

    const a = element.alignment;
    // BUG FIXED 260603: previously gated on `!element.styleId` which
    // skipped EVERY styled paragraph, including BodyText. The Hyperscale
    // doc has its centered title block as BodyText + alignment=center;
    // skipping these meant the title block rendered left-aligned (user
    // catch: "We need to make the content of the document render
    // correctly and not all aligned to the left side"). Now we gate
    // only on heading-style IDs so non-heading styled paragraphs
    // (BodyText, Centre, Normal, etc.) get their alignment preserved.
    if (
      (a === "center" || a === "right" || a === "both" || a === "justify") &&
      !HEADING_STYLE_IDS.has(element.styleId ?? "")
    ) {
      const styleName = a === "both" ? "Align justify" : `Align ${a}`;
      return { ...element, styleId: styleName.replace(/\s/g, ""), styleName };
    }
    return element;
  };
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      transformDocument: (mammoth as unknown as {
        transforms: { paragraph: (fn: typeof transformParagraph) => (element: any) => any };
      }).transforms.paragraph(transformParagraph),
      styleMap: [
        // Alignment markers (paired with transformParagraph above for
        // direct-formatting paragraphs). Word's 'Centre' style is the
        // common case in legal contract templates and bypasses direct
        // formatting entirely — map it directly.
        "p[style-name='Align center'] => p.docx-align-center:fresh",
        "p[style-name='Align right'] => p.docx-align-right:fresh",
        "p[style-name='Align justify'] => p.docx-align-justify:fresh",
        "p[style-name='Centre'] => p.docx-align-center:fresh",
        // Custom section-heading styles used in legal contract templates.
        // Word's stock 'Heading 1'–'Heading 6' are already mapped by
        // mammoth's default styleMap; these add only the TOP-LEVEL
        // 'Article'/'Schedule' families. Article_L3/L4 are intentionally
        // NOT mapped — in the Hyperscale agreement and similar contracts
        // they're nested-clause continuation paragraphs (body text under
        // a section), not visually-distinct headings. Mapping them to
        // <h3>/<h4> would render multi-sentence Force-Majeure-clause-style
        // paragraphs as large bold headings (verified on Hyperscale corpus
        // 260603 — produced 250+ heading tags, almost all over-applied).
        "p[style-name='Article'] => h1:fresh",
        "p[style-name='Article_L2'] => h2:fresh",
        "p[style-name='Schedule_L1'] => h1:fresh",
        "p[style-name='Schedule_L2'] => h2:fresh",
        // Word's explicit page breaks. Hyperscale doc encodes them as
        // empty paragraphs containing a single `<w:r><w:br w:type="page"/></w:r>`
        // run — detected in transformParagraph above and re-tagged with
        // styleId="PageBreakMarker". This rule maps that synthetic style
        // to <hr> which the pagination plugin recognizes as a forced
        // break. The styleMap rule `br[type='page'] => ...` doesn't
        // work here because mammoth's default conversion skips inline
        // page-break run elements entirely.
        "p[style-name='Page Break Marker'] => hr.docx-page-break:fresh",
      ],
      convertImage: mammoth.images.imgElement((element) =>
        element.read("base64").then((base64) => ({
          src: `data:${element.contentType};base64,${base64}`,
        }))
      ),
    }
  );
  let html = result.value || "";
  html = html
    .replace(/<p class="docx-align-center">/g, '<p style="text-align: center">')
    .replace(/<p class="docx-align-right">/g, '<p style="text-align: right">')
    .replace(/<p class="docx-align-justify">/g, '<p style="text-align: justify">');
  // The styleMap `p[style-name='Page Break Marker'] => hr.docx-page-break:fresh`
  // already emits <hr> directly — no post-process needed. TipTap's
  // StarterKit HorizontalRule extension preserves <hr> through
  // setContent; the pagination plugin detects HR elements and forces
  // a page break at their position. CSS hides the <hr> visually.
  // TOC entries: mammoth wraps each entry as `<a href="#_Toc...">title 7</a>`.
  // Split the trailing page number into a SECOND anchor with a distinct
  // synthetic href so TipTap's link mark doesn't merge them back into one
  // run. The CSS rule `p:has(> a[href*="__page"])` then flexes the two
  // anchors as a two-column TOC row with leader dots.
  html = html.replace(
    /(<a href=")(#_Toc[^"]+)(">)([^<]*?)\s+(\d+)(<\/a>)/g,
    '$1$2$3$4$6$1$2__page$3$5$6'
  );
  // Flatten <ol>/<ul> lists into individual paragraphs. The Hyperscale
  // agreement uses a 27-item <ol> for definitions which renders ~2500px
  // tall as one atomic ProseMirror block — pagination can't split inside
  // a list, so the entire list lands on one page leaving the previous
  // page mostly empty. Flattening to individual <p> elements with manual
  // numbering makes each definition a paginable unit; pages flow
  // naturally.
  //
  // Trade-off: loses semantic <ol> structure (a11y regression — screen
  // readers no longer announce as list). Acceptable for legal-doc review
  // workflows where pagination fidelity matters more than list semantics.
  //
  // DOMParser-based flattening (handles arbitrary nested list structures
  // correctly; earlier regex approach produced nested <p> when
  // <ul><li><ol>...</ol></li></ul> patterns appeared in the Hyperscale doc).
  html = flattenLists(html);
  return html;
}

function flattenLists(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, "text/html");
  const body = doc.body;

  const collectLists = (): Element[] =>
    Array.from(body.querySelectorAll("ol, ul"));
  const depth = (el: Element): number => {
    let d = 0;
    let n: Element | null = el;
    while (n && n !== body) {
      d += 1;
      n = n.parentElement;
    }
    return d;
  };

  // Process deepest-first. By the time we flatten an outer list, its
  // inner lists have already been replaced with plain <p> elements,
  // so we never end up with nested <p> output.
  let lists = collectLists();
  while (lists.length > 0) {
    lists.sort((a, b) => depth(b) - depth(a));
    flattenOneList(lists[0], doc);
    lists = collectLists();
  }

  // Catch orphan <li> (some Word docs emit them outside <ol>/<ul>).
  Array.from(body.querySelectorAll("li")).forEach((li) => {
    const p = doc.createElement("p");
    p.innerHTML = li.innerHTML.trim();
    li.parentNode?.replaceChild(p, li);
  });

  return body.innerHTML;
}

function flattenOneList(listEl: Element, doc: Document): void {
  const isOrdered = listEl.tagName === "OL";
  const items = Array.from(listEl.children).filter(
    (c) => c.tagName === "LI"
  );
  const parent = listEl.parentNode;
  if (!parent) return;

  const replacements: Node[] = [];
  const blockTags = new Set([
    "P",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "BLOCKQUOTE",
    "TABLE",
    "PRE",
  ]);

  items.forEach((li, i) => {
    const prefix = isOrdered ? `${i + 1}.  ` : `•  `;
    const blockChildren = Array.from(li.children).filter((c) =>
      blockTags.has(c.tagName)
    );

    if (blockChildren.length === 0) {
      // No nested blocks — wrap li's content in a single <p>.
      const p = doc.createElement("p");
      p.innerHTML = `${prefix}${li.innerHTML.trim()}`;
      replacements.push(p);
      return;
    }

    // Has nested blocks (typically: nested list previously flattened
    // to <p>s, or paragraph break inside the li in source doc). Build
    // a leading paragraph from any inline content before the first
    // block, then hoist the block children.
    let leading = "";
    let hitBlock = false;
    Array.from(li.childNodes).forEach((child) => {
      if (hitBlock) return;
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        if (blockChildren.includes(el)) {
          hitBlock = true;
          return;
        }
        leading += el.outerHTML;
      } else if (child.nodeType === Node.TEXT_NODE) {
        leading += child.textContent || "";
      }
    });

    if (leading.trim()) {
      const leadingP = doc.createElement("p");
      leadingP.innerHTML = `${prefix}${leading.trim()}`;
      replacements.push(leadingP);
    } else {
      // No leading content — inject prefix into the first block child.
      const first = blockChildren[0] as HTMLElement;
      first.innerHTML = `${prefix}${first.innerHTML}`;
    }

    blockChildren.forEach((b) => replacements.push(b));
  });

  replacements.forEach((r) => parent.insertBefore(r, listEl));
  parent.removeChild(listEl);
}

// Helper function for converting PDF to HTMl
export async function convertPdfToHtml(
  arrayBuffer: ArrayBuffer,
  options?: { mode?: "fast" | "rich" }
): Promise<string> {
  const { pdfjs } = await import("react-pdf");
  const result = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const numPages = result.numPages;
  const htmlPages: string[] = [];
  const mode = options?.mode ?? "fast";

  for (let i = 1; i <= numPages; i++) {
    const page = await result.getPage(i);
    const textContent = await page.getTextContent();
    const lines = groupPdfLines(textContent.items as any[]);
    htmlPages.push(mode === "fast" ? formatLinesToHtmlFast(lines) : formatLinesToHtml(lines));
  }

  return htmlPages.join("<hr>");
}

function groupPdfLines(items: any[]): string[] {
  const lines: string[] = [];
  let currentLine: string[] = [];
  let lastY: number | null = null;
  for (const item of items) {
    const y = item.transform?.[5] ?? item.transform?.[4] ?? 0;
    const text = item.str ?? "";
    if (lastY === null) {
      currentLine.push(text);
      lastY = y;
      continue;
    }
    const sameLine = Math.abs(y - lastY) < 2;
    if (sameLine) {
      currentLine.push(text);
    } else {
      lines.push(currentLine.join(" "));
      currentLine = [text];
      lastY = y;
    }
  }
  if (currentLine.length) lines.push(currentLine.join(" "));
  return lines;
}

function formatLinesToHtml(lines: string[]): string {
  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const linkify = (s: string) =>
    s.replace(
      /\b((?:https?:\/\/|www\.)[^\s<]+)\b/gi,
      (m) =>
        `<a href="${m.startsWith("www.") ? `https://${m}` : m}" target="_blank" rel="noopener noreferrer">${m}</a>`
    );

  const inlineFormat = (s: string) => {
    let x = escapeHtml(s);
    x = x.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    x = x.replace(/__(.+?)__/g, "<strong>$1</strong>");
    x = x.replace(/\*(?!\s)([^*]+)\*/g, "<em>$1</em>");
    x = x.replace(/_(?!\s)([^_]+)_/g, "<em>$1</em>");
    x = x.replace(/`([^`]+)`/g, "<code>$1</code>");
    x = linkify(x);
    return x;
  };

  const out: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let inCode = false;
  let inBlockQuote = false;

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };
  const closeBlockQuote = () => {
    if (inBlockQuote) {
      out.push("</blockquote>");
      inBlockQuote = false;
    }
  };
  const closeCode = () => {
    if (inCode) {
      out.push("</code></pre>");
      inCode = false;
    }
  };

  for (const raw of lines) {
    const t = raw.trim();
    if (/^```/.test(t)) {
      closeList();
      closeBlockQuote();
      if (inCode) {
        closeCode();
      } else {
        out.push("<pre><code>");
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      out.push(escapeHtml(raw));
      continue;
    }
    if (!t) {
      closeList();
      closeBlockQuote();
      continue;
    }
    if (/^[-*_]{3,}$/.test(t)) {
      closeList();
      closeBlockQuote();
      out.push("<hr>");
      continue;
    }
    if (/^>\s?/.test(t)) {
      closeList();
      if (!inBlockQuote) {
        out.push("<blockquote>");
        inBlockQuote = true;
      }
      out.push(`<p>${inlineFormat(t.replace(/^>\s?/, ""))}</p>`);
      continue;
    } else if (inBlockQuote) {
      closeBlockQuote();
    }

    const taskItem = /^(?:[-*]|(?:\d+|[A-Za-z])[.)])\s+\[(\s|x|X)\]\s+(.+)$/.exec(t);
    if (taskItem) {
      const checked = /x/i.test(taskItem[1]);
      if (listType !== "ul") {
        closeList();
        out.push("<ul>");
        listType = "ul";
      }
      out.push(
        `<li><input type="checkbox" disabled ${checked ? "checked" : ""}> ${inlineFormat(taskItem[2])}</li>`
      );
      continue;
    }

    if (/^([•·\-*–—●▪○]\s+)/.test(t)) {
      if (listType !== "ul") {
        closeList();
        out.push("<ul>");
        listType = "ul";
      }
      out.push(`<li>${inlineFormat(t.replace(/^([•·\-*–—●▪○]\s+)/, ""))}</li>`);
      continue;
    }

    if (/^((?:\d+|[A-Za-z])[.)]\s+)/.test(t)) {
      if (listType !== "ol") {
        closeList();
        out.push("<ol>");
        listType = "ol";
      }
      out.push(`<li>${inlineFormat(t.replace(/^((?:\d+|[A-Za-z])[.)]\s+)/, ""))}</li>`);
      continue;
    }

    closeList();

    const letters = t.replace(/[^A-Za-z]/g, "").length;
    const upper = t.replace(/[^A-Z]/g, "").length;
    const upperRatio = letters ? upper / letters : 0;
    if ((t.length <= 30 && upperRatio >= 0.85) || /^#{1}\s+/.test(t)) {
      out.push(`<h1>${inlineFormat(t.replace(/^#\s+/, "").replace(/:$/, ""))}</h1>`);
      continue;
    }
    if ((t.length <= 50 && upperRatio >= 0.8) || /^#{2}\s+/.test(t)) {
      out.push(`<h2>${inlineFormat(t.replace(/^##\s+/, "").replace(/:$/, ""))}</h2>`);
      continue;
    }
    if ((t.length < 60 && /^[A-Z0-9 -]+$/.test(t)) || (t.length < 80 && /:$/.test(t)) || /^#{3}\s+/.test(t)) {
      out.push(`<h3>${inlineFormat(t.replace(/^###\s+/, "").replace(/:$/, ""))}</h3>`);
      continue;
    }

    out.push(`<p>${inlineFormat(t)}</p>`);
  }

  closeList();
  closeBlockQuote();
  closeCode();
  return out.join("");
}

function formatLinesToHtmlFast(lines: string[]): string {
  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const out: string[] = [];
  for (const raw of lines) {
    const t = raw.trim();
    if (!t) continue;
    out.push(`<p>${escapeHtml(t)}</p>`);
  }
  return out.join("");
}

// Helper function for converting Spreadsheet to HTMl
export async function convertSpreadsheetToHtml(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  const escapeHtml = (s: string) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const XLSX = await import("xlsx");
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const parts: string[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    parts.push(`<h2>${escapeHtml(sheetName)}</h2>`);

    if (!rows || rows.length === 0) {
      parts.push("<p></p>");
      continue;
    }

    const colCount = Math.max(...rows.map((r) => (r ? r.length : 0)));
    const fmtCell = (v: any) => (v === null || v === undefined ? "" : escapeHtml(v));

    parts.push(`<table><thead>`);
    const header = rows[0] as any[];
    parts.push(
      `<tr>${Array.from({ length: colCount }, (_, i) => `<th>${fmtCell(header?.[i])}</th>`).join("")}</tr>`
    );
    parts.push(`</thead><tbody>`);
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as any[];
      parts.push(
        `<tr>${Array.from({ length: colCount }, (_, j) => `<td>${fmtCell(row?.[j])}</td>`).join("")}</tr>`
      );
    }
    parts.push(`</tbody></table>`);
  }

  return parts.join("");
}
