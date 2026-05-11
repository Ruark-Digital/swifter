import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFileExtension, getFileIcon } from "@/lib/fileUtils";
import { DocumentViewer } from "@/components/ui/DocumentViewer";

export type VendorDocument = {
  _id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadDate?: string;
};

type DocumentsTabProps = {
  documents?: VendorDocument[];
};

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ documents = [] }) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<VendorDocument | null>(null);

  const handleViewDocument = (document: VendorDocument) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  // Removed view restrictions - all documents can now be viewed
  const canPreviewDocument = () => {
    return true;
  };

  const handleDownload = (doc: VendorDocument) => {
    const link = window.document.createElement('a');
    link.href = doc.url;
    link.download = doc.name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="pt-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">Vendor's Documents</h3>
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            No documents available for this vendor
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((document) => {
            const fileExtension = getFileExtension(document.name, document.type);
            return (
              <Card key={document._id} className="border hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0">
                        {getFileIcon(fileExtension)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                          {document.name.length > 40 ? document.name.substring(0, 40) + '...' : document.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{fileExtension}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {typeof document.size === 'number' ? `${Math.round(document.size / 1024)}KB` : document.size}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {canPreviewDocument() && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn("h-8 w-8 p-0 bg-gray-100 dark:bg-slate-900 rounded-full hover:bg-gray-200")} 
                          title="View"
                          onClick={() => handleViewDocument(document)}
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 p-0 bg-blue-100 dark:bg-slate-900 rounded-full hover:bg-blue-200" 
                        title="Download"
                        onClick={() => handleDownload(document)}
                      >
                        <Download className="w-4 h-4 text-blue-500 dark:text-gray-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedDocument(null);
          }}
          fileUrl={selectedDocument.url}
          fileName={selectedDocument.name}
          fileType={selectedDocument.type}
        />
      )}
    </div>
  );
};

export default DocumentsTab;
