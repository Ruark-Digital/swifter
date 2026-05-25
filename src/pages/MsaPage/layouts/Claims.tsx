import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/layouts/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Share2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useToastHandler } from "@/hooks/useToaster";
import { getRequest } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";
import type { ApiResponseError } from "@/types";
import type {
  ContractClaimDTO,
  ContractClaimStatsDTO,
} from "@/pages/ContractManagementPage/api/contractManagerApi";
import ClaimsStatsCards from "@/pages/ContractManagementPage/components/ClaimsStatsCards";
import RequestClaimDialog from "@/pages/ContractManagementPage/components/RequestClaimDialog";
import MSAClaimDetailsSheet from "@/pages/MsaPage/components/MSAClaimDetailsSheet";
import { ExportReportSheet } from "@/components/layouts/ExportReportSheet";

type Props = {
  contractId: string;
  isActive?: boolean;
  actionsDisabled?: boolean;
};

const statusTone = (status?: string) => {
  const normalized = status?.toLowerCase();
  if (normalized === "approved") return "bg-[#EAF7EE] text-[#43A047]";
  if (normalized === "pending" || normalized === "under review") {
    return "bg-[#FFF8E1] text-[#F4B400]";
  }
  if (normalized === "rejected") return "bg-[#FEECEC] text-[#E53935]";
  if (normalized === "closed")
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toISOString().slice(0, 10);
};

const formatImpact = (item: ContractClaimDTO) => {
  const hasTime = typeof item.time === "number" && Number.isFinite(item.time);
  const hasCost = typeof item.cost === "number" && Number.isFinite(item.cost);
  if (hasTime && hasCost)
    return `$${(item.cost || 0) / 1000000}M + ${item.time} days`;
  if (hasTime) return `${item.time} days`;
  if (hasCost) return `$${(item.cost || 0) / 1000000}M`;
  return "-";
};

