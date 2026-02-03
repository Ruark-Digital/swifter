import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import InvoiceStatsCards from "../components/InvoiceStatsCards";
import InvoiceTable from "../components/InvoiceTable";
import { useQuery } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { contractManagerApi, type ManagerListInvoicesQuery } from "../api/contractManagerApi";

type Props = {
  contractId: string;
};

const InvoiceTabContent: React.FC<Props> = ({ contractId }) => {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: ["contractManager", "contractInvoices", "stats", contractId],
    queryFn: async () => await contractManagerApi.getInvoiceStats(contractId),
    enabled: Boolean(contractId),
  });

  const { data: invoicesRes, isLoading: isInvoicesLoading } = useQuery({
    queryKey: [
      "contractManager",
      "contractInvoices",
      contractId,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: async () => {
      const query: ManagerListInvoicesQuery = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      };
      return await contractManagerApi.listInvoices(contractId, query);
    },
    enabled: Boolean(contractId),
  });

  const invoiceRows = invoicesRes?.data?.invoices ?? [];
  const totalCount = invoicesRes?.data?.total ?? invoiceRows.length;

  return (
    <TabsContent value="invoice" className="space-y-6">
      <div className="flex items-center">
        <h3 className="text-base font-semibold text-slate-900">Invoice</h3>
      </div>

      <InvoiceStatsCards stats={statsRes?.data} isLoading={isStatsLoading} />

      <InvoiceTable
        rows={invoiceRows}
        isLoading={isInvoicesLoading}
        totalCount={totalCount}
        pagination={pagination}
        setPagination={setPagination}
      />
    </TabsContent>
  );
};

export default InvoiceTabContent;
