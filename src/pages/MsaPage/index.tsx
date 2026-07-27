import React from "react";
import { SEOWrapper } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import StatsCards from "./components/StatsCards";
import EmptyState from "./components/EmptyState";
import MsaTable from "./components/MsaTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CreateMSADialog from "./layouts/CreateMSADialog";
import { useQuery } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { getRequest } from "@/lib/axiosInstance";
import type { MsaRow } from "./components/MsaTable";
import { ApiResponse, ApiResponseError } from "@/types";
import type { PaginationState } from "@tanstack/react-table";

type MsaStatsData = Partial<{
  all: number;
  active: number;
  draft: number;
  suspended: number;
  expired: number;
  terminated: number;
  pending: number;
  pending_approval: number;
  linked: number;
  linkedContracts: number;
}>;

export interface MSAResponseData {
  contracts: Contract[];
  totalContracts: number;
}

export interface Contract {
  _id: string;
  creator: Creator;
  title: string;
  msaContractId: string;
  contractValue: number;
  startDate?: string;
  endDate?: string;
  status: string;
  createdAt: string;
  vendor: Vendor;
  category?: string;
  projectManager?: { name?: string } | string;
  /** BE-computed ownership for the current user, when provided. */
  owner?: boolean;
}

export interface Creator {
  _id: string;
  name: string;
  email: string;
}

export interface Vendor {
  name: string;
  email: string;
  id: string;
}

type MsaStatsResponse = {
  message?: string;
  data?: MsaStatsData;
};

