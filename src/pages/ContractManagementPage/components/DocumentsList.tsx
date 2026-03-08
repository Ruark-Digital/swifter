import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Download, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { File as ContractDocument } from "@/types";
import { getFileExtension, getFileIcon } from "@/lib/fileUtils";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import { useNavigate } from "react-router-dom";
import { isBefore, startOfDay } from "date-fns";

type Doc = {
  id: string;
  name: string;
  type: string;
  size: string;
  url?: string;
  icon: React.ReactNode;
};

type Props = {
  files?: ContractDocument[];
  effectiveDate?: string;
};

const DocumentsList: React.FC<Props> = ({ files, effectiveDate }) => {
  const navigate = useNavigate();
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [selectedDoc, setSelectedDoc] = React.useState<Doc | null>(null);

  const canEdit = React.useMemo(() => {
    if (!effectiveDate) return true; // Assuming active if no date provided
    return isBefore(startOfDay(new Date()), startOfDay(new Date(effectiveDate)));
  }, [effectiveDate]);

  const docs = React.useMemo<Doc[]>(() => {
    if (!files?.length) return [];
    return files.map((file, index) => {
      const size = typeof file.size === "string" ? file.size : "-";
      const fileExtension = getFileExtension(file.name, file.type);

      return {
        id: file._id ?? `${file.name ?? "file"}-${index}`,
        name: file.name ?? "Untitled",
        icon: getFileIcon(fileExtension),
        type: fileExtension?.toUpperCase() ?? "FILE",
        size,
        url: file.url,
      };
    });
  }, [files]);

  const handlePreview = (doc: Doc) => {
    if (!doc.url) return;
    setSelectedDoc(doc);
    setViewerOpen(true);
  };

  const handleDownload = (doc: Doc) => {
    if (!doc.url) return;
    const a = window.document.createElement("a");
    a.href = doc.url;
    a.download = doc.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-slate-700">All Documents</div>
      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          No documents available.
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((d) => (
          <Card key={d.id} className="border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div
                className={`h-10 w-10`}
              >
                {d.icon}
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{d.name}</p>
                <p className="text-xs text-slate-500">{d.type} • {d.size}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" aria-label="Preview" onClick={() => handlePreview(d)}><Eye className="h-4 w-4" /></Button>
                {canEdit && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    aria-label="Edit in Collaboration Tool" 
                    title="Edit in Collaboration Tool"
                    onClick={() => navigate(`/collaboration-tool?sourceUrl=${encodeURIComponent(d.url || "")}&fileName=${encodeURIComponent(d.name)}&fileType=${encodeURIComponent(d.type || "")}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" aria-label="Download" onClick={() => handleDownload(d)}><Download className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
      {selectedDoc && (
        <DocumentViewer
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedDoc(null);
          }}
          fileUrl={selectedDoc.url as string}
          fileName={selectedDoc.name}
          fileType={getFileExtension(selectedDoc.name, selectedDoc.type)}
        />
      )}
    </div>
  );
};

export default DocumentsList;
