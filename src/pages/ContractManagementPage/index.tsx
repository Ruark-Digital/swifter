import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { SEOWrapper } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Plus } from "lucide-react";
import StatsCards from "./components/StatsCards";
import ContractsTable, { ContractRow } from "./components/ContractsTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CreateContractSheet from "./components/CreateContractSheet";
import { getRequest } from "@/lib/axiosInstance";
import type { ApiResponseError } from "@/types";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useUserRole } from "@/hooks/useUserRole";
import VendorStatsCards from "./components/VendorStatsCards";
import VendorContractsTable, {
  VendorContractRow,
} from "./components/VendorContractsTable";
import { formatDate } from "date-fns";

type ContractApi = {
  _id: string;
  contractId: string;
  title: string;
  category?: string;
  contractRelationship?: string;
  status:
    | "draft"
    | "pending_approval"
    | "active"
    | "publish"
    | "completed"
    | "cancelled"
    | "expired"
    | "terminated";
  currency?: string;
  totalAmount?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  datePublished?: string;
  vendor?: { name?: string; id?: string };
  creator?: { name?: string; email?: string; _id?: string };
  projectManager?: { name?: string };
  contractValue?: number;
  /** BE-computed ownership for the current user (preferred over id-matching). */
  owner?: boolean;
};

type ContractStats = {
  all: number;
  draft: number;
  pending: number;
  active: number;
  completed: number;
  suspended: number;
  expired: number;
  cancelled: number;
};

type ContractStatsResponse = {
  status: number;
  message: string;
  data: ContractStats;
};

type ContractListResponse = {
  status: number;
  message: string;
  data: { contracts: ContractApi[]; totalContracts: number };
};

type ApproverContractListResponse = {
  status: number;
  message: string;
  data: {
    contracts: ContractApi[];
    totalContracts: number;
  };
};

type VendorContractApi = {
  id: string;
  title: string;
  contractId: string;
  contractRelationship?: "standalone" | "project" | "msa_project" | "msa";
  contractValue?: number;
  status:
    | "active"
    | "completed"
    | "terminated"
    | "suspended"
    | "expired"
    | "cancelled"
    | "publish"
    | "draft"
    | "pending_approval";
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  datePublished?: string;
  company?: string | { name?: string };
  vendor?: { name?: string };
  owner?: boolean;
};

const mapContractRelationshipLabel = (
  relationship?: "standalone" | "project" | "msa_project" | "msa",
): string => {
  if (relationship === "standalone") return "Stand-Alone Project";
  if (relationship === "project") return "Linked to Project";
  if (relationship === "msa_project" || relationship === "msa") {
    return "Linked to MSA";
  }
  return "-";
};

const mapCompanyLabel = (
  company?: string | { name?: string },
  vendor?: { name?: string },
): string => {
  if (typeof company === "string" && company.trim()) return company;
  if (company && typeof company === "object" && company.name) return company.name;
  if (vendor?.name) return vendor.name;
  return "-";
};

type VendorStatsResponse = {
  success: boolean;
  message: string;
  data: {
    all: number;
    active: number;
    completed: number;
    cancelled: number;
    suspended: number;
    expired: number;
  };
};

type VendorContractListResponse = {
  success: boolean;
  message: string;
  data: { contracts: VendorContractApi[]; totalContracts: number };
};

const useContractsStats = (enabled = true) => {
  const queryKey = useUserQueryKey(["contracts-stats"]);
  return useQuery<ContractStatsResponse, ApiResponseError>({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({
        url: "/contract/manager/contracts/stats",
      });
      return res.data as ContractStatsResponse;
    },
    enabled,
    staleTime: 60000,
  });
};

const useAllContracts = (pagination: PaginationState, enabled = true) => {
  const queryKey = useUserQueryKey([
    "contracts-all",
    pagination.pageIndex,
    pagination.pageSize,
  ]);
  return useQuery<ContractListResponse, ApiResponseError>({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({
        url: "/contract/manager/contracts",
        config: {
          params: {
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
          },
        },
      });
      return res.data as ContractListResponse;
    },
    enabled,
    staleTime: 60000,
  });
};

