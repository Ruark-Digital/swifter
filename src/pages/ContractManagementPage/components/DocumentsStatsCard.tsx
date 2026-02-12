import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

type Props = {
  count?: number;
};

const DocumentsStatsCard: React.FC<Props> = ({ count }) => {
  return (
    <Card className="border-slate-200 w-fit">
      <CardContent className="p-6 flex items-center justify-between gap-12">
        <div className="space-y-1">
          <p className="text-sm text-slate-600">Documents</p>
          <p className="text-2xl font-semibold text-slate-900">
            {count ?? 0}
          </p>
        </div>
        <div className="rounded-full bg-green-50 h-12 w-12 flex items-center justify-center" aria-hidden>
          <div className="rounded-full bg-white/70 h-8 w-8 flex items-center justify-center shadow-sm">
            <FileText className="h-5 w-5 text-green-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentsStatsCard;

