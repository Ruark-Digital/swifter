import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import KpiTable, { type KpiRow } from "../components/KpiTable";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { format } from "date-fns";
import { ExportReportSheet } from "@/components/layouts/ExportReportSheet";

type Props = {
  contractId: string;
  currency?: string;
  isActive?: boolean;
};

const KpiTabContent: React.FC<Props> = ({ contractId, isActive }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["contract-kpis", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/contracts/${contractId}/kpis`,
      });
      return res.data?.data ?? [];
    },
    enabled: !!contractId && !!isActive,
  });

  const rows: KpiRow[] = (data ?? []).map((item: any) => ({
    kpiId: item.kpiId ?? item.id ?? "",
    category: item.category ?? "",
    currentAvgScore:
      typeof item.currentAvgScore === "number"
        ? `${item.currentAvgScore}%`
        : `${item.currentAvgScore ?? ""}`,
    allTimeAvgScore:
      typeof item.allTimeAvgScore === "number"
        ? `${item.allTimeAvgScore}%`
        : `${item.allTimeAvgScore ?? ""}`,
    lastUpdated: (() => {
      if (!item.lastUpdated) return "-";
      const d = new Date(item.lastUpdated);
      return Number.isNaN(d.getTime()) ? "-" : format(d, "dd MMM yyyy");
    })(),
    actions: ["Update", "View"],
  }));

  return (
    <TabsContent value="kpi" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">
          Key Performance Indicator
        </h3>
        <ExportReportSheet contractId={contractId} contractType="Contract">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] dark:border-slate-700 px-[15px] py-3 text-base font-semibold text-[#0F0F0F] dark:text-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <img
              src="/assets/contract-management/kpi/share.svg"
              className="h-5 w-5"
              alt=""
            />
            Export Report
          </button>
        </ExportReportSheet>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-20">Loading...</div>
      ) : (
        <KpiTable rows={rows} contractId={contractId} />
      )}
    </TabsContent>
  );
};

export default KpiTabContent;
