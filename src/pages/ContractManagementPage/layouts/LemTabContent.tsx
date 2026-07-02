import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import LemTable, { type LemRow } from "../components/LemTable";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import SubmitLemDialog from "../components/SubmitLemDialog";
import { formatCurrency } from "@/lib/utils";

type Props = {
  contractId: string;
  currency?: string;
  isActive?: boolean;
};

const LemTabContent: React.FC<Props> = ({ contractId, currency, isActive }) => {
  const currencyCode = currency || "USD";
  const { isApprover, isManager, isVendor, isProjectManager, isAdmin, isViewOnly } =
    useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  
  const getBasePath = () => {
    if (isContractVendorLike) return `/contract/vendor/contracts/${contractId}/lems`;
    if (isApprover) return `/contract/approver/contracts/${contractId}/lems`;
    if (isManager) return `/contract/manager/contracts/${contractId}/lems`;
    if (isAdmin || isViewOnly) return `/contract/user/contracts/${contractId}/lems`;
    return `/contract/user/contracts/${contractId}/lems`; // Default fallback
  };

  const basePath = getBasePath();

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "lem-list",
      contractId,
      debounced,
      basePath,
      currencyCode,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debounced) params.append("title", debounced);
      // Add pagination defaults if needed by the API
      params.append("page", "1");
      params.append("limit", "10");

      const res = await getRequest({
        url: `${basePath}?${params.toString()}`,
      });
      
      const payload = (res as any)?.data?.data || (res as any)?.data;
      const raw = payload?.resp ?? payload?.lems ?? [];
      const items = Array.isArray(raw) ? raw : [];
      
      const rows: LemRow[] = items.map((it: any) => ({
        id: it?.lemId || it?._id || "",
        title: it?.title || "",
        amount:
          typeof it?.amount === "number"
            ? formatCurrency(it.amount, "en-US", currencyCode)
            : it?.amount || "",
        submissionDate: it?.createdAt || it?.submissionDate || "",
        status: it?.status 
          ? it.status.charAt(0).toUpperCase() + it.status.slice(1).replace(/_/g, " ")
          : "Pending",
      }));
      return rows;
    },
    enabled: !!contractId && !!isActive,
  });

  return (
    <TabsContent value="lem" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Labor, Equipment & Material Reports
        </h3>
        {isContractVendorLike ? (
          <SubmitLemDialog
            contractId={contractId}
            trigger={
              <Button className="h-10 rounded-xl px-4">
                Submit LEM
              </Button>
            }
          />
        ) : null}
      </div>

      <LemTable
        contractId={contractId}
        rows={data || []}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={(v) => setSearch(v)}
        basePath={basePath}
        currency={currencyCode}
      />
    </TabsContent>
  );
};

export default LemTabContent;
