import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Share2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useUserRole } from "@/hooks/useUserRole";
import { getRequest } from "@/lib/axiosInstance";
import { resolveHoldbackReleaseDate } from "@/lib/utils";
import PaymentSummaryMilestonesTable, {
  type PaymentMilestoneRow,
} from "@/pages/ContractManagementPage/components/PaymentSummaryMilestonesTable";
import { LabelItem } from "../components/LabelItem";

type PaymentSummaryProps = {
  contractId: string;
  isActive?: boolean;
  msa?: {
    currency?: string;
    contractValue?: number;
    holdBackReleased?: number;
    savingAmount?: number;
    holdBackBank?: number;
    holdBack?: number | string;
    contigency?: number | string;
    contingency?: number | string;
    paymentStructure?: string;
    paymentTerms?: { name?: string } | string;
    paymentTerm?: { name?: string } | string;
    milestone?: Array<{
      milestoneId?: string;
      name?: string;
      amount?: number;
      dueDate?: string | Date;
      deliverable?: { name?: string };
    }>;
  };
};

type HoldbackReleaseRow = {
  releaseId: string;
  releasedType: string;
  releasedAmount: string;
  status: string;
  releaseDate: string;
};

type SavingRealizedRow = {
  savingsId: string;
  savingsTitle: string;
  category: string;
  amount: string;
  dateSubmitted: string;
};