const useMyContracts = (pagination: PaginationState, enabled = true) => {
  const queryKey = useUserQueryKey([
    "contracts-me",
    pagination.pageIndex,
    pagination.pageSize,
  ]);
  return useQuery<ContractListResponse, ApiResponseError>({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({
        url: "/contract/manager/contracts/me",
        config: {
          params: {
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
          },
        },
      });
      return res.data as ContractListResponse;
    },
    enabled,
    staleTime: 60000,
  });
};

const useApproverContractsStats = (enabled = true) => {
  const queryKey = useUserQueryKey(["approver-contracts-stats"]);
  return useQuery<ContractStatsResponse, ApiResponseError>({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({
        url: "/contract/approver/contracts/stats",
      });
      return res.data as ContractStatsResponse;
    },
    enabled,
    staleTime: 60000,
  });
};

const useApproverContracts = (pagination: PaginationState, enabled = true) => {
  const queryKey = useUserQueryKey([
    "approver-contracts",
    pagination.pageIndex,
    pagination.pageSize,
  ]);
  return useQuery<ApproverContractListResponse, ApiResponseError>({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({
        url: "/contract/approver/contracts",
        config: {
          params: {
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
          },
        },
      });
      return res.data as ApproverContractListResponse;
    },
    enabled,
    staleTime: 60000,
  });
};

const useVendorContractsStats = (enabled = true) => {
  const queryKey = useUserQueryKey(["vendor-contracts-stats"]);
  return useQuery<VendorStatsResponse, ApiResponseError>({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/vendor/contracts/stats" });
      return res.data as VendorStatsResponse;
    },
    enabled,
    staleTime: 60000,
  });
};

const useVendorContracts = (
  pagination: PaginationState,
  enabled = true,
  asPM = false,
) => {
  const queryKey = useUserQueryKey([
    asPM ? "pm-contracts" : "vendor-contracts",
    pagination.pageIndex,
    pagination.pageSize,
  ]);
  const url = asPM
    ? "/contract/vendor/contracts/me"
    : "/contract/vendor/contracts";
  return useQuery<VendorContractListResponse, ApiResponseError>({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({
        url,
        config: {
          params: {
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
          },
        },
      });
      return res.data as VendorContractListResponse;
    },
    enabled,
    staleTime: 60000,
  });
};

const mapStatusToLabel = (
  status: ContractApi["status"],
): ContractRow["status"] => {
  if (status === "active") return "Active";
  if (status === "publish") return "Published";
  if (status === "draft") return "Draft";
  if (status === "expired") return "Expired";
  if (status === "terminated") return "Terminated";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status === "pending_approval") return "Pending Approval";
  return "Suspended";
};

const mapContractsToRows = (contracts?: ContractApi[]): ContractRow[] => {
  if (!contracts) return [];

  return contracts.map((c) => {
    const value =
      typeof c.contractValue === "number"
        ? `${c.contractValue.toLocaleString()}`
        : undefined;

    return {
      id: c._id,
      contractId: c.contractId,
      title: c.title,
      code: c._id,
      vendor: c.vendor?.name ?? c.projectManager?.name ?? "-",
      value: `$${value}`,
      owner: c.creator?.name ?? "-",
      ownerId: c.creator?._id,
      isOwner: c.owner,
      published: c.datePublished
        ? formatDate(c.datePublished, "dd MMM yyyy")
        : undefined,
      endDate: c.endDate ? formatDate(c.endDate, "dd MMM yyyy") : undefined,
      createdAtRaw: c.createdAt,
      status: mapStatusToLabel(c.status),
      category: c.category,
    };
  });
};

const mapVendorStatusToLabel = (
  status: VendorContractApi["status"],
): VendorContractRow["status"] => {
  if (status === "active") return "Active";
  if (status === "publish") return "Published";
  if (status === "draft") return "Draft";
  if (status === "pending_approval") return "Pending Approval";
  if (status === "expired") return "Expired";
  if (status === "suspended") return "Suspended";
  if (status === "terminated") return "Terminated";
  // Align with the manager/approver mapper so the same backend status reads
  // the same on the vendor/PM side (QA #124): completed/cancelled were both
  // collapsing to "Closed", and a rejected contract showed "Closed" here but
  // "Suspended" on the CM/approver side.
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status === "rejection") return "Suspended";
  return "Closed";
};

