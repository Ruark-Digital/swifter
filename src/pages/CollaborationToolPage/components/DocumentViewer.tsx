import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

// Initialize pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export interface DocumentViewerProps {
  sourceUrl: string;
  fileName: string;
  fileType: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  sourceUrl,
  fileType,
}) => {
  const [excelHtml, setExcelHtml] = useState<string | null>(null);
  const [wordHtml, setWordHtml] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    if (!sourceUrl) return;

    const fetchAndParse = async () => {
      try {
        const response = await fetch(sourceUrl);
        const arrayBuffer = await response.arrayBuffer();

        if (
          fileType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ) {
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const html = XLSX.utils.sheet_to_html(worksheet);
          setExcelHtml(html);
        } else if (
          fileType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setWordHtml(result.value);
        } else if (fileType === "text/plain") {
          const text = new TextDecoder("utf-8").decode(arrayBuffer);
          setTextContent(text);
        }
      } catch (error) {
        console.error("Failed to parse document", error);
      }
    };

    fetchAndParse();
  }, [sourceUrl, fileType]);

  if (!sourceUrl) return null;

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div
      data-testid="document-viewer-container"
      className={`ct-document-viewer h-full w-full overflow-auto bg-gray-50 p-4 dark:bg-slate-900 ${
        fileType === "application/pdf" ? "pdf-viewer" : ""
      } ${
        fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          ? "excel-viewer"
          : ""
      }`}
    >
      {fileType === "application/pdf" && (
        <div className="flex flex-col items-center">
          <Document file={sourceUrl} onLoadSuccess={onDocumentLoadSuccess}>
            <Page pageNumber={pageNumber} />
          </Document>
          {numPages && (
            <div className="flex items-center gap-4 mt-4">
              <button
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber(pageNumber - 1)}
                className="px-3 py-1 bg-white border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              >
                Prev
              </button>
              <span>
                Page {pageNumber} of {numPages}
              </span>
              <button
                disabled={pageNumber >= numPages}
                onClick={() => setPageNumber(pageNumber + 1)}
                className="px-3 py-1 bg-white border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
        excelHtml && (
          <div
            className="excel-table-container bg-white p-4 shadow rounded dark:bg-slate-800 dark:text-slate-100"
            dangerouslySetInnerHTML={{ __html: excelHtml }}
          />
        )}

      {fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
        wordHtml && (
          <div
            className="word-container bg-white p-8 shadow rounded prose max-w-none dark:bg-slate-800 dark:text-slate-100 dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: wordHtml }}
          />
        )}

      {fileType === "text/plain" && textContent && (
        <pre className="text-container bg-white p-4 shadow rounded whitespace-pre-wrap font-mono dark:bg-slate-800 dark:text-slate-100">
          {textContent}
        </pre>
      )}
    </div>
  );
};

export default DocumentViewer;
