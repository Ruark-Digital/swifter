import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import type { ApiResponseError } from "@/types";
import DeliverablesTable, {
  type DeliverableRow,
  type KPIDetail,
} from "@/pages/ContractManagementPage/components/DeliverablesTable";

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
  approved?: number;
  rejected?: number;
  under_review?: number;
};

const toneClasses = {
  gray: { wrap: "bg-slate-100", icon: "text-slate-700 dark:text-slate-200" },
  green: { wrap: "bg-[#EAF7EE]", icon: "text-[#43A047]" },
  yellow: { wrap: "bg-[#FFF8E0]", icon: "text-[#F4B400]" },
  red: { wrap: "bg-[#FEECEC]", icon: "text-[#E53935]" },
};

const StatCard = ({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: keyof typeof toneClasses;
}) => {
  const c = toneClasses[tone];
  return (
    <Card className="border-[#E5E7EB] dark:border-slate-800 rounded-xl shadow-none">
      <CardContent className="px-6 py-5 flex items-center justify-between">
        <div className="space-y-2">
          <div className="text-sm text-[#6B6B6B] dark:text-slate-400 leading-5">{title}</div>
          <div className="text-xl font-semibold leading-8 text-[#0F0F0F] dark:text-slate-100">
            {value}
          </div>
        </div>
        <div className={`h-12 w-12 rounded-full ${c.wrap} flex items-center justify-center`}>
          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
            <FileText className={`h-4 w-4 ${c.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
  // submit) but live under `/msa-contract/...` not `/contracts/...`.
  // DeliverablesTable interpolates `basePath` for every action, so swapping
  // the prefix here routes the whole tab to the MSA endpoints.
  const basePath = React.useMemo(() => {
    if (!contractId) return "";
    if (isVendor || isProjectManager)
      return `/contract/vendor/msa-contract/${contractId}/deliverables`;
    if (isApprover)
      return `/contract/approver/msa-contract/${contractId}/deliverables`;
    if (isManager || isCompanyAdminLike)
      return `/contract/manager/msa-contract/${contractId}/deliverables`;
    if (isViewOnly)
      return `/contract/user/msa-contract/${contractId}/deliverables`;
    return `/contract/user/msa-contract/${contractId}/deliverables`;
  }, [
    contractId,
    isApprover,
    isCompanyAdminLike,
    isManager,
    isVendor,
    isProjectManager,
    isViewOnly,
  ]);

  const listQueryKey = useUserQueryKey(["msa-deliverables", contractId, basePath]);
  const statsQueryKey = useUserQueryKey(["msa-deliverables-stats", contractId, basePath]);

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

  const stats = React.useMemo(() => {
    const payload = (statsRes as any)?.data;
    const data = payload?.data ?? payload ?? {};
    const all = Number(data?.total ?? data?.all ?? rows.length ?? 0);
    return {
      all,
      submitted: Number(data?.submitted ?? 0),
      pending: Number(data?.pending ?? 0),
      late: Number(data?.late ?? 0),
      approved: Number(data?.approved ?? 0),
      rejected: Number(data?.rejected ?? 0),
      underReview: Number(data?.under_review ?? 0),
    };
  }, [rows.length, statsRes]);

  return (
    <TabsContent value="deliverables" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold leading-[36px] tracking-[-0.02em] text-[#0F0F0F] dark:text-slate-100">
          Deliverable
        </h3>
        <Button
          variant="outline"
          className="h-12 rounded-xl border-[#E5E7EB] dark:border-slate-800 px-5 font-semibold text-[#0F0F0F] dark:text-slate-100"
        >
          <Share2 className="mr-2 h-5 w-5" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="All Deliverable" value={stats.all} tone="gray" />
        <StatCard title="Submitted" value={stats.submitted} tone="green" />
        <StatCard title="Pending Submission" value={stats.pending} tone="yellow" />
        <StatCard title="Late Submission" value={stats.late} tone="red" />
        <StatCard title="Approved" value={stats.approved} tone="green" />
        <StatCard title="Rejected" value={stats.rejected} tone="red" />
        <StatCard title="Under Review" value={stats.underReview} tone="yellow" />
      </div>

      {contractId ? (
        <DeliverablesTable
          contractId={contractId}
          rows={rows}
          isLoading={Boolean(listLoading || statsLoading)}
          isApprover={isApprover}
          isContractManager={isManager}
          basePath={basePath}
        />
      ) : null}
    </TabsContent>
  );
};

export default Deliverables;
