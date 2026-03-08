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
  const { isApprover, isVendor, isManager, isAdmin, isViewOnly } = useUserRole();

  const getBasePath = () => {
    if (isVendor) return `/contract/vendor/contracts/${contractId}/deliverables`;
    if (isApprover) return `/contract/approver/contracts/${contractId}/deliverables`;
    if (isManager) return `/contract/manager/contracts/${contractId}/deliverables`;
    if (isAdmin || isViewOnly) return `/contract/user/contracts/${contractId}/deliverables`;
    return `/contract/user/contracts/${contractId}/deliverables`; // Default fallback
  };

  const basePath = getBasePath();

  const {
    data: listRes,
    isLoading: listLoading,
  } = useQuery({
    queryKey: [
      "deliverables",
      contractId,
      basePath
    ],
    queryFn: async () => {
      const res = await getRequest({
        url: basePath,
      });
      return res as any;
    },
    enabled: !!contractId,
    staleTime: 60000,
  });

  const {
    data: statsRes,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: [
      "deliverables-stats",
      contractId,
      basePath
    ],
    queryFn: async () => {
      const res = await getRequest({
        url: `${basePath}/stats`,
      });
      return res as any;
    },
    enabled: !!contractId,
    staleTime: 60000,
  });

  const rows: DeliverableRow[] = React.useMemo(() => {
    const items: any[] = listRes?.data?.data || listRes?.data || [];
    return items.map((it) => ({
      id: it?.deliverableId ?? it?._id ?? "",
      title: it?.title ?? "",
      dueDate: it?.date ?? it?.dueDate ?? "-",
      submissionDate: it?.submissionDate ?? "-",
      submissionStatus:
        (it?.submissionStatus === "submitted"
          ? "Submitted"
          : it?.submissionStatus === "late"
          ? "Late"
          : "Pending") as DeliverableRow["submissionStatus"],
      kpi: it?.kpi?.kpiText ?? it?.kpi ?? "",
      status:
        (it?.status === "approved"
          ? "Approved"
          : it?.status === "rejected"
          ? "Rejected"
          : "Under Review") as DeliverableRow["status"],
    }));
  }, [listRes]);

  const stats: DeliverablesStats = React.useMemo(() => {
    const data = statsRes?.data?.data || statsRes?.data;
    if (data) {
      return {
        all: data.total ?? data.all ?? 0,
        submitted: data.submitted ?? 0,
        pending: data.pending ?? 0,
        late: data.late ?? 0,
      };
    }
    
    const src = rows;
    const all = src.length;
    const submitted = src.filter((it: any) => it?.submissionStatus === "Submitted").length;
    const late = src.filter((it: any) => it?.submissionStatus === "Late").length;
    const pending = src.filter(
      (it: any) => it?.submissionStatus === "Pending",
    ).length;
    return { all, submitted, pending, late };
  }, [statsRes, rows]);

  return (
    <TabsContent value="deliverables" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Deliverable</h3>
        <Button variant="outline" className="h-10 rounded-xl px-4">
          <Share2 className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </div>

      <DeliverablesStatsCards stats={stats} isLoading={!!listLoading || !!statsLoading} />

      <DeliverablesTable
        contractId={contractId ?? ""}
        rows={rows}
        isLoading={!!listLoading}
        isApprover={isApprover}
        basePath={basePath}
      />
    </TabsContent>
  );
};

export default DeliverablesTabContent;
