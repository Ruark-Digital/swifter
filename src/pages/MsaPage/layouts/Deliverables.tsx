import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import { useToastHandler } from "@/hooks/useToaster";
import type { ApiResponseError } from "@/types";
import DeliverablesTable, {
  type DeliverableRow,
  type KPIDetail,
} from "@/pages/ContractManagementPage/components/DeliverablesTable";
import DeliverablesStatsCards, {
  type DeliverablesStats,
} from "@/pages/ContractManagementPage/components/DeliverablesStatsCards";
import { ExportReportSheet } from "@/components/layouts/ExportReportSheet";

type Props = {
  contractId?: string;
  isActive?: boolean;
};

type DeliverablesStatsData = {
  total?: number;
  all?: number;
  submitted?: number;
  pending?: number;
  late?: number;
};

const Deliverables: React.FC<Props> = ({ contractId, isActive }) => {
  const {
    isApprover,
    isVendor,
    isProjectManager,
    isManager,
    isCompanyAdmin,
    isSuperAdmin,
    isViewOnly,
  } = useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<{ list?: unknown; stats?: unknown }>({});
  const isCompanyAdminLike = isCompanyAdmin || isSuperAdmin;

  const normalizeKpi = React.useCallback((value: unknown): KPIDetail => {
    if (typeof value === "string") {
      return { kpi: 0, kpiDays: 0, kpiText: value, kpiStatus: "none" };
    }
    const v = (value ?? {}) as any;
    const kpiText =
      typeof v?.kpiText === "string"
        ? v.kpiText
        : typeof v?.kpi === "string"
          ? v.kpi
          : "-";
    return {
      kpi: Number(v?.kpi ?? 0),
      kpiDays: Number(v?.kpiDays ?? 0),
      kpiText,
      kpiStatus: typeof v?.kpiStatus === "string" ? v.kpiStatus : "none",
    };
  }, []);

  // MSA-specific deliverable endpoints added in swagger v2.3.0 — same
  // shape as contract deliverables (list / stats / detail / approve /
  // submit) but live under `/msa-contracts/...` not `/contracts/...`.
  // DeliverablesTable interpolates `basePath` for every action, so swapping
  // the prefix here routes the whole tab to the MSA endpoints.
  const basePath = React.useMemo(() => {
    if (!contractId) return "";
    if (isVendor || isProjectManager)
      return `/contract/vendor/msa-contracts/${contractId}/deliverables`;
    if (isApprover)
      return `/contract/approver/msa-contracts/${contractId}/deliverables`;
    if (isManager || isCompanyAdminLike)
      return `/contract/manager/msa-contracts/${contractId}/deliverables`;
    if (isViewOnly)
      return `/contract/user/msa-contracts/${contractId}/deliverables`;
    return `/contract/user/msa-contracts/${contractId}/deliverables`;
  }, [
    contractId,
    isApprover,
    isCompanyAdminLike,
    isManager,
    isVendor,
    isProjectManager,
    isViewOnly,
  ]);

  const listQueryKey = ["msa-deliverables", contractId, basePath] as const;
  const statsQueryKey = ["msa-deliverables-stats", contractId, basePath] as const;

  const { data: listRes, isLoading: listLoading, error: listError } = useQuery({
    queryKey: listQueryKey,
    queryFn: async () => {
      const res = await getRequest({ url: basePath });
      return res.data as { data?: any };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const { data: statsRes, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: statsQueryKey,
    queryFn: async () => {
      const res = await getRequest({ url: `${basePath}/stats` });
      return res.data as { data?: DeliverablesStatsData };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  React.useEffect(() => {
    toastErrorRef.current = toastHandler.error;
  }, [toastHandler.error]);

  React.useEffect(() => {
    if (!listError) return;
    if (lastErrorRef.current.list === listError) return;
    lastErrorRef.current.list = listError;
    toastErrorRef.current("MSA Deliverables", listError as ApiResponseError);
  }, [listError]);

  React.useEffect(() => {
    if (!statsError) return;
    if (lastErrorRef.current.stats === statsError) return;
    lastErrorRef.current.stats = statsError;
    toastErrorRef.current("MSA Deliverables Stats", statsError as ApiResponseError);
  }, [statsError]);

  const rows = React.useMemo<DeliverableRow[]>(() => {
    const payload = (listRes as any)?.data;
    const items: any[] = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

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
      kpi: normalizeKpi(it?.kpi),
      status:
        (it?.status === "approved"
          ? "Approved"
          : it?.status === "rejected"
            ? "Rejected"
            : it?.status === "under_review"
              ? "Under Review"
              : it?.status === "late"
                ? "Late"
                : it?.status === "pending"
                  ? "Pending"
                  : "Under Review") as DeliverableRow["status"],
    }));
  }, [listRes, normalizeKpi]);

  const stats = React.useMemo<DeliverablesStats>(() => {
    const payload = (statsRes as any)?.data;
    const data = payload?.data ?? payload ?? {};
    return {
      all: Number(data?.total ?? data?.all ?? rows.length ?? 0),
      submitted: Number(data?.submitted ?? 0),
      pending: Number(data?.pending ?? 0),
      late: Number(data?.late ?? 0),
    };
  }, [rows.length, statsRes]);

  return (
    <TabsContent value="deliverables" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold leading-[36px] tracking-[-0.02em] text-[#0F0F0F] dark:text-slate-100">
          Deliverable
        </h3>
        <ExportReportSheet contractId={contractId ?? ""} contractType="MsaContract">
          <Button
            variant="outline"
            className="h-10 rounded-xl border-[#E5E7EB] dark:border-slate-800 px-4 text-sm font-semibold text-[#0F0F0F] dark:text-slate-100"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </ExportReportSheet>
      </div>

      <DeliverablesStatsCards stats={stats} isLoading={statsLoading} />

      {contractId ? (
        <DeliverablesTable
          contractId={contractId}
          rows={rows}
          isLoading={Boolean(listLoading || statsLoading)}
          isApprover={isApprover}
          isContractManager={isManager}
          basePath={basePath}
          listInvalidateQueryKey={listQueryKey}
          statsInvalidateQueryKey={statsQueryKey}
          personnelPath={`/contract/vendor/msa-contracts/${contractId}/personnel`}
        />
      ) : null}
    </TabsContent>
  );
};

export default Deliverables;