const mapVendorContractsToRows = (
  contracts?: VendorContractApi[],
): VendorContractRow[] => {
  if (!contracts) return [];
  return contracts.map((c) => {
    const value =
      typeof c.contractValue === "number"
        ? c.contractValue.toLocaleString()
        : undefined;

    return {
      id: c.id,
      contractId: c.contractId,
      title: c.title,
      code: c.contractId,
      company: mapCompanyLabel(c.company, c.vendor),
      contractRelationship: mapContractRelationshipLabel(c.contractRelationship),
      value: value != null ? `$${value}` : undefined,
      published: c.datePublished
        ? formatDate(c.datePublished, "dd MMM yyyy")
        : undefined,
      endDate: c.endDate ? formatDate(c.endDate, "dd MMM yyyy") : undefined,
      status: mapVendorStatusToLabel(c.status),
      isOwner: c.owner,
    };
  });
};

const ContractManagementPage: React.FC = () => {
  const { isVendor, isProjectManager, isApprover, isViewOnly, isCompanyAdmin } =
    useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;
  const managerQueriesEnabled = !isContractVendorLike && !isApprover;
  const approverQueriesEnabled = isApprover;

  const [allPagination, setAllPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [myPagination, setMyPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [approverPagination, setApproverPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });
  const [vendorPagination, setVendorPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });
  const [pmAllPagination, setPmAllPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const { data: statsData } = useContractsStats(managerQueriesEnabled);
  const { data: allContractsData, isLoading: isAllContractsLoading } =
    useAllContracts(allPagination, managerQueriesEnabled);
  const { data: myContractsData, isLoading: isMyContractsLoading } =
    useMyContracts(myPagination, managerQueriesEnabled);
  const { data: approverStatsData } = useApproverContractsStats(
    approverQueriesEnabled,
  );
  const { data: approverContractsData, isLoading: isApproverContractsLoading } =
    useApproverContracts(approverPagination, approverQueriesEnabled);
  const { data: vendorStatsData } =
    useVendorContractsStats(isContractVendorLike);
  const { data: vendorContractsData, isLoading: isVendorContractsLoading } =
    useVendorContracts(
      vendorPagination,
      isContractVendorLike,
      isProjectManager,
    );
  const { data: pmAllContractsData, isLoading: isPmAllContractsLoading } =
    useVendorContracts(pmAllPagination, isProjectManager, false);

  const stats = isApprover ? approverStatsData?.data : statsData?.data;
  const statsCounts = stats
    ? {
        all: stats.all,
        active: stats.active,
        draft: stats.draft,
        suspended: stats.suspended,
        expired: stats.expired,
        terminated: stats.cancelled,
        pending: stats.pending,
      }
    : undefined;

  const allContractsRows = mapContractsToRows(allContractsData?.data.contracts);
  const myContractsRows = mapContractsToRows(myContractsData?.data.contracts);
  const approverContractsRows = mapContractsToRows(
    approverContractsData?.data.contracts,
  );
  const vendorContractsRows = mapVendorContractsToRows(
    vendorContractsData?.data.contracts,
  );
  const pmAllContractsRows = mapVendorContractsToRows(
    pmAllContractsData?.data.contracts,
  );

  return (
    <div className="space-y-8 pt-10 min-w-0 w-full">
      <SEOWrapper
        title="Contract Management - SwiftPro eProcurement Portal"
        description="Manage contracts efficiently with clear status tracking and quick actions."
        canonical="/dashboard/contract-management"
        robots="noindex, nofollow"
      />

      {isContractVendorLike ? (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900">
                Contracts
              </h2>
              {isViewOnly && (
                <Badge variant="secondary" className="text-xs">
                  Read-only
                </Badge>
              )}
            </div>
          </div>

          <VendorStatsCards
            onStatusClick={(status) => setStatusFilter(status)}
            counts={
              vendorStatsData?.data
                ? {
                    all: vendorStatsData.data.all,
                    active: vendorStatsData.data.active,
                    suspended: vendorStatsData.data.suspended,
                    closed:
                      vendorStatsData.data.completed +
                      vendorStatsData.data.cancelled +
                      vendorStatsData.data.expired,
                    terminated: 0,
                  }
                : undefined
            }
          />

          {isProjectManager ? (
            <Tabs
              defaultValue="all"
              className="w-full bg-transparent space-y-4"
              onValueChange={() => setStatusFilter("all")}
            >
              <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 w-full justify-start bg-transparent">
                <TabsTrigger
                  value="all"
                  className="dark:text-slate-400 data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  All Contracts
                </TabsTrigger>
                <TabsTrigger
                  value="mine"
                  className="dark:text-slate-400 data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  My Contracts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <VendorContractsTable
                  rows={pmAllContractsRows}
                  isLoading={isPmAllContractsLoading}
                  totalCount={pmAllContractsData?.data.totalContracts}
                  isReadOnly={isViewOnly}
                  pagination={pmAllPagination}
                  setPagination={setPmAllPagination}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                />
              </TabsContent>
              <TabsContent value="mine">
                <VendorContractsTable
                  rows={vendorContractsRows}
                  isLoading={isVendorContractsLoading}
                  totalCount={vendorContractsData?.data.totalContracts}
                  isReadOnly={isViewOnly}
                  pagination={vendorPagination}
                  setPagination={setVendorPagination}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <VendorContractsTable
              rows={vendorContractsRows}
              isLoading={isVendorContractsLoading}
              totalCount={vendorContractsData?.data.totalContracts}
              isReadOnly={isViewOnly}
              pagination={vendorPagination}
              setPagination={setVendorPagination}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900">
                Contracts
              </h2>
              {isViewOnly && (
                <Badge variant="secondary" className="text-xs">
                  Read-only
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {!isViewOnly && (
                <Button variant="outline" className="rounded-xl">
                  <Share2 className="mr-2 h-4 w-4" /> Export
                </Button>
              )}
              {!isApprover && !isViewOnly && !isCompanyAdmin && (
                <CreateContractSheet
                  trigger={
                    <Button
                      className="rounded-xl"
                      data-testid="create-contracts-button"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Create Contracts
                    </Button>
                  }
                />
              )}
            </div>
          </div>

          <StatsCards
            counts={statsCounts}
            onStatusClick={(status) => setStatusFilter(status)}
          />

          {isApprover ? (
            <ContractsTable
              rows={approverContractsRows}
              isLoading={isApproverContractsLoading}
              totalCount={approverContractsData?.data.totalContracts}
              pagination={approverPagination}
              setPagination={setApproverPagination}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              // isReadOnly={true}
              // disableActions={isApprover}
            />
          ) : (
            <Tabs
              defaultValue="all"
              className="w-full bg-transparent space-y-4"
              onValueChange={() => setStatusFilter("all")}
            >
              <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 w-full justify-start bg-transparent">
                <TabsTrigger
                  value="all"
                  className="dark:text-slate-400 data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  All Contracts
                </TabsTrigger>
                <TabsTrigger
                  value="mine"
                  className="dark:text-slate-400 data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  My Contracts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <ContractsTable
                  rows={allContractsRows}
                  isLoading={isAllContractsLoading}
                  totalCount={allContractsData?.data.totalContracts}
                  isReadOnly={isViewOnly}
                  pagination={allPagination}
                  setPagination={setAllPagination}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  // disableActions={isCompanyAdmin}
                />
              </TabsContent>
              <TabsContent value="mine">
                <ContractsTable
                  rows={myContractsRows}
                  isLoading={isMyContractsLoading}
                  totalCount={myContractsData?.data.totalContracts}
                  isReadOnly={isViewOnly}
                  pagination={myPagination}
                  setPagination={setMyPagination}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  // disableActions={isCompanyAdmin}
                />
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
};

export default ContractManagementPage;
