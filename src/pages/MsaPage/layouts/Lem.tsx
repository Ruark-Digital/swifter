import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useToastHandler } from "@/hooks/useToaster";
import type { ApiResponseError } from "@/types";
import LemTable, { type LemRow } from "@/pages/ContractManagementPage/components/LemTable";
import SubmitLemDialog from "@/pages/ContractManagementPage/components/SubmitLemDialog";
import { formatCurrency, resolveCurrency } from "@/lib/utils";
import { useUser } from "@/store/authSlice";

type Props = {
  contractId: string;
  currency?: string;
  isActive?: boolean;
  actionsDisabled?: boolean;
};

const Lem: React.FC<Props> = ({ contractId, currency, isActive, actionsDisabled }) => {
  const currencyCode = resolveCurrency(currency, useUser()?.currency);
  const { isApprover, isManager, isVendor, isProjectManager, isAdmin, isViewOnly } =
    useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<unknown>(null);
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");

  const basePath = React.useMemo(() => {
    if (isVendor || isProjectManager)
      return `/contract/vendor/msa-contracts/${contractId}/lems`;
    if (isApprover) return `/contract/approver/msa-contracts/${contractId}/lems`;
    if (isManager) return `/contract/manager/msa-contracts/${contractId}/lems`;
    if (isAdmin || isViewOnly) return `/contract/user/msa-contracts/${contractId}/lems`;
    return `/contract/user/msa-contracts/${contractId}/lems`;
  }, [
    contractId,
    isAdmin,
    isApprover,
    isManager,
    isVendor,
    isProjectManager,
    isViewOnly,
  ]);

  const lemQueryKey = useUserQueryKey(["msa-lem-list", contractId, debounced, basePath]);

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  React.useEffect(() => {
    toastErrorRef.current = toastHandler.error;
  }, [toastHandler.error]);

  const { data, isLoading, error } = useQuery({
    queryKey: lemQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debounced) params.append("title", debounced);
      params.append("page", "1");
      params.append("limit", "200");

      const response = await getRequest({
        url: `${basePath}?${params.toString()}`,
      });

      const payload = (response as any)?.data?.data || (response as any)?.data;
      const items = payload?.resp || payload?.lems || [];
      const rows: LemRow[] = items.map((item: any) => ({
        id: item?.lemId || item?._id || "",
        title: item?.title || "",
        amount:
          typeof item?.amount === "number"
            ? formatCurrency(item.amount, "en-US", currencyCode)
            : item?.amount || "",
        submissionDate: item?.createdAt || item?.submissionDate || "",
        status: item?.status || "Pending",
      }));
      return rows;
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  React.useEffect(() => {
    if (!error) return;
    if (lastErrorRef.current === error) return;
    lastErrorRef.current = error;
    toastErrorRef.current("MSA LEM", error as ApiResponseError);
  }, [error]);

  const isVendorLike = isVendor || isProjectManager;

  return (
    <TabsContent value="lem" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold leading-[36px] tracking-[-0.02em] text-[#0F0F0F] dark:text-slate-100">
          Labor, Equipment & Material Reports
        </h3>
        {isVendorLike ? (
          <SubmitLemDialog
            contractId={contractId}
            currency={currencyCode}
            createPath={`/contract/vendor/msa-contracts/${contractId}/lems`}
            invalidateQueryKey={lemQueryKey}
            trigger={
              <Button className="h-10 rounded-xl px-4" disabled={!!actionsDisabled}>
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
        onSearchChange={setSearch}
        basePath={basePath}
        currency={currencyCode}
      />
    </TabsContent>
  );
};

export default Lem;
