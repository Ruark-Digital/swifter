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

type MsaStatsResponse = {
  message?: string;
  data?: MsaStatsData;
};

const MsaPage: React.FC = () => {
  const hasData = true;
  const { isManager, isApprover, isVendor } = useUserRole();

  const listUrl = isManager
    ? "/contract/manager/msa-contract"
    : isApprover
    ? "/contract/approver/msa-contract"
    : isVendor
    ? "/contract/vendor/msa-contract"
    : "/contract/user/msa-contract";

  const myListUrl = isManager ? "/contract/manager/msa-contract/me" : undefined;

  const statsUrl = isManager
    ? "/contract/manager/msa-contract/stats"
    : isApprover
      ? "/contract/approver/msa-contract/stats"
      : isVendor
        ? "/contract/vendor/msa-contract/stats"
        : "/contract/user/msa-contract/stats";

  const statsQuery = useQuery({
    queryKey: useUserQueryKey(["msa", "stats", statsUrl]),
    queryFn: async () => {
      const res = await getRequest({ url: statsUrl });
      return res.data as MsaStatsResponse;
    },
    staleTime: 60_000,
  });

  const allQuery = useQuery({
    queryKey: useUserQueryKey(["msa", "list", listUrl, { page: 1, limit: 50 }]),
    queryFn: async () =>
      await getRequest({
        url: listUrl,
        config: { params: { page: 1, limit: 50 } },
      }),
  });

  const mineQuery = useQuery({
    queryKey: useUserQueryKey(["msa", "list", "me", myListUrl, { page: 1, limit: 50 }]),
    queryFn: async () =>
      await getRequest({
        url: myListUrl as string,
        config: { params: { page: 1, limit: 50 } },
      }),
    enabled: Boolean(myListUrl),
  });

  const toRows = (items: any[]): MsaRow[] =>
    (items ?? []).map((it: any) => ({
      id: String(it?._id ?? it?.id ?? ""),
      title: String(it?.title ?? it?.name ?? ""),
      code: String(it?.code ?? it?.msaId ?? it?.contractId ?? ""),
      vendor: String(
        it?.vendor?.name ??
          it?.vendorName ??
          it?.vendor ??
          ""
      ),
      value: undefined,
      owner: String(
        it?.manager?.name ??
          it?.owner?.name ??
          it?.owner ??
          ""
      ),
      published: it?.published || it?.startDate || undefined,
      endDate: it?.endDate || undefined,
      status: (String(it?.status ?? "Draft") as MsaRow["status"]),
    }));

  const extractItems = (res: any): any[] => {
    return (
      res?.data?.data?.contracts ??
      res?.data?.data ??
      res?.data?.contracts ??
      []
    );
  };

  const allRows = toRows(extractItems(allQuery.data));
  const myRows = toRows(extractItems(mineQuery.data));

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

  return (
    <div className="space-y-8 pt-5">
      <SEOWrapper
        title="Master Service Agreements (MSA) - SwiftPro eProcurement Portal"
        description="Manage Master Service Agreements with clear status tracking and quick actions."
        canonical="/dashboard/msa"
        robots="noindex, nofollow"
      />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">MSA</h2>
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
      />

      {hasData ? (
        <Tabs defaultValue="all" className="w-full bg-transparent space-y-4">
          <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 w-full justify-start bg-transparent">
            <TabsTrigger
              value="all"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              All MSA
            </TabsTrigger>
            <TabsTrigger
              value="mine"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              My MSA
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <MsaTable rows={allRows} />
          </TabsContent>
          <TabsContent value="mine">
            <MsaTable rows={myRows} />
          </TabsContent>
        </Tabs>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

export default MsaPage;
