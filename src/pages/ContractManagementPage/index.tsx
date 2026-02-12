import React from "react";
import { useQuery } from "@tanstack/react-query";
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
import VendorContractsTable, { VendorContractRow } from "./components/VendorContractsTable";
import { formatDate } from "date-fns";

type ContractApi = {
  _id: string;
  title: string;
  category?: string;
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
  vendor?: { name?: string, id?: string };
  creator?: { name?: string, email?: string, _id?: string };
  contractValue?: number;
};

type ContractStats = {
  all: number;
  draft: number;
  pending_approval: number;
  active: number;
  completed: number;
  suspended: number;
  expired: number;
  terminated: number;
};

type ContractStatsResponse = {
  status: number;
  message: string;
  data: ContractStats;
};

type ContractListResponse = {
  status: number;
  message: string;
  data: { contracts: ContractApi[]; totalContracts: 0 };
};

type ApproverContractListResponse = {
  status: number;
  message: string;
  data: {
    docs: ContractApi[];
    totalDocs: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type VendorContractApi = {
  _id: string;
  title: string;
  contractId: string;
  contractValue?: number;
  status: "active" | "completed" | "terminated" | "suspended" | "expired";
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  vendor?: { name?: string };
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

const useAllContracts = (enabled = true) => {
  const queryKey = useUserQueryKey(["contracts-all"]);
  return useQuery<ContractListResponse, ApiResponseError>({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/contracts" });
      return res.data as ContractListResponse;
    },
    enabled,
    staleTime: 60000,
  });
};

const useMyContracts = (enabled = true) => {
  const queryKey = useUserQueryKey(["contracts-me"]);
  return useQuery<ContractListResponse, ApiResponseError>({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/contracts/me" });
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
      const res = await getRequest({ url: "/approver/contract/stats" });
      return res.data as ContractStatsResponse;
    },
    enabled,
    staleTime: 60000,
  });
};

const useApproverContracts = (enabled = true) => {
  const queryKey = useUserQueryKey(["approver-contracts"]);
  return useQuery<ApproverContractListResponse, ApiResponseError>({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({ url: "/approver/contract" });
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
      const res = await getRequest({ url: "/vendor/contract/stats" });
      return res.data as VendorStatsResponse;
    },
    enabled,
    staleTime: 60000,
  });
};

const useVendorContracts = (enabled = true) => {
  const queryKey = useUserQueryKey(["vendor-contracts"]);
  return useQuery<VendorContractListResponse, ApiResponseError>({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({ url: "/vendor/contract" });
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
  if (status === "publish") return "Publish";
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
      title: c.title,
      code: c._id,
      vendor: c.vendor?.name ?? "-",
      value,
      owner: c.creator?.name ?? "-",
      published: c.createdAt
        ? formatDate(c.createdAt, "yyyy-MM-dd")
        : undefined,
      endDate: c.endDate ? formatDate(c.endDate, "dd MMM yyyy") : undefined,
      status: mapStatusToLabel(c.status),
      category: c.category,
    };
  });
};

const mapVendorStatusToLabel = (
  status: VendorContractApi["status"],
): VendorContractRow["status"] => {
  if (status === "active") return "Active";
  if (status === "suspended") return "Suspended";
  if (status === "terminated") return "Terminated";
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
      id: c._id,
      title: c.title,
      code: c.contractId,
      company: c.vendor?.name ?? "-",
      contractRelationship: "-",
      value,
      published: c.createdAt
        ? formatDate(c.createdAt, "yyyy-MM-dd")
        : undefined,
      endDate: c.endDate ? formatDate(c.endDate, "yyyy-MM-dd") : undefined,
      status: mapVendorStatusToLabel(c.status),
    };
  });
};

const ContractManagementPage: React.FC = () => {
  const { isVendor, isApprover, isViewOnly } = useUserRole();
  const managerQueriesEnabled = !isVendor && !isApprover;
  const approverQueriesEnabled = isApprover;

  const { data: statsData } = useContractsStats(managerQueriesEnabled);
  const { data: allContractsData, isLoading: isAllContractsLoading } =
    useAllContracts(managerQueriesEnabled);
  const { data: myContractsData, isLoading: isMyContractsLoading } =
    useMyContracts(managerQueriesEnabled);
  const { data: approverStatsData } = useApproverContractsStats(
    approverQueriesEnabled,
  );
  const { data: approverContractsData, isLoading: isApproverContractsLoading } =
    useApproverContracts(approverQueriesEnabled);
  const { data: vendorStatsData } = useVendorContractsStats(isVendor);
  const { data: vendorContractsData, isLoading: isVendorContractsLoading } =
    useVendorContracts(isVendor);

  const stats = isApprover ? approverStatsData?.data : statsData?.data;
  const statsCounts = stats
    ? {
        all: stats.all,
        active: stats.active,
        draft: stats.draft,
        suspended: stats.suspended,
        expired: stats.expired,
        terminated: stats.terminated,
        pending: stats.pending_approval,
      }
    : undefined;

  const allContractsRows = mapContractsToRows(allContractsData?.data.contracts);
  const myContractsRows = mapContractsToRows(myContractsData?.data.contracts);
  const approverContractsRows = mapContractsToRows(
    approverContractsData?.data.docs,
  );
  const vendorContractsRows = mapVendorContractsToRows(
    vendorContractsData?.data.contracts,
  );

  return (
    <div className="space-y-8 pt-10">
      <SEOWrapper
        title="Contract Management - SwiftPro eProcurement Portal"
        description="Manage contracts efficiently with clear status tracking and quick actions."
        canonical="/dashboard/contract-management"
        robots="noindex, nofollow"
      />

      {isVendor ? (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Contracts</h2>
              {isViewOnly && (
                <Badge variant="secondary" className="text-xs">Read-only</Badge>
              )}
            </div>
          </div>

          <VendorStatsCards
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

          <VendorContractsTable
            rows={vendorContractsRows}
            isLoading={isVendorContractsLoading}
            totalCount={vendorContractsData?.data.totalContracts}
            isReadOnly={isViewOnly}
          />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Contracts</h2>
              {isViewOnly && (
                <Badge variant="secondary" className="text-xs">Read-only</Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              {!isViewOnly && (
                <Button variant="outline" className="rounded-xl">
                  <Share2 className="mr-2 h-4 w-4" /> Export
                </Button>
              )}
              {!isApprover && !isViewOnly && (
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

          <StatsCards counts={statsCounts} />

          {isApprover ? (
            <ContractsTable
              rows={approverContractsRows}
              isLoading={isApproverContractsLoading}
              totalCount={approverContractsData?.data.totalDocs}
              isReadOnly={isViewOnly}
            />
          ) : (
            <Tabs
              defaultValue="all"
              className="w-full bg-transparent space-y-4"
            >
              <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 w-full justify-start bg-transparent">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  All Contracts
                </TabsTrigger>
                <TabsTrigger
                  value="mine"
                  className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  My Contracts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <ContractsTable
                  rows={allContractsRows}
                  isLoading={isAllContractsLoading}
                  totalCount={allContractsRows.length}
                  isReadOnly={isViewOnly}
                />
              </TabsContent>
              <TabsContent value="mine">
                <ContractsTable
                  rows={myContractsRows}
                  isLoading={isMyContractsLoading}
                  totalCount={myContractsRows.length}
                  isReadOnly={isViewOnly}
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
