import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import LemTable, { type LemRow } from "../components/LemTable";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import { contractManagerApi } from "../api/contractManagerApi";

type Props = {
  contractId: string;
  isActive?: boolean;
};

const LemTabContent: React.FC<Props> = ({ contractId, isActive }) => {
  const { isApprover, isManager } = useUserRole();
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: [
      isApprover ? "approver" : "contractManager",
      "lem-list",
      contractId,
      debounced,
    ],
    queryFn: async () => {
      if (isManager && !isApprover) {
        const res = await contractManagerApi.listLems(contractId, {
          title: debounced || undefined,
          page: 1,
          limit: 10,
        });
        const items = res?.data?.resp || [];
        const rows: LemRow[] = items.map((it) => ({
          id: "",
          title: it?.title || "",
          amount:
            typeof it?.amount === "number"
              ? `$${it.amount.toLocaleString()}`
              : `${it?.amount ?? ""}`,
          submissionDate: "",
          status: "Pending",
        }));
        return rows;
      }
      const params = new URLSearchParams();
      if (debounced) params.append("title", debounced);
      const res = await getRequest({
        url: `/contract/approver/contracts/${contractId}/lems?${params.toString()}`,
      });
      const payload = (res as any)?.data?.data;
      const items = payload?.resp || [];
      const rows: LemRow[] = items.map((it: any) => ({
        id: it?.lemId || it?._id || "",
        title: it?.title || "",
        amount:
          typeof it?.amount === "number"
            ? `$${it.amount.toLocaleString()}`
            : it?.amount || "",
        submissionDate: it?.createdAt || "",
        status: "Pending",
      }));
      return rows;
    },
    enabled: !!contractId && !!isActive,
  });

  return (
    <TabsContent value="lem" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">
          Labor, Equipment & Material Reports
        </h3>
      </div>

      <LemTable
        contractId={contractId}
        rows={data || []}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={(v) => setSearch(v)}
      />
    </TabsContent>
  );
};

export default LemTabContent;
