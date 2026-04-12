import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent as MainTabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/layouts/DataTable";
import { Badge } from "@/components/ui/badge";
import { Share2, Search } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useToastHandler } from "@/hooks/useToaster";
import { getRequest } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";
import type { ApiResponse, ApiResponseError } from "@/types";
import ChangeStatsCards from "@/pages/ContractManagementPage/components/ChangeStatsCards";
import CreateChangeDialog from "@/pages/ContractManagementPage/components/CreateChangeDialog";
import ChangeDetailsSheet from "@/pages/ContractManagementPage/components/ChangeDetailsSheet";
import {
  changeTabToApiType,
  formatChangeTypeLabel,
  type ChangeTabValue,
} from "@/pages/ContractManagementPage/lib/contractChanges";
import type {
  ContractChangeDTO,
  ContractChangeStatsDTO,
} from "@/pages/ContractManagementPage/api/contractManagerApi";

type Props = {
  contractId: string;
  isActive?: boolean;
  actionsDisabled?: boolean;
};

type ChangesDataResponse = {
  changes?: ContractChangeDTO[];
  total?: number;
};

const statusTone = (status?: string) => {
  const normalized = status?.toLowerCase();
  if (normalized === "approved") return "bg-[#EAF7EE] text-[#43A047]";
  if (normalized === "pending") return "bg-[#FFF8E1] text-[#F4B400]";
  if (normalized === "rejected") return "bg-[#FEECEC] text-[#E53935]";
  return "bg-slate-100 text-slate-700";
};

const formatChangeValue = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  return `$${value.toLocaleString("en-US")}`;
};

