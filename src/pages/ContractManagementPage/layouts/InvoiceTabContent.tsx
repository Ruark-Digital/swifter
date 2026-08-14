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
import CreateInvoiceDialog from "../components/CreateInvoiceDialog";
import { useDebounceValue } from "usehooks-ts";

type Props = {
  contractId: string;
  currency?: string;
  isActive?: boolean;
  actionsDisabled?: boolean;
  owner?: boolean;
};

const InvoiceTabContent: React.FC<Props> = ({
  contractId,
  currency,
  isActive,
  actionsDisabled,
  owner,
}) => {
  const { isApprover, isVendor, isProjectManager, isManager, isAdmin, isViewOnly } =
    useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;
  const [invoiceIdSearch, setInvoiceIdSearch] = React.useState("");
  const [debouncedInvoiceIdSearch] = useDebounceValue(invoiceIdSearch, 500);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const getBasePath = () => {
    if (isContractVendorLike) return `/contract/vendor/contracts/${contractId}/invoice`;
    if (isApprover) return `/contract/approver/contracts/${contractId}/invoice`;
    if (isManager) return `/contract/manager/contracts/${contractId}/invoice`;
    if (isAdmin || isViewOnly)
      return `/contract/user/contracts/${contractId}/invoice`;
    return `/contract/user/contracts/${contractId}/invoice`; // Default fallback
  };

  const basePath = getBasePath();

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [invoiceIdSearch]);

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

  // Contract-level `remaining` (outstanding after billed-till-date) lives on
  // FinancialStatement per the API spec — no per-invoice remaining exists.
  // Only manager/approver have this endpoint; vendor doesn't, so we skip it.
  const financialStatementBase = isApprover
    ? `/contract/approver/contracts/${contractId}`
    : isManager
      ? `/contract/manager/contracts/${contractId}`
      : null;

  const { data: financialStatementRes } = useQuery({
    queryKey: [
      "contractInvoices",
      "financial-statement",
      contractId,
      financialStatementBase,
    ],
    queryFn: async () => {
      const response = await getRequest({
        url: `${financialStatementBase}/dashboard/financial-statement`,
        config: { params: { type: "Contract" } },
      });
      return response.data;
    },
    enabled:
      Boolean(contractId) && !!isActive && Boolean(financialStatementBase),
    staleTime: 60_000,
    retry: false,
  });

  const contractRemaining: number | undefined =
    typeof financialStatementRes?.data?.remaining === "number"
      ? financialStatementRes.data.remaining
      : undefined;

  const { data: invoicesRes, isLoading: isInvoicesLoading } = useQuery({
    queryKey: [
      "contractInvoices",
      contractId,
      pagination.pageIndex,
      pagination.pageSize,
      basePath,
      debouncedInvoiceIdSearch,
    ],
    queryFn: async () => {
      const query: ManagerListInvoicesQuery = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      };

      const params = new URLSearchParams();
      if (query.page) params.append("page", String(query.page));
      if (query.limit) params.append("limit", String(query.limit));
      if (debouncedInvoiceIdSearch)
        params.append("invoiceId", debouncedInvoiceIdSearch);

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
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Invoice</h3>
        {isProjectManager && !actionsDisabled && (
          <CreateInvoiceDialog
            contractId={contractId}
            trigger={
              <Button className="rounded-xl bg-[#2A4467] px-4 font-semibold text-white hover:bg-[#2A4467]/90">
                Submit Invoice
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
        contractId={contractId}
        invoiceIdSearch={invoiceIdSearch}
        setInvoiceIdSearch={setInvoiceIdSearch}
        actionsDisabled={actionsDisabled}
        owner={owner}
        currency={currency}
        contractRemaining={contractRemaining}
      />
    </TabsContent>
  );
};

export default InvoiceTabContent;