const Claims: React.FC<Props> = ({ contractId, isActive, actionsDisabled }) => {
  const {
    isManager,
    isApprover,
    isVendor,
    isProjectManager,
    isViewOnly,
  } = useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<{ stats?: unknown; claims?: unknown }>({});
  const [search, setSearch] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const basePath = React.useMemo(() => {
    if (isManager)
      return `/contract/manager/msa-contract/${contractId}`;
    if (isApprover) return `/contract/approver/msa-contract/${contractId}`;
    if (isVendor || isProjectManager)
      return `/contract/vendor/msa-contract/${contractId}`;
    if (isViewOnly) return `/contract/user/msa-contract/${contractId}`;
    return `/contract/user/msa-contract/${contractId}`;
  }, [
    contractId,
    isApprover,
    isManager,
    isVendor,
    isProjectManager,
    isViewOnly,
  ]);

  const claimsPath = React.useMemo(
    () => `${basePath}/claims`,
    [basePath],
  );
  const statsPath = `${claimsPath}/stats`;

  const createPath = React.useMemo(() => {
    if (isVendor || isProjectManager) return `${basePath}/claims`;
    return undefined;
  }, [basePath, isVendor, isProjectManager]);

  const claimsQueryKey = [
    "msa-claims",
    contractId,
    pagination.pageIndex,
    pagination.pageSize,
    claimsPath,
  ];
  const statsQueryKey = [
    "msa-claims",
    "stats",
    contractId,
    statsPath,
  ];

  const {
    data: statsRes,
    isLoading: isStatsLoading,
    error: statsError,
  } = useQuery({
    queryKey: statsQueryKey,
    queryFn: async () => {
      const response = await getRequest({ url: statsPath });
      return response.data as { data?: ContractClaimStatsDTO };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const {
    data: claimsRes,
    isLoading: isClaimsLoading,
    error: claimsError,
  } = useQuery({
    queryKey: claimsQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(pagination.pageIndex + 1));
      params.append("limit", String(pagination.pageSize));
      const response = await getRequest({
        url: `${claimsPath}?${params.toString()}`,
      });
      return response.data as {
        data?: {
          contractClaims?: ContractClaimDTO[];
          claims?: ContractClaimDTO[];
          total?: number;
        };
      };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  React.useEffect(() => {
    toastErrorRef.current = toastHandler.error;
  }, [toastHandler.error]);

  React.useEffect(() => {
    if (!statsError) return;
    if (lastErrorRef.current.stats === statsError) return;
    lastErrorRef.current.stats = statsError;
    toastErrorRef.current("MSA Claims Stats", statsError as ApiResponseError);
  }, [statsError]);

  React.useEffect(() => {
    if (!claimsError) return;
    if (lastErrorRef.current.claims === claimsError) return;
    lastErrorRef.current.claims = claimsError;
    toastErrorRef.current("MSA Claims", claimsError as ApiResponseError);
  }, [claimsError]);

  const rows = React.useMemo(() => {
    const payload = claimsRes?.data;
    if (Array.isArray(payload?.contractClaims)) return payload.contractClaims;
    if (Array.isArray(payload?.claims)) return payload.claims;
    return [];
  }, [claimsRes?.data]);
  const totalCount = claimsRes?.data?.total ?? rows.length;

  const filteredRows = React.useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) => {
      const claimId = row.claimId || "";
      const title = row.title || "";
      const type = row.type || "";
      return (
        claimId.toLowerCase().includes(q) ||
        title.toLowerCase().includes(q) ||
        type.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const columns = React.useMemo<ColumnDef<ContractClaimDTO>[]>(
    () => [
      { accessorKey: "claimId", header: "Claim ID" },
      { accessorKey: "title", header: "Claim Title" },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ getValue }) => getValue<string>() || "-",
      },
      {
        id: "impact",
        header: "Impact",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900">
            {formatImpact(row.original)}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Submitted",
        cell: ({ row }) => {
          const raw = row.original as any;
          return formatDate(raw?.createdAt);
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue<string>() || "pending";
          const label =
            status.toLowerCase() === "pending" ? "Under Review" : status;
          return (
            <Badge
              variant="secondary"
              className={cn(
                "rounded-full border-none px-4 py-1 font-semibold",
                statusTone(status),
              )}
            >
              {label}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <MSAClaimDetailsSheet
            claimId={row.original.claimId}
            contractId={contractId}
            roleBasePath={claimsPath}
          >
            <Button
              variant="link"
              className="h-auto p-0 font-semibold text-[#43A047] hover:no-underline"
            >
              View
            </Button>
          </MSAClaimDetailsSheet>
        ),
      },
    ],
    [],
  );

  return (
    <TabsContent value="claims" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold leading-[36px] tracking-[-0.02em] text-[#0F0F0F] dark:text-slate-100">
          Claims
        </h3>
        <div className="flex items-center gap-4">
          <ExportReportSheet contractId={contractId} contractType="MsaContract">
            <Button
              variant="outline"
              className="h-12 rounded-xl border-[#E5E7EB] px-5 text-base font-semibold text-[#0F0F0F] dark:text-slate-100"
            >
              <Share2 className="mr-2 h-5 w-5" />
              Export Report
            </Button>
          </ExportReportSheet>
          {createPath && (
            <RequestClaimDialog
              createPath={createPath}
              invalidateQueryKey={["msa-claims"]}
              trigger={
                <Button
                  className="h-12 rounded-xl bg-[#2A4467] px-5 text-base font-semibold text-white hover:bg-[#2A4467]/90"
                  disabled={!!actionsDisabled}
                >
                  Create Claim
                </Button>
              }
            />
          )}
        </div>
      </div>

      <ClaimsStatsCards stats={statsRes?.data} isLoading={isStatsLoading} />

      <DataTable<ContractClaimDTO>
        data={filteredRows}
        columns={columns}
        options={{
          disableSelection: true,
          isLoading: isClaimsLoading,
          manualPagination: true,
          pagination,
          setPagination,
          totalCounts: totalCount,
        }}
        header={() => (
          <div className="flex items-center gap-4 border-b border-[#E9E9EB] px-6 py-4">
            <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">Claims</div>
            <div className="relative w-[320px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#6B6B6B] dark:text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search changes"
                className="h-12 rounded-lg border border-[#E5E7EB] dark:border-slate-700 dark:bg-slate-900 pl-9 text-sm text-[#0F0F0F] dark:text-slate-100 placeholder:text-[#6B6B6B] dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        )}
        classNames={{
          container:
            "overflow-hidden rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900",
          table: "border-spacing-y-0",
          tHeader: "bg-[#F9FAFB] dark:bg-slate-800",
          tHeadRow: "border-b border-[#E5E7EB] dark:border-slate-800",
          tBody: "bg-white dark:bg-slate-900",
          tRow: "border-b border-[#E5E7EB] dark:border-slate-800",
          tHead: "px-6 py-3 text-sm font-semibold text-[#2A4467] dark:text-indigo-300",
          tCell: "px-6 py-4 text-sm text-slate-700 dark:text-slate-200 align-top",
        }}
        emptyPlaceholder={
          <div className="px-6 py-8 text-sm text-slate-500">
            No claims found.
          </div>
        }
      />
    </TabsContent>
  );
};

export default Claims;
