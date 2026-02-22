import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import LemTable, { type LemRow } from "../components/LemTable";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";

type Props = {
  contractId: string;
};

const LemTabContent: React.FC<Props> = ({ contractId }) => {
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["lem-list", contractId, debounced],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debounced) params.append("title", debounced);
      const res = await getRequest({
        url: `/contract/approver/contract/${contractId}/lems?${params.toString()}`,
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
    enabled: !!contractId,
  });

  return (
    <TabsContent value="lem" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">
          Labor, Equipment & Material Reports
        </h3>
        <Button variant="outline" className="h-10 rounded-xl px-4">
          Upload Rate Sheet
        </Button>
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
