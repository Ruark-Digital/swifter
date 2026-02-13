import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { File as ContractDocument } from "@/types";
import { getFileExtension, getFileIcon } from "@/lib/fileUtils";

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
};

const DocumentsList: React.FC<Props> = ({ files }) => {
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
                <Button variant="ghost" size="icon" aria-label="Preview"><Eye className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="Download"><Download className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
};

export default DocumentsList;

