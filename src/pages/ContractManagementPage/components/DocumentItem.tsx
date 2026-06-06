import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Download, Edit } from "lucide-react";

export type DocType = {
  id: string;
  name: string;
  type: string;
  size: string;
  url?: string;
  icon: React.ReactNode;
};

export const DocumentItem = ({
  d,
  contractId,
  canEdit,
  navigate,
  handlePreview,
  handleDownload,
}: {
  d: DocType;
  contractId?: string;
  canEdit?: boolean;
  navigate?: (path: string) => void;
  handlePreview?: (d: DocType) => void;
  handleDownload?: (d: DocType) => void;
}) => {
  return (
    <Card key={d.id} className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`h-10 w-10`}>{d.icon}</div>

        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{d.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {d.type} • {d.size}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Preview"
            onClick={() => handlePreview?.(d)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canEdit && d.type?.toLowerCase() === "docx" && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit in Collaboration Tool"
              title="Edit in Collaboration Tool"
              onClick={() =>
                navigate?.(
                  // SuperDoc is the default editor. The legacy TipTap/Yoopta
                  // panels stay reachable via `?editor=tiptap` / `?editor=yoopta`.
                  `/collaboration-tool?sourceUrl=${encodeURIComponent(d.url || "")}&fileName=${encodeURIComponent(d.name)}&fileType=${encodeURIComponent(d.type || "")}${contractId ? `&contractId=${encodeURIComponent(contractId)}` : ""}${d.id ? `&fileId=${encodeURIComponent(d.id)}` : ""}&editor=superdoc`,
                )
              }
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Download"
            onClick={() => handleDownload?.(d)}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
