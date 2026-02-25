import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import DeliverablesStatsCards from "../components/DeliverablesStatsCards";
import DeliverablesTable, {
  DeliverableRow,
} from "../components/DeliverablesTable";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { useParams } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import type { DeliverablesStats } from "../components/DeliverablesStatsCards";

const DeliverablesTabContent: React.FC = () => {
  const { id: contractId } = useParams<{ id: string }>();
  const { isApprover } = useUserRole();

  const {
    data: listRes,
    isLoading: listLoading,
  } = useQuery({
    queryKey: [
      isApprover ? "approver" : "contract-manager",
      "deliverables",
      contractId,
    ],
    queryFn: async () => {
      const res = await getRequest({
        url: `${isApprover ? "/contract/approver/contracts" : "/contract/manager/contracts"}/${contractId}/deliverables`,
      });
      return res as any;
    },
    enabled: !!contractId,
    staleTime: 60000,
  });

  const rows: DeliverableRow[] = React.useMemo(() => {
    const items: any[] = listRes?.data?.data ?? [];
    return items.map((it) => ({
      id: it?.deliverableId ?? "",
      title: it?.title ?? "",
      dueDate: it?.date ?? "-",
      submissionDate: "-",
      submissionStatus:
        (it?.submissionStatus === "submitted"
          ? "Submitted"
          : it?.submissionStatus === "late"
          ? "Late"
          : "Pending") as DeliverableRow["submissionStatus"],
      kpi: it?.kpi?.kpiText ?? "",
      status:
        (it?.status === "approved"
          ? "Approved"
          : it?.status === "rejected"
          ? "Rejected"
          : "Under Review") as DeliverableRow["status"],
    }));
  }, [listRes]);

  const stats: DeliverablesStats = React.useMemo(() => {
    const src = Array.isArray(listRes?.data?.data) ? listRes.data.data : [];
    const all = src.length;
    const submitted = src.filter((it: any) => it?.submissionStatus === "submitted").length;
    const late = src.filter((it: any) => it?.submissionStatus === "late").length;
    const pending = src.filter(
      (it: any) => !["submitted", "late"].includes(String(it?.submissionStatus ?? "").toLowerCase()),
    ).length;
    return { all, submitted, pending, late };
  }, [listRes]);

  return (
    <TabsContent value="deliverables" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Deliverable</h3>
        <Button variant="outline" className="h-10 rounded-xl px-4">
          <Share2 className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </div>

      <DeliverablesStatsCards stats={stats} isLoading={!!listLoading} />

      <DeliverablesTable
        contractId={contractId ?? ""}
        rows={rows}
        isLoading={!!listLoading}
        isApprover={isApprover}
      />
    </TabsContent>
  );
};

export default DeliverablesTabContent;