const MsaPage: React.FC = () => {
  const {
    isManager,
    isApprover,
    isVendor,
    isProjectManager,
    isCompanyAdmin,
    isSuperAdmin,
  } = useUserRole();
  const isManagerLike = isManager || isCompanyAdmin || isSuperAdmin;
  const isVendorLike = isVendor || isProjectManager;

  const [allPagination, setAllPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [myPagination, setMyPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<string>("all");

  const listUrl = isManagerLike
    ? "/contract/manager/msa-contracts"
    : isApprover
      ? "/contract/approver/msa-contracts"
      : isVendorLike
        ? "/contract/vendor/msa-contracts"
        : "/contract/user/msa-contracts";

  const myListUrl = isManager
    ? "/contract/manager/msa-contracts/me"
    : isProjectManager
      ? "/contract/vendor/msa-contracts/me"
      : undefined;

  const statsUrl = isManagerLike
    ? "/contract/manager/msa-contracts/stats"
    : isApprover
      ? "/contract/approver/msa-contracts/stats"
      : isVendorLike
        ? "/contract/vendor/msa-contracts/stats"
        : "/contract/user/msa-contracts/stats";

  const statsQuery = useQuery({
    queryKey: useUserQueryKey(["msa", "stats", statsUrl]),
    queryFn: async () => {
      const res = await getRequest({ url: statsUrl });
      return res.data as MsaStatsResponse;
    },
    staleTime: 60_000,
  });

  const allQuery = useQuery<ApiResponse<MSAResponseData>, ApiResponseError>({
    queryKey: useUserQueryKey(["msa", "list", listUrl, allPagination]),
    queryFn: async () =>
      await getRequest({
        url: listUrl,
        config: {
          params: {
            page: allPagination.pageIndex + 1,
            limit: allPagination.pageSize,
          },
        },
      }),
  });

  const mineQuery = useQuery<ApiResponse<MSAResponseData>, ApiResponseError>({
    queryKey: useUserQueryKey(["msa", "list", "me", myListUrl, myPagination]),
    queryFn: async () =>
      await getRequest({
        url: myListUrl as string,
        config: {
          params: {
            page: myPagination.pageIndex + 1,
            limit: myPagination.pageSize,
          },
        },
      }),
    enabled: Boolean(myListUrl),
  });

  const toRows = (items: Contract[]): MsaRow[] =>
    items.map((it: Contract) => ({
      // The MSA list endpoint returns each contract keyed by `id` (not
      // `_id`). Falling back to "-" or empty here produced broken
      // `/dashboard/msa/-` links — accept either shape for safety.
      id: String((it as any)?.id ?? it?._id ?? ""),
      title: String(it?.title ?? "-"),
      code: String(it?.msaContractId ?? "-"),
      // Vendor column shows the vendor company — not the project manager
      // (QA #195). Accept either the populated `{ name }` object or a bare
      // string id/name; fall back to "-" for rows without a vendor yet.
      vendor:
        typeof it?.vendor === "string"
          ? String(it.vendor || "-")
          : String((it?.vendor as { name?: string })?.name ?? "-"),
      value: Number.isFinite(it?.contractValue)
        ? `$${it.contractValue.toLocaleString()}`
        : undefined,
      owner: String(it?.creator?.name ?? "-"),
      ownerId: it?.creator?._id ? String(it.creator._id) : undefined,
      isOwner: typeof it?.owner === "boolean" ? it.owner : undefined,
      published: it?.createdAt || undefined,
      endDate: it?.endDate || undefined,
      status: String(it?.status ?? "Draft") as MsaRow["status"],
      category: it?.category,
    }));

  const extractItems = (res: MSAResponseData): Contract[] => {
    return res?.contracts ?? [];
  };

  const allRows = toRows(
    extractItems(allQuery.data?.data?.data ?? ({} as MSAResponseData)),
  );
  const myRows = toRows(
    extractItems(mineQuery.data?.data?.data ?? ({} as MSAResponseData)),
  );

  const stats = statsQuery.data?.data;
  const counts = {
    all: stats?.all ?? 0,
    active: stats?.active ?? 0,
    draft: stats?.draft ?? 0,
    suspended: stats?.suspended ?? 0,
    expired: stats?.expired ?? 0,
    terminated: stats?.terminated ?? 0,
    pending: stats?.pending ?? stats?.pending_approval ?? 0,
    linked: stats?.linked ?? stats?.linkedContracts ?? 0,
  };

  const allTotalCount = allQuery.data?.data?.data?.totalContracts ?? 0;
  const myTotalCount = mineQuery.data?.data?.data?.totalContracts ?? 0;

  const hasData =
    allRows.length > 0 ||
    myRows.length > 0 ||
    allQuery.isLoading ||
    mineQuery.isLoading;

  return (
    <div className="space-y-8 pt-5">
      <SEOWrapper
        title="Master Service Agreements (MSA) - SwiftPro eProcurement Portal"
        description="Manage Master Service Agreements with clear status tracking and quick actions."
        canonical="/dashboard/msa"
        robots="noindex, nofollow"
      />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">MSA</h2>
        <div className="flex items-center gap-4">
          {isManager && (
            <CreateMSADialog
              trigger={
                <Button className="rounded-xl" data-testid="create-msa-button">
                  <Plus className="mr-2 h-4 w-4" /> Create MSA
                </Button>
              }
            />
          )}
        </div>
      </div>

      <StatsCards
        counts={counts}
        onStatusClick={(status) => {
          setStatusFilter(status);
        }}
      />

      {hasData ? (
        isCompanyAdmin ? (
          <Tabs defaultValue="all" className="w-full bg-transparent space-y-4">
            <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 w-full justify-start bg-transparent">
              <TabsTrigger
                value="all"
                className="dark:text-slate-400 data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                All MSA
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <MsaTable
                rows={allRows}
                totalCount={allTotalCount}
                pagination={allPagination}
                setPagination={setAllPagination}
                isLoading={allQuery.isLoading}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="all" className="w-full bg-transparent space-y-4">
            <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 w-full justify-start bg-transparent">
              <TabsTrigger
                value="all"
                className="dark:text-slate-400 data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                All MSA
              </TabsTrigger>
              <TabsTrigger
                value="mine"
                className="dark:text-slate-400 data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                My MSA
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <MsaTable
                rows={allRows}
                totalCount={allTotalCount}
                pagination={allPagination}
                setPagination={setAllPagination}
                isLoading={allQuery.isLoading}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
              />
            </TabsContent>
            <TabsContent value="mine">
              <MsaTable
                rows={myRows}
                totalCount={myTotalCount}
                pagination={myPagination}
                setPagination={setMyPagination}
                isLoading={mineQuery.isLoading}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
              />
            </TabsContent>
          </Tabs>
        )
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

export default MsaPage;