type PaymentHoldbackApi = {
  holdBackId?: string;
  type?: string;
  amount?: number;
  status?: string;
  releasedDate?: string | Date;
  releaseDate?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

type PaymentSavingApi = {
  savingId?: string;
  title?: string;
  category?: string;
  amount?: number;
  submittedDate?: string | Date;
};

const formatShortDate = (value?: string | Date) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  contractId,
  msa,
  isActive,
}) => {
  const { isVendor, isApprover, isViewOnly, isManager } = useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<{ holdbacks?: unknown; savings?: unknown }>(
    {},
  );

  const holdbacksQueryKey = useUserQueryKey([
    "msa-payment-holdbacks",
    contractId,
  ]);
  const savingsQueryKey = useUserQueryKey(["msa-payment-savings", contractId]);

  const apiPrefix = React.useMemo(() => {
    if (isVendor) return "/contract/vendor";
    if (isApprover) return "/contract/approver";
    if (isViewOnly) return "/contract/user";
    return "/contract/manager";
  }, [isApprover, isVendor, isViewOnly]);

  const {
    data: holdbacksResponse,
    error: holdbacksError,
    isLoading: holdbacksLoading,
  } = useQuery({
    queryKey: holdbacksQueryKey,
    queryFn: async () => {
      const res = await getRequest({
        url: `${apiPrefix}/msa-contract/${contractId}/payment-holdbacks`,
      });
      return res.data as { message?: string; data?: PaymentHoldbackApi[] };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const {
    data: savingsResponse,
    error: savingsError,
    isLoading: savingsLoading,
  } = useQuery({
    queryKey: savingsQueryKey,
    queryFn: async () => {
      const res = await getRequest({
        url: `${apiPrefix}/msa-contract/${contractId}/payment-savings`,
      });
      return res.data as { message?: string; data?: PaymentSavingApi[] };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  React.useEffect(() => {
    toastErrorRef.current = toastHandler.error;
  }, [toastHandler.error]);

  React.useEffect(() => {
    if (!holdbacksError) return;
    if (lastErrorRef.current.holdbacks === holdbacksError) return;
    lastErrorRef.current.holdbacks = holdbacksError;
    toastErrorRef.current("MSA Payment Holdbacks", holdbacksError as any);
  }, [holdbacksError]);

  React.useEffect(() => {
    if (!savingsError) return;
    if (lastErrorRef.current.savings === savingsError) return;
    lastErrorRef.current.savings = savingsError;
    toastErrorRef.current("MSA Payment Savings", savingsError as any);
  }, [savingsError]);

  const currency = msa?.currency || "USD";
  const formatMoney = React.useCallback(
    (value?: number) => {
      if (value == null || !Number.isFinite(value)) return "-";
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(value);
      } catch {
        return `${value}`;
      }
    },
    [currency],
  );

  const milestoneRows = React.useMemo<PaymentMilestoneRow[]>(() => {
    const milestones = Array.isArray(msa?.milestone) ? msa.milestone : [];
    return milestones.map((item, index) => ({
      milestoneId: item?.milestoneId ?? `MIL-${index + 1}`,
      milestoneTitle: item?.name ?? "-",
      deliverable: item?.deliverable?.name ?? item?.name ?? "-",
      amount: formatMoney(item?.amount),
      dueDate: formatShortDate(item?.dueDate),
    }));
  }, [formatMoney, msa?.milestone]);

  const holdbackRows = React.useMemo<HoldbackReleaseRow[]>(() => {
    const holdbacks = holdbacksResponse?.data ?? [];
    return holdbacks.map((holdback) => ({
      releaseId: holdback?.holdBackId ?? "-",
      releasedType:
        holdback?.type === "full"
          ? "Full"
          : holdback?.type === "partial"
            ? "Partial"
            : holdback?.type || "-",
      releasedAmount: formatMoney(holdback?.amount),
      status: holdback?.status ?? "-",
      releaseDate: formatShortDate(resolveHoldbackReleaseDate(holdback)),
    }));
  }, [formatMoney, holdbacksResponse?.data]);

  const savingRows = React.useMemo<SavingRealizedRow[]>(() => {
    const savings = savingsResponse?.data ?? [];
    return savings.map((saving) => ({
      savingsId: saving?.savingId ?? "-",
      savingsTitle: saving?.title ?? "-",
      category: saving?.category ?? "-",
      amount: formatMoney(saving?.amount),
      dateSubmitted: formatShortDate(saving?.submittedDate),
    }));
  }, [formatMoney, savingsResponse?.data]);

  const holdbackColumns = React.useMemo<ColumnDef<HoldbackReleaseRow>[]>(
    () => [
      { accessorKey: "releaseId", header: "Release ID" },
      { accessorKey: "releasedType", header: "Released Type" },
      {
        accessorKey: "releasedAmount",
        header: () => <div className="text-center">Released Amount</div>,
        cell: ({ getValue }) => (
          <div className="text-center">{getValue<string>()}</div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ getValue }) => (
          <div className="text-center">{getValue<string>()}</div>
        ),
      },
      {
        accessorKey: "releaseDate",
        header: () => <div className="text-center">Release Date</div>,
        cell: ({ getValue }) => (
          <div className="text-center">{getValue<string>()}</div>
        ),
      },
    ],
    [],
  );

  const savingsColumns = React.useMemo<ColumnDef<SavingRealizedRow>[]>(
    () => [
      { accessorKey: "savingsId", header: "Savings ID" },
      { accessorKey: "savingsTitle", header: "Savings Title" },
      { accessorKey: "category", header: "Category" },
      {
        accessorKey: "amount",
        header: () => <div className="text-center">Amount</div>,
        cell: ({ getValue }) => (
          <div className="text-center">{getValue<string>()}</div>
        ),
      },
      {
        accessorKey: "dateSubmitted",
        header: () => <div className="text-center">Date Submitted</div>,
        cell: ({ getValue }) => (
          <div className="text-center">{getValue<string>()}</div>
        ),
      },
    ],
    [],
  );

  const paymentTermValue = React.useMemo(() => {
    const paymentTerm = msa?.paymentTerms ?? msa?.paymentTerm;
    if (typeof paymentTerm === "string") return paymentTerm;
    return paymentTerm?.name || "-";
  }, [msa?.paymentTerm, msa?.paymentTerms]);

  const contigencyValue = React.useMemo(() => {
    const value = msa?.contigency ?? msa?.contingency;
    if (typeof value === "number") return formatMoney(value);
    if (typeof value === "string" && value.trim()) return value;
    return "-";
  }, [formatMoney, msa?.contigency, msa?.contingency]);

  const holdbackValue = React.useMemo(() => {
    if (typeof msa?.holdBack === "number") return `${msa.holdBack}%`;
    if (typeof msa?.holdBack === "string") return msa.holdBack;
    return "-";
  }, [msa?.holdBack]);

  return (
    <TabsContent value="payment-summary" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#0F0F0F]">
          Payment Summary
        </h3>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="inline-flex h-12 items-center gap-2 text-sm rounded-xl border border-[#E5E7EB] px-5 font-semibold text-[#0F0F0F]"
          >
            <Share2 className="h-5 w-5" />
            Export Report
          </button>
          {isManager && (
            <>
              <button
                type="button"
                className="inline-flex h-12 items-center rounded-xl text-sm border border-[#E5E7EB] bg-[#F3F4F6] px-5 font-semibold text-[#0F0F0F]"
              >
                Update Saving
              </button>
              <button
                type="button"
                className="inline-flex h-12 items-center rounded-xl text-sm bg-[#2A4467] px-5 font-semibold text-white"
              >
                Release Holdback
              </button>
            </>
          )}
        </div>
      </div>

      {(holdbacksLoading || savingsLoading) && (
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#6B7280]">
          Loading payment data…
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
        <LabelItem label="Contract Value" value={formatMoney(msa?.contractValue)} />

        <LabelItem label="Contigency" value={contigencyValue} />

        <LabelItem label="Holdback" value={holdbackValue} />

        <LabelItem label="Holdback Amount" value={formatMoney(msa?.holdBackBank)} />

        <LabelItem label="Holdback Released" value={formatMoney(msa?.holdBackReleased)} />

        <LabelItem label="Savings Realized" value={formatMoney(msa?.savingAmount)} />

        <LabelItem label="Payment Structure" value={msa?.paymentStructure || "-"} />

        <LabelItem label="Payment Term" value={paymentTermValue} />
      </div>

      <Tabs defaultValue="milestones" className="w-full space-y-6">
        <TabsList className="h-auto rounded-full bg-[#F3F4F6] p-2">
          <TabsTrigger
            value="milestones"
            className="rounded-full px-6 py-1.5 text-sm font-semibold text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            MileStones
          </TabsTrigger>
          <TabsTrigger
            value="holdback-release"
            className="rounded-full px-6 py-1.5 text-sm font-semibold text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Holdback Release
          </TabsTrigger>
          <TabsTrigger
            value="saving-realized"
            className="rounded-full px-6 py-1.5 text-sm font-semibold text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Saving Reaized
          </TabsTrigger>
        </TabsList>

        <TabsContent value="milestones">
          <PaymentSummaryMilestonesTable
            rows={milestoneRows}
            getRowSearchValues={(row) => [
              row.milestoneId,
              row.milestoneTitle,
              row.deliverable,
              row.amount,
              row.dueDate,
            ]}
          />
          {milestoneRows.length === 0 && (
            <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#6B7280]">
              No milestones found.
            </div>
          )}
        </TabsContent>

        <TabsContent value="holdback-release">
          <PaymentSummaryMilestonesTable<HoldbackReleaseRow>
            title="Holdback Release"
            rows={holdbackRows}
            columns={holdbackColumns}
            getRowSearchValues={(row) => [
              row.releaseId,
              row.releasedType,
              row.releasedAmount,
              row.status,
              row.releaseDate,
            ]}
          />
          {holdbackRows.length === 0 && (
            <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#6B7280]">
              No holdback releases available.
            </div>
          )}
        </TabsContent>

        <TabsContent value="saving-realized">
          <PaymentSummaryMilestonesTable<SavingRealizedRow>
            title="Savings Realized"
            rows={savingRows}
            columns={savingsColumns}
            getRowSearchValues={(row) => [
              row.savingsId,
              row.savingsTitle,
              row.category,
              row.amount,
              row.dateSubmitted,
            ]}
          />
          {savingRows.length === 0 && (
            <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#6B7280]">
              No savings records found.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </TabsContent>
  );
};

export default PaymentSummary;