const ChangeManagement: React.FC<Props> = ({
  contractId,
  isActive,
  actionsDisabled,
}) => {
  const { isManager, isApprover, isAdmin, isViewOnly, isVendor } = useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<{ stats?: unknown; list?: unknown }>({});
  const [activeTab, setActiveTab] = React.useState<ChangeTabValue>("all");
  const [search, setSearch] = React.useState("");

  const rolePrefix = React.useMemo(() => {
    if (isManager || isAdmin) return `/contract/manager/msa-contract/${contractId}`;
    if (isApprover) return `/contract/approver/msa-contract/${contractId}`;
    if (isVendor) return `/contract/user/msa-contract/${contractId}`;
    if (isViewOnly) return `/contract/user/msa-contract/${contractId}`;
    return `/contract/user/msa-contract/${contractId}`;
  }, [contractId, isAdmin, isApprover, isManager, isVendor, isViewOnly]);

  const listBasePath = React.useMemo(
    () =>
      isManager || isAdmin ? `${rolePrefix}/changes` : `${rolePrefix}/change`,
    [isAdmin, isManager, rolePrefix],
  );

  const statsQueryKey = useUserQueryKey([
    "msaChanges",
    "stats",
    contractId,
    rolePrefix,
  ]);
  const listQueryKey = useUserQueryKey([
    "msaChanges",
    contractId,
    activeTab,
    rolePrefix,
  ]);

  const { data: statsRes, isLoading: isStatsLoading, error: statsError } =
    useQuery({
      queryKey: statsQueryKey,
      queryFn: async () => {
        const response = await getRequest({ url: `${listBasePath}/stats` });
        return response.data as { data?: ContractChangeStatsDTO };
      },
      enabled: Boolean(contractId) && !!isActive,
      staleTime: 60000,
      retry: false,
    });

  const { data: changesRes, isLoading: isChangesLoading, error: listError } =
    useQuery({
      queryKey: listQueryKey,
      queryFn: async () => {
        const type = changeTabToApiType(activeTab);
        const params = new URLSearchParams();
        params.append("page", "1");
        params.append("limit", "100");
        if (type) params.append("type", type);
        const response = await getRequest({
          url: `${listBasePath}?${params.toString()}`,
        });
        return response as ApiResponse<ChangesDataResponse>;
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
    toastErrorRef.current("MSA Change Stats", statsError as ApiResponseError);
  }, [statsError]);

  React.useEffect(() => {
    if (!listError) return;
    if (lastErrorRef.current.list === listError) return;
    lastErrorRef.current.list = listError;
    toastErrorRef.current("MSA Changes", listError as ApiResponseError);
  }, [listError]);

  const rows = React.useMemo<ContractChangeDTO[]>(() => {
    const payload = changesRes?.data?.data as any;
    if (Array.isArray(payload?.changes)) return payload.changes;
    if (Array.isArray(payload?.contractChanges)) return payload.contractChanges;
    if (Array.isArray(payload?.data?.changes)) return payload.data.changes;
    return [];
  }, [changesRes?.data?.data]);

  const filteredRows = React.useMemo(() => {
    if (!search.trim()) return rows;
    const query = search.toLowerCase();
    return rows.filter((row) => {
      const changeId = row.changeId ?? "";
      const title = row.title ?? "";
      const type = row.type ?? "";
      return (
        changeId.toLowerCase().includes(query) ||
        title.toLowerCase().includes(query) ||
        type.toLowerCase().includes(query)
      );
    });
  }, [rows, search]);

  const columns = React.useMemo<ColumnDef<ContractChangeDTO>[]>(
    () => [
      {
        accessorKey: "changeId",
        header: "Change ID",
        cell: ({ getValue }) => (
          <span className="font-medium text-slate-900">{getValue<string>() || "-"}</span>
        ),
      },
      {
        accessorKey: "title",
        header: "Change Title",
        cell: ({ getValue }) => (
          <span className="font-medium text-slate-900">{getValue<string>() || "-"}</span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ getValue }) => {
          const type = getValue<ContractChangeDTO["type"] | undefined>();
          return type ? formatChangeTypeLabel(type) : "-";
        },
      },
      {
        accessorKey: "value",
        header: "Value",
        cell: ({ getValue }) => formatChangeValue(getValue<number | undefined>()),
      },
      {
        accessorKey: "submittedAt",
        header: "Submitted",
        cell: ({ row }) => {
          const fallback = row.original as any;
          const date = row.original.submittedAt ?? fallback?.createdAt;
          if (!date) return "-";
          const parsed = new Date(date);
          if (Number.isNaN(parsed.getTime())) return "-";
          return parsed.toISOString().slice(0, 10);
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue<string>() || "pending";
          return (
            <Badge
              variant="secondary"
              className={cn(
                "rounded-full border-none px-4 py-1 font-semibold",
                statusTone(status),
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <ChangeDetailsSheet
            contractId={contractId}
            changeId={row.original.changeId || (row.original as any)?._id || ""}
            basePath={listBasePath}
            trigger={
              <Button
                variant="link"
                className="h-auto p-0 font-semibold text-[#43A047] hover:no-underline"
              >
                View
              </Button>
            }
          />
        ),
      },
    ],
    [contractId, listBasePath],
  );

  const stats = statsRes?.data;
  const canCreateChange = isManager || isAdmin;

  return (
    <MainTabsContent value="change" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold leading-[36px] tracking-[-0.02em] text-[#0F0F0F]">
          Change Management
        </h3>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="h-12 rounded-xl border-[#E5E7EB] px-5 text-sm font-semibold text-[#0F0F0F]"
          >
            <Share2 className="mr-2 h-5 w-5" />
            Export Report
          </Button>
          {canCreateChange && (
            <CreateChangeDialog
              trigger={
                <Button
                  className="h-12 rounded-xl bg-[#F3F4F6] px-5 text-sm font-semibold text-[#0F0F0F] hover:bg-[#E5E7EB]"
                  disabled={!!actionsDisabled}
                >
                  Create Change
                </Button>
              }
              contractId={contractId}
              isManager
              documentType="MsaContract"
              invalidateQueryKey={["msaChanges", contractId]}
            />
          )}
        </div>
      </div>

      <ChangeStatsCards stats={stats} isLoading={isStatsLoading} variant="approver" />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ChangeTabValue)}
        className="space-y-4"
      >
        <TabsList className="h-auto rounded-full bg-[#F3F4F6] p-1">
          <TabsTrigger
            value="all"
            className="rounded-full px-6 py-2 text-sm font-semibold data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            All Changes
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="rounded-full px-6 py-2 text-sm font-semibold data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Change Requests
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="rounded-full px-6 py-2 text-sm font-semibold data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Change Orders
          </TabsTrigger>
          <TabsTrigger
            value="directive"
            className="rounded-full px-6 py-2 text-sm font-semibold data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Change Directive
          </TabsTrigger>
          <TabsTrigger
            value="proposal"
            className="rounded-full px-6 py-2 text-sm font-semibold data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Change Proposal
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <DataTable<ContractChangeDTO>
            data={filteredRows}
            columns={columns}
            options={{
              disableSelection: true,
              disablePagination: true,
              isLoading: isChangesLoading,
            }}
            header={() => (
              <div className="flex items-center gap-4 border-b border-[#E9E9EB] px-6 py-4">
                <div className="text-base font-semibold text-[#0F0F0F]">Changes</div>
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
              <div className="px-6 py-8 text-sm text-slate-500">No changes found.</div>
            }
          />
        </TabsContent>
      </Tabs>
    </MainTabsContent>
  );
};

export default ChangeManagement;
