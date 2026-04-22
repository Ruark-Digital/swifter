/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Loader2, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { getFileExtension } from '../../lib/fileUtils';
import { useTheme } from '../../contexts/ThemeContext';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc =`//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType?: string;
}

interface ExcelData {
  sheetNames: string[];
  sheets: { [key: string]: any[][] };
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType
}) => {
  const { actualTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [docxContent, setDocxContent] = useState<string>('');

  const extension = getFileExtension(fileName, fileType || '');

  useEffect(() => {
    if (isOpen && fileUrl) {
      loadDocument();
    }
  }, [isOpen, fileUrl, fileName]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);

    try {
      if (extension === 'XLS' || extension === 'XLSX') {
        await loadExcelFile();
      } else if (extension === 'DOC' || extension === 'DOCX') {
        await loadWordFile();
      }
      // PDF files are handled by react-pdf component directly
    } catch (err) {
      setError(`Failed to load ${extension} file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadExcelFile = async () => {
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    const sheets: { [key: string]: any[][] } = {};
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    });

    setExcelData({
      sheetNames: workbook.SheetNames,
      sheets
    });
    setActiveSheet(workbook.SheetNames[0]);
  };

  const loadWordFile = async () => {
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    setDocxContent(result.value);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF loading error:', error);
    
    // Check if it's a worker-related error and try fallback
    if (error.message.includes('worker') || error.message.includes('fetch')) {
      // Try unpkg as fallback
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
      setError('PDF worker failed to load from primary CDN. Trying fallback... Please refresh if the issue persists.');
    } else {
      setError(`Failed to load PDF: ${error.message}`);
    }
    
    setLoading(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPDFViewer = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-foreground">
            Page {pageNumber} of {numPages || '?'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber(Math.min(numPages || 1, pageNumber + 1))}
            disabled={pageNumber >= (numPages || 1)}
          >
            Next
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-foreground">{(scale * 100).toFixed(0)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(Math.min(2.0, scale + 0.1))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className={`flex-1 overflow-auto p-4 ${actualTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="flex justify-center dark:text-gray-400">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<Loader2 className="h-8 w-8 animate-spin text-foreground" />}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>
      </div>
    </div>
  );

  const renderExcelViewer = () => {
    if (!excelData) return null;

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            {excelData.sheetNames.map(sheetName => (
              <Button
                key={sheetName}
                variant={activeSheet === sheetName ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSheet(sheetName)}
              >
                {sheetName}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 h-full">
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <tbody>
                {excelData.sheets[activeSheet]?.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex === 0 ? (actualTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50') : ''}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={`border px-3 py-2 text-sm text-foreground dark:text-gray-400 ${
                          actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}
                      >
                        {cell?.toString() || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderWordViewer = () => (
    <div className="flex-1 overflow-auto p-6 h-full">
      <div
        className={`prose max-w-none dark:text-gray-400 ${
          actualTheme === 'dark' ? 'prose-invert' : ''
        }`}
        dangerouslySetInnerHTML={{ __html: docxContent }}
      />
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-foreground" />
          <span className="ml-2 text-foreground">Loading document...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download File
            </Button>
          </div>
        </div>
      );
    }

    switch (extension) {
      case 'PDF':
        return renderPDFViewer();
      case 'XLS':
      case 'XLSX':
        return renderExcelViewer();
      case 'DOC':
      case 'DOCX':
        return renderWordViewer();
      default:
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pt-5">
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate dark:text-gray-200">{fileName}</DialogTitle>
            <div className="flex items-center space-x-2">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>

            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;
