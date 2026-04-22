import { pdfjs } from "react-pdf";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";

const newline = "\n";

async function htmlToMarkdown(html: string): Promise<string> {
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeRemark)
    .use(remarkStringify, {
      fences: true,
      bullet: "-",
      rule: "-",
    })
    .process(html);
  return String(file);
}

export async function convertDocxToMarkdown(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value || "";
  return htmlToMarkdown(html);
}

export async function convertDocxToHtml(
  arrayBuffer: ArrayBuffer
): Promise<string> {
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

export async function convertXlsxToMarkdown(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const mdParts: string[] = [];

  for (const sheetName of wb.SheetNames) {
    mdParts.push(`## ${sheetName}`);
    const ws = wb.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (!rows || rows.length === 0) {
      mdParts.push(newline);
      continue;
    }

    const header = rows[0] as any[];
    const colCount = Math.max(...rows.map((r) => (r ? r.length : 0)));
    const fmtCell = (v: any) =>
      v === null || v === undefined ? "" : String(v);
    // header row
    mdParts.push(
      `| ${Array.from({ length: colCount }, (_, i) => fmtCell(header[i])).join(
        " | "
      )} |`
    );
    // separator
    mdParts.push(
      `| ${Array.from({ length: colCount }, () => "---").join(" | ")} |`
    );
    // data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as any[];
      mdParts.push(
        `| ${Array.from({ length: colCount }, (_, j) => fmtCell(row?.[j])).join(
          " | "
        )} |`
      );
    }
    mdParts.push(newline);
  }
  return mdParts.join(newline);
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

function formatLinesToMarkdown(lines: string[]): string {
  const md: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      md.push("");
      continue;
    }
    // bullet detection
    if (/^([•·\-*]\s+)/.test(t)) {
      md.push(`- ${t.replace(/^([•·\-*]\s+)/, "")}`);
      continue;
    }
    // simple heading detection by all caps or trailing colon on short lines
    if (
      (t.length < 60 && /^[A-Z0-9 -]+$/.test(t)) ||
      (t.length < 80 && /:$/.test(t))
    ) {
      md.push(`### ${t.replace(/:$/, "")}`);
      continue;
    }
    md.push(t);
  }
  return md.join(newline);
}

export async function convertPdfToMarkdown(url: string): Promise<string> {
  const loadingTask = pdfjs.getDocument({ url });
  const pdf = await loadingTask.promise;
  const mdPages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const lines = groupPdfLines(tc.items as any[]);
    const md = formatLinesToMarkdown(lines);
    mdPages.push(md);
  }
  return mdPages.join(`${newline}${newline}---${newline}${newline}`);
}

export async function convertFileUrlToMarkdown(
  url: string,
  fileName: string,
  fileType?: string
): Promise<string> {
  const extension = (fileType || fileName.split(".").pop() || "").toLowerCase();
  if (extension.includes("pdf")) {
    return convertPdfToMarkdown(url);
  }
  const res = await fetch(url);
  const ab = await res.arrayBuffer();
  if (extension.includes("doc")) {
    return convertDocxToMarkdown(ab);
  }
  if (extension.includes("xls")) {
    return convertXlsxToMarkdown(ab);
  }
  return `# Unsupported file type\n\nThe selected file cannot be converted to Markdown.\n\n- Name: ${fileName}\n- Type: ${
    fileType ?? "unknown"
  }`;
}
