import { type YooptaContentValue, YooEditor } from "@yoopta/editor";
import {
  convertDocxToHtml,
  convertPdfToHtml,
  convertSpreadsheetToHtml,
  getFileExtension,
} from "./fileUtils";
import { html } from "@yoopta/exports";

export async function convertDocxToYoopta(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  const result = await convertDocxToHtml(arrayBuffer);
  return result;
}

export async function convertXlsxToYoopta(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  const result = await convertSpreadsheetToHtml(arrayBuffer);
  return result;
}

export async function convertPdfToYoopta(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  const result = await convertPdfToHtml(arrayBuffer);
  return result;
}

export async function convertFileUrlToYoopta(
  editor: YooEditor,
  url: string,
  fileName: string,
  fileType: string
): Promise<YooptaContentValue> {
  const res = await fetch(url);
  const ab = await res.arrayBuffer();

  let result = "";

  if (getFileExtension(fileName, fileType) === "PDF") {
    result = await convertPdfToYoopta(ab);
  }

  if (getFileExtension(fileName, fileType) === "DOCX") {
    result = await convertDocxToYoopta(ab);
  }

  if (getFileExtension(fileName, fileType) === "XLSX") {
    result = await convertXlsxToYoopta(ab);
  }

  return html.deserialize(editor, result);
}
