import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { File as ContractDocument } from "@/types";

type Doc = {
  id: string;
  name: string;
  type: string;
  size: string;
  url?: string;
};

const typeColor: Record<string, string> = {
  DOC: "bg-blue-100 text-blue-700",
  PDF: "bg-red-100 text-red-700",
  XLS: "bg-green-100 text-green-700",
  ZIP: "bg-emerald-100 text-emerald-700",
};

type Props = {
  files?: ContractDocument[];
};

const normalizeType = (file: ContractDocument) => {
  if (typeof file.type === "string" && file.type.trim()) {
    const normalized = file.type.includes("/")
      ? file.type.split("/").pop()
      : file.type;
    return normalized?.toUpperCase() ?? "FILE";
  }

  const source = file.name || file.url;
  if (!source) return "FILE";
  const ext = source.split(".").pop();
  return ext ? ext.toUpperCase() : "FILE";
};

const DocumentsList: React.FC<Props> = ({ files }) => {
  const docs = React.useMemo<Doc[]>(() => {
    if (!files?.length) return [];
    return files.map((file, index) => {
      const size = typeof file.size === "string" ? file.size : "-";
      return {
        id: file._id ?? `${file.name ?? "file"}-${index}`,
        name: file.name ?? "Untitled",
        type: normalizeType(file),
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
                className={`h-10 w-10 rounded-md flex items-center justify-center ${typeColor[d.type] ?? "bg-slate-100 text-slate-700"}`}
              >
                {d.type}
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

