import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import InvoiceStatsCards from "../components/InvoiceStatsCards";
import InvoiceTable from "../components/InvoiceTable";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import type { PaginationState } from "@tanstack/react-table";
import { type ManagerListInvoicesQuery } from "../api/contractManagerApi";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import SubmitLemDialog from "../components/SubmitLemDialog";

type Props = {
  contractId: string;
  isActive?: boolean;
};

const InvoiceTabContent: React.FC<Props> = ({ contractId, isActive }) => {
  const { isApprover, isVendor, isManager, isAdmin, isViewOnly } =
    useUserRole();
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const getBasePath = () => {
    if (isVendor) return `/contract/vendor/contracts/${contractId}/invoice`;
    if (isApprover) return `/contract/approver/contracts/${contractId}/invoice`;
    if (isManager) return `/contract/manager/contracts/${contractId}/invoice`;
    if (isAdmin || isViewOnly)
      return `/contract/user/contracts/${contractId}/invoice`;
    return `/contract/user/contracts/${contractId}/invoice`; // Default fallback
  };

  const basePath = getBasePath();

  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: ["contractInvoices", "stats", contractId, basePath],
    queryFn: async () => {
      const response = await getRequest({
        url: `${basePath}/stats`,
      });
      return response.data;
    },
    enabled: Boolean(contractId) && !!isActive,
  });

  const { data: invoicesRes, isLoading: isInvoicesLoading } = useQuery({
    queryKey: [
      "contractInvoices",
      contractId,
      pagination.pageIndex,
      pagination.pageSize,
      basePath,
    ],
    queryFn: async () => {
      const query: ManagerListInvoicesQuery = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      };

      const params = new URLSearchParams();
      if (query.page) params.append("page", String(query.page));
      if (query.limit) params.append("limit", String(query.limit));

      const response = await getRequest({
        url: `${basePath}?${params.toString()}`,
      });
      return response.data;
    },
    enabled: Boolean(contractId) && !!isActive,
  });

  const invoiceRows = invoicesRes?.data?.invoices ?? [];
  const totalCount = invoicesRes?.data?.total ?? invoiceRows.length;

  return (
    <TabsContent value="invoice" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Invoice</h3>
        {isVendor && (
          <SubmitLemDialog
            contractId={contractId}
            trigger={
              <Button className="rounded-xl bg-[#2A4467] px-4 font-semibold text-white hover:bg-[#2A4467]/90">
                Submit LEM
              </Button>
            }
          />
        )}
      </div>

      <InvoiceStatsCards stats={statsRes?.data} isLoading={isStatsLoading} />

      <InvoiceTable
        rows={invoiceRows}
        isLoading={isInvoicesLoading}
        totalCount={totalCount}
        pagination={pagination}
        setPagination={setPagination}
        variant={isApprover ? "approver" : "manager"}
      />
    </TabsContent>
  );
};

export default InvoiceTabContent;
