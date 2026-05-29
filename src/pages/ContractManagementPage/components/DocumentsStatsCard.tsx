import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

type Props = {
  count?: number;
};

const DocumentsStatsCard: React.FC<Props> = ({ count }) => {
  return (
    <Card className="border-slate-200 w-fit dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="p-6 flex items-center justify-between gap-12">
        <div className="space-y-1">
          <p className="text-sm text-slate-600 dark:text-slate-400">Documents</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {count ?? 0}
          </p>
        </div>
        <div className="rounded-full bg-green-50 dark:bg-green-900/30 h-12 w-12 flex items-center justify-center" aria-hidden>
          <div className="rounded-full bg-white/70 dark:bg-slate-800/70 h-8 w-8 flex items-center justify-center shadow-sm">
            <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentsStatsCard;

