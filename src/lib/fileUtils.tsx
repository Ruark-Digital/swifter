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

export async function convertDocxToHtml(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.images.imgElement((element) =>
        element.read("base64").then((base64) => ({
          src: `data:${element.contentType};base64,${base64}`,
        }))
      ),
    }
  );
  return result.value || "";
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
