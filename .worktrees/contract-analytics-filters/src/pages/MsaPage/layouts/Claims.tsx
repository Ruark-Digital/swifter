import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/layouts/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Share2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
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
  return "bg-slate-100 text-slate-700";
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
  if (hasTime && hasCost) return `$${(item.cost || 0) / 1000000}M + ${item.time} days`;
  if (hasTime) return `${item.time} days`;
  if (hasCost) return `$${(item.cost || 0) / 1000000}M`;
  return "-";
};

const Claims: React.FC<Props> = ({ contractId, isActive, actionsDisabled }) => {
  const { isManager, isApprover, isVendor, isAdmin, isViewOnly } = useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<{ stats?: unknown; claims?: unknown }>({});
  const [search, setSearch] = React.useState("");

  const basePath = React.useMemo(() => {
    if (isManager || isAdmin) return `/contract/manager/msa-contract/${contractId}`;
    if (isApprover) return `/contract/approver/msa-contract/${contractId}`;
    if (isVendor) return `/contract/vendor/msa-contract/${contractId}`;
    if (isViewOnly) return `/contract/user/msa-contract/${contractId}`;
    return `/contract/user/msa-contract/${contractId}`;
  }, [contractId, isAdmin, isApprover, isManager, isVendor, isViewOnly]);

  const claimsPath = React.useMemo(
    () =>
      isManager || isAdmin ? `${basePath}/claims` : `${basePath}/claim`,
    [basePath, isAdmin, isManager],
  );
  const statsPath = `${claimsPath}/stats`;

  const createPath = React.useMemo(() => {
    if (isVendor) return `${basePath}/claim`;
    return undefined;
  }, [basePath, isVendor]);

  const claimsQueryKey = useUserQueryKey(["msa-claims", contractId, claimsPath]);
  const statsQueryKey = useUserQueryKey(["msa-claims-stats", contractId, statsPath]);

  const { data: statsRes, isLoading: isStatsLoading, error: statsError } = useQuery({
    queryKey: statsQueryKey,
    queryFn: async () => {
      const response = await getRequest({ url: statsPath });
      return response.data as { data?: ContractClaimStatsDTO };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const { data: claimsRes, isLoading: isClaimsLoading, error: claimsError } = useQuery({
    queryKey: claimsQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("limit", "50");
      const response = await getRequest({
        url: `${claimsPath}?${params.toString()}`,
      });
      return response.data as {
        data?: {
          contractClaims?: ContractClaimDTO[];
          claims?: ContractClaimDTO[];
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
          <span className="font-semibold text-slate-900">{formatImpact(row.original)}</span>
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
        cell: () => (
          <Button
            variant="link"
            className="h-auto p-0 font-semibold text-[#43A047] hover:no-underline"
          >
            View
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <TabsContent value="claims" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold leading-[36px] tracking-[-0.02em] text-[#0F0F0F]">
          Claims
        </h3>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="h-12 rounded-xl border-[#E5E7EB] px-5 text-base font-semibold text-[#0F0F0F]"
          >
            <Share2 className="mr-2 h-5 w-5" />
            Export Report
          </Button>
          {createPath && (
            <RequestClaimDialog
              createPath={createPath}
              invalidateQueryKey={claimsQueryKey}
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
          disablePagination: true,
          isLoading: isClaimsLoading,
        }}
        header={() => (
          <div className="flex items-center gap-4 border-b border-[#E9E9EB] px-6 py-4">
            <div className="text-base font-semibold text-[#0F0F0F]">Claims</div>
            <div className="relative w-[320px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#6B6B6B]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search changes"
                className="h-12 rounded-lg border border-[#E5E7EB] pl-9 text-sm text-[#0F0F0F] placeholder:text-[#6B6B6B]"
              />
            </div>
          </div>
        )}
        classNames={{
          container: "overflow-hidden rounded-xl border border-[#E5E7EB] bg-white",
          table: "border-spacing-y-0",
          tHeader: "bg-[#F9FAFB]",
          tHeadRow: "border-b border-[#E5E7EB]",
          tBody: "bg-white",
          tRow: "border-b border-[#E5E7EB]",
          tHead: "px-6 py-3 text-sm font-semibold text-[#2A4467]",
          tCell: "px-6 py-4 text-sm text-slate-700 align-top",
        }}
        emptyPlaceholder={
          <div className="px-6 py-8 text-sm text-slate-500">No claims found.</div>
        }
      />
    </TabsContent>
  );
};

export default Claims;
