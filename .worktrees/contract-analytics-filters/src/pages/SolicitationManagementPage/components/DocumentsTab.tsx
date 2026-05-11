import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { File, Eye, Download } from "lucide-react";
import { InvitedVendorCard } from "../SolicitationDetailPage";
import { cn } from "@/lib/utils";
import { getFileExtension, getFileIcon } from "@/lib/fileUtils.tsx";
import { truncate } from "lodash";
import { DocumentViewer } from "@/components/ui/DocumentViewer";

// Document type definition
type SolicitationFile = {
  _id: string;
  name: string;
  url: string;
  size: number;
  type: string;
};

type DocumentsTabProps = {
  files?: SolicitationFile[];
};

const DocumentsTab: React.FC<DocumentsTabProps> = ({ files = [] }) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SolicitationFile | null>(null);

  const handleViewFile = (file: SolicitationFile) => {
    setSelectedFile(file);
    setViewerOpen(true);
  };

  // Removed view restrictions - all files can now be viewed
  const canPreviewFile = () => {
    return true;
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div className="grid grid-cols-4 max-md:grid-cols-1">
        <InvitedVendorCard
          title="Documents"
          count={files.length}
          icon={File}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
        />
      </div>

      {/* All Documents Section */}
      <div>
        <h3 className="text-base font-medium text-gray-900 dark:text-gray-200 mb-4">
          All Documents
        </h3>

        {files.length === 0 ? (
          <div className="text-center py-8">
            <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No documents available for this solicitation
            </p>
          </div>
        ) : (
          /* Documents Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file) => {
              const fileExtension = getFileExtension(file.name, file.type);
              return (
                <Card
                  key={file._id}
                  className={`border hover:shadow-md transition-shadow`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      {/* Left side - Icon and Info */}
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0">
                          {getFileIcon(fileExtension)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium max-w-md text-gray-900 dark:text-gray-200 !truncate">
                            {truncate(file.name, { length: 40 })}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {fileExtension}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {file.size}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side - Action Buttons */}
                      <div className="flex items-center gap-2 ml-2">
                        {canPreviewFile() && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8 p-0 bg-gray-100 dark:bg-slate-900 rounded-full"
                            )}
                            title="View"
                            onClick={() => handleViewFile(file)}
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </Button>
                        )}
                        {/* <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8 p-0 bg-green-100 dark:bg-slate-900 rounded-full"
                           title="Edit"
                         >
                           <Edit className="w-4 h-4 text-green-500 dark:text-gray-500" />
                         </Button> */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 bg-blue-100 dark:bg-slate-900 rounded-full"
                          title="Download"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = file.url;
                            link.download = file.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download className="w-4 h-4 text-blue-500 dark:text-gray-500" />
                        </Button>
                        {/* <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8 p-0 bg-red-100 dark:bg-slate-900 rounded-full"
                           title="Delete"
                         >
                           <Trash2 className="w-4 h-4 text-red-500 dark:text-gray-500" />
                         </Button> */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      {selectedFile && (
        <DocumentViewer
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedFile(null);
          }}
          fileUrl={selectedFile.url}
          fileName={selectedFile.name}
          fileType={selectedFile.type}
        />
      )}
    </div>
  );
};

export default DocumentsTab;
