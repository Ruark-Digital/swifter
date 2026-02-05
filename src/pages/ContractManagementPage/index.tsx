import React from "react";
import { useQuery } from "@tanstack/react-query";
import { SEOWrapper } from "@/components/SEO";
import { Button } from "@/components/ui/button";
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
import VendorContractsTable from "./components/VendorContractsTable";

type ContractApi = {
  _id: string;
  title: string;
  category?: string;
  status:
    | "draft"
    | "pending_approval"
    | "active"
    | "completed"
    | "cancelled"
    | "expired"
    | "terminated";
  currency?: string;
  totalAmount?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
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
  data: { contracts: ContractApi[], totalContracts: 0 };
};

const useContractsStats = (enabled = true) => {
  const queryKey = useUserQueryKey(["contracts-stats"]);
  return useQuery<ContractStatsResponse, ApiResponseError>({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/contracts/stats" });
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

const mapStatusToLabel = (status: ContractApi["status"]): ContractRow["status"] => {
  if (status === "active") return "Active";
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
      typeof c.totalAmount === "number" && c.currency
        ? `${c.currency} ${c.totalAmount.toLocaleString()}`
        : undefined;

    return {
      id: c._id,
      title: c.title,
      code: c._id,
      vendor: "-",
      value,
      owner: "-",
      published: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : undefined,
      endDate: c.endDate ? new Date(c.endDate).toLocaleDateString() : undefined,
      status: mapStatusToLabel(c.status),
      category: c.category,
    };
  });
};

const ContractManagementPage: React.FC = () => {
  const { isVendor } = useUserRole();
  const managerQueriesEnabled = !isVendor;
  const { data: statsData } = useContractsStats(managerQueriesEnabled);
  const { data: allContractsData, isLoading: isAllContractsLoading } =
    useAllContracts(managerQueriesEnabled);
  const { data: myContractsData, isLoading: isMyContractsLoading } =
    useMyContracts(managerQueriesEnabled);

  const stats = statsData?.data;
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
            <h2 className="text-xl font-semibold text-slate-900">Contracts</h2>
          </div>

          <VendorStatsCards />

          <VendorContractsTable rows={[]} isLoading={false} totalCount={0} />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Contracts</h2>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="rounded-xl">
                <Share2 className="mr-2 h-4 w-4" /> Export
              </Button>
              <CreateContractSheet
                trigger={
                  <Button className="rounded-xl" data-testid="create-contracts-button">
                    <Plus className="mr-2 h-4 w-4" /> Create Contracts
                  </Button>
                }
              />
            </div>
          </div>

          <StatsCards counts={statsCounts} />

          <Tabs defaultValue="all" className="w-full bg-transparent space-y-4">
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
              />
            </TabsContent>
            <TabsContent value="mine">
              <ContractsTable
                rows={myContractsRows}
                isLoading={isMyContractsLoading}
                totalCount={myContractsRows.length}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default ContractManagementPage;
