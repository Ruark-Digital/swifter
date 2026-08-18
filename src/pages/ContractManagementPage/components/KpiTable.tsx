import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search, ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/layouts/DataTable";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  // DialogHeader,
  // DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { Forge, Forger, useForge } from "@adexdsamson/forge";
// import * as yup from "yup";
// import { yupResolver } from "@hookform/resolvers/yup";
import { postRequest } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { useToastHandler } from "@/hooks/useToaster";
import { format } from "date-fns";
import type { ApiResponseError } from "@/types";

const formatSubmissionDate = (value?: string) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, "dd MMM yyyy");
};

export type KpiRow = {
  kpiId: string;
  category: string;
  currentAvgScore: string;
  allTimeAvgScore: string;
  lastUpdated: string;
  actions: Array<"Update" | "View">;
};

type Props = {
  rows: KpiRow[];
  contractId: string;
  basePath?: string;
  canUpdate?: boolean;
};


const KpiDetailSheet: React.FC<{
  contractId: string;
  kpiId: string;
  basePath: string;
  canUpdate: boolean;
}> = ({ contractId, kpiId, basePath, canUpdate }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["contract-kpi-detail", contractId, basePath, kpiId],
    queryFn: async () => {
      const res = await getRequest({
        url: `${basePath}/${kpiId}`,
      });
      return res.data?.data;
    },
    enabled: !!kpiId,
  });

  return (
    <SheetContent side="right" className="sm:max-w-[680px]">
      <div className="rounded-t-xl bg-[#F9FAFB] dark:bg-slate-800 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SheetClose asChild>
              <button
                type="button"
                aria-label="Back"
                className="text-[#2A4467] dark:text-blue-300"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </SheetClose>
            <span className="text-xl font-semibold text-[#2A4467] dark:text-blue-300">
              KPI Details
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 space-y-8">
        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            Loading...
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">Failed to load KPI</div>
        ) : data ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                {data.category || "N/A"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-6 h-full">
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Category</span>
                <span className="block text-[#0F0F0F] dark:text-slate-100">
                  {data.category || "N/A"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">KPI ID</span>
                <span className="block text-[#0F0F0F] dark:text-slate-100">
                  {(data.kpiId as string) || "N/A"}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Submission Date</span>
                <span className="block font-semibold text-[#0F0F0F] dark:text-slate-100">
                  {formatSubmissionDate(data.submissionDate as string)}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Time-Stamp Delivery</span>
                <span className="block font-semibold text-[#0F0F0F] dark:text-slate-100">
                  {(data.target as string) ?? "N/A"}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Scheduled Confirmation</span>
                <span className="block font-semibold text-[#0F0F0F] dark:text-slate-100">
                  {(data.scheduledConfirmation as string) || "N/A"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Milestone Logs</span>
                <span className="block font-semibold text-[#0F0F0F] dark:text-slate-100">
                  {(data.milestoneLogs as string) || "N/A"}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Avg. Score</span>
                <span className="block text-[#0F0F0F] dark:text-slate-100">
                  {(data.currentAvgScore as string) ?? "N/A"}
                </span>
              </div>
            </div>

            {canUpdate && (
              <div className="flex justify-end pt-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="h-12 rounded-xl bg-[#2A4467] px-6 text-white hover:bg-[#2A4467]/90">
                      Update Score
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px] p-0 rounded-2xl">
                    <div className="max-h-[80vh] overflow-y-auto">
                      <UpdateVendorPerformanceDialog
                        contractId={contractId}
                        kpiId={kpiId}
                        basePath={basePath}
                        category={(data.category as string) || ""}
                        target={(data.target as string) || ""}
                        nonCompliance={(data.nonCompliance as string) || ""}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-slate-600">No KPI data</div>
        )}
      </div>
    </SheetContent>
  );
};

type MetricConfig = {
  key: string;
  label: string;
};

const CATEGORY_METRICS: Record<string, MetricConfig[]> = {
  "On‑Time Delivery/Schedule Compliance": [
    { key: "timestampDelivery", label: "Timestamped delivery (Optional)" },
    { key: "scheduleConfirm", label: "Schedule confirmations" },
    { key: "mileStoneLog", label: "Milestone logs" },
  ],
  "Quality & Specification Compliance": [
    { key: "inspectionReport", label: "Inspection reports" },
    { key: "NCRLog", label: "NCR logs" },
    { key: "QADocs", label: "QA documentation" },
  ],
  Responsiveness: [
    { key: "timestampComLog", label: "Timestamped communication logs" },
  ],
  "Contractual Compliance": [
    { key: "complianceTracking", label: "Compliance Tracking" },
  ],
  "Cost Variance": [
    { key: "invoiceContract", label: "Automated invoice-to-contract rate matching. (Auto check of contract rates and Invoice rates or Milestone amount in contract Vs Invoice )" },
  ],
  "Invoice Accuracy": [
    { key: "twoWay", label: "2‑way/3‑way matching results. (Auto check of contract rates and Invoice rates or Milestone amount in contract Vs Invoice)" },
  ],
  "Issue Resolution": [
    { key: "issueResolution", label: "Issue Resolution" },
  ],
};

// Prepopulated Target / Non-Compliance copy per KPI category, transcribed from
// the figma design. Used as a fallback so the dialog shows the standard
// description instead of "N/A" when the API doesn't carry these fields.
const CATEGORY_DESCRIPTIONS: Record<
  string,
  { target: string; nonCompliance: string }
> = {
  "On‑Time Delivery/Schedule Compliance": {
    target:
      "≥ 95% of deliveries or milestones completed by the contractual due date.",
    nonCompliance:
      "Triggered when performance falls below 90% for two consecutive months.",
  },
  "Quality & Specification Compliance": {
    target: "≥ 98% of goods/services meeting contractual specifications.",
    nonCompliance: "More than 2 NCRs per quarter or quality score < 95%.",
  },
  Responsiveness: {
    target:
      "Vendor responds to inquiries, clarifications, RFI's or corrective actions within 48 hours.",
    nonCompliance: "Average response time > 72 hours.",
  },
  "Contractual Compliance": {
    target:
      "100% compliance with contractual obligations (insurance, certifications, safety documents, KPIs).",
    nonCompliance: "Any mandatory document lapses for more than 7 days.",
  },
  "Cost Variance": {
    target: "≤ 5% variance between contracted rates and invoiced amounts.",
    nonCompliance:
      "More than 5% variance between contracted rates and invoiced amounts.",
  },
  "Invoice Accuracy": {
    target: "≥ 98% of invoices submitted without discrepancies.",
    nonCompliance: "More than 2% of invoices submitted with discrepancies.",
  },
  "Issue Resolution": {
    target: "Corrective actions resolved within 5 business days.",
    nonCompliance: "Average resolution time > 7 business days.",
  },
};

const MetricScale: React.FC<{
  label: string;
  onChange: (v: number) => void;
  value: string;
}> = ({ label, onChange, value }) => {
  const current = Number(value);
  return (
    <div className="space-y-2">
      <p className="text-[#0F0F0F] dark:text-slate-100 text-sm">{label}</p>
      <div className="space-y-3">
        <div className="flex items-center gap-8">
          {[1, 2, 3, 4, 5].map((v) => {
            const active = current === v;
            return (
              <div key={v} className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange(v)}
                  aria-pressed={active}
                  className={
                    active
                      ? "flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#2A4467] bg-[#F9F5FF]"
                      : "h-6 w-6 rounded-full border-2 border-[#E5E7EB] dark:border-slate-600 bg-white dark:bg-slate-800"
                  }
                >
                  {active && (
                    <span className="block h-2.5 w-2.5 rounded-full bg-[#2A4467]" />
                  )}
                </button>
                <span className="text-[#374151] dark:text-slate-300 text-sm font-semibold">{v}</span>
              </div>
            );
          })}
        </div>
        <div className="flex w-[160px] justify-between text-xs font-semibold text-[#286EE0]">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
};

const UpdateVendorPerformanceDialog: React.FC<{
  contractId: string;
  kpiId: string;
  basePath: string;
  category: string;
  target: string;
  nonCompliance: string;
}> = ({ contractId, kpiId, basePath, category, target, nonCompliance }) => {
  const { control, reset } = useForge({
    defaultValues: {
      category,
      target,
      nonCompliance,
    },
    mode: "onChange",
  });
  const { success, error } = useToastHandler();
  const queryClient = useQueryClient();
  const [successOpen, setSuccessOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const metrics = CATEGORY_METRICS[category] ?? [];
  const descriptions = CATEGORY_DESCRIPTIONS[category];
  const resolvedTarget = target || descriptions?.target || "N/A";
  const resolvedNonCompliance =
    nonCompliance || descriptions?.nonCompliance || "N/A";

  const onSubmit = async (payload: any) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const metricsPayload: Record<string, number> = {};
      for (const m of metrics) {
        const v = Number(payload[m.key]);
        if (Number.isFinite(v)) metricsPayload[m.key] = v;
      }
      await postRequest({
        url: `${basePath}/${kpiId}`,
        payload: metricsPayload,
      });
      // Refetch the KPI list (and any open detail) so the updated scores /
      // lastUpdated land immediately. KpiTable is shared, so invalidate both
      // surfaces' list prefixes — MSA appends a user id via useUserQueryKey,
      // but React Query matches by prefix so ["msa-kpis", contractId] catches
      // it. A non-matching prefix is a harmless no-op on the other surface.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["msa-kpis", contractId] }),
        queryClient.invalidateQueries({ queryKey: ["contract-kpis", contractId] }),
        queryClient.invalidateQueries({
          queryKey: ["contract-kpi-detail", contractId, basePath, kpiId],
        }),
      ]);
      success("KPI updated", "Values submitted successfully");
      reset();
      setSuccessOpen(true);
    } catch (e) {
      error("Failed to update KPI", e as ApiResponseError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 p-8">
      <div className="flex items-center justify-between">
        <p className="text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">
          Update Vendor Performance
        </p>
      </div>

      <Forge control={control} onSubmit={onSubmit} className="mt-6 space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-[#0F0F0F] dark:text-slate-100">Category</p>
          <div className="h-12 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-[#2A4467]/5 dark:bg-slate-800 px-4 flex items-center text-sm text-[#6B6B6B] dark:text-slate-300">
            {category || "N/A"}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-[#0F0F0F] dark:text-slate-100">Target</p>
          <div className="min-h-12 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-[#2A4467]/5 dark:bg-slate-800 px-4 py-3 flex items-center text-sm text-[#6B6B6B] dark:text-slate-300">
            {resolvedTarget}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-[#0F0F0F] dark:text-slate-100">Non-Compliance</p>
          <div className="min-h-12 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-[#2A4467]/5 dark:bg-slate-800 px-4 py-3 flex items-center text-sm text-[#6B6B6B] dark:text-slate-300">
            {resolvedNonCompliance}
          </div>
        </div>

        <div className="space-y-6">
          {metrics.map((m) => (
            <Forger
              key={m.key}
              name={m.key}
              component={MetricScale}
              label={m.label}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-6">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            className="h-12 flex-1 rounded-xl bg-[#F3F4F6] dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 disabled:opacity-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="h-12 flex-1 rounded-xl bg-[#2A4467] text-white hover:bg-[#2A4467]/90 disabled:opacity-80"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update KPI"
            )}
          </Button>
        </div>
      </Forge>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-[500px] p-8 rounded-2xl">
          <div className="flex flex-col items-center gap-6">
            <div className="h-16 w-16 rounded-full bg-[#EAF7EE] grid place-items-center">
              <span className="h-8 w-8 rounded-full bg-[#16A34A] grid place-items-center">
                <span className="block h-4 w-2 rotate-45 border-b-2 border-r-2 border-white" />
              </span>
            </div>
            <p className="text-center text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">
              KPI Updated Successfully
            </p>
            <Button
              className="h-12 w-full rounded-xl bg-[#2A4467] text-white hover:bg-[#2A4467]/90"
              onClick={() => setSuccessOpen(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const KpiTable: React.FC<Props> = ({
  rows,
  contractId,
  basePath,
  canUpdate = true,
}) => {
  const [search, setSearch] = React.useState("");
  const resolvedBasePath =
    basePath || `/contract/manager/contracts/${contractId}/kpis`;

  const columns: ColumnDef<KpiRow>[] = [
    {
      accessorKey: "kpiId",
      header: "KPI ID",
      cell: ({ getValue }) => (
        <div className="w-[100px] py-2 text-sm font-semibold text-[#374151] dark:text-slate-200">
          {getValue<string>()}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ getValue }) => (
        <div className="w-[160px] overflow-hidden py-2 text-sm font-medium text-[#374151] dark:text-slate-200">
          {getValue<string>()}
        </div>
      ),
    },
    {
      accessorKey: "currentAvgScore",
      header: () => (
        <div className="w-[160px] overflow-hidden">Current Avg. Score</div>
      ),
      cell: ({ getValue }) => (
        <div className="w-[160px] py-2 text-sm font-medium text-[#374151] dark:text-slate-200">
          {getValue<string>()}
        </div>
      ),
    },
    {
      accessorKey: "allTimeAvgScore",
      header: () => (
        <div className="w-[160px] overflow-hidden">All Time Avg. Score</div>
      ),
      cell: ({ getValue }) => (
        <div className="w-[160px] py-2 text-sm font-medium text-[#374151] dark:text-slate-200">
          {getValue<string>()}
        </div>
      ),
    },
    {
      accessorKey: "lastUpdated",
      header: () => (
        <div className="w-[160px] overflow-hidden">Last Updated</div>
      ),
      cell: ({ getValue }) => (
        <div className="w-[160px] py-2 text-sm font-medium text-[#374151] dark:text-slate-200">
          {getValue<string>()}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="w-[80px]">Action</div>,
      cell: ({ row }) => {
        const actions = row.original.actions;
        return (
          <div className="flex w-[80px] items-center justify-center gap-[10px] py-2">
            {/* {actions.includes("Update") && canUpdate && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant={"link"}
                    className="text-sm font-bold text-[#286EE0] underline"
                  >
                    Update
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:">
                  <DialogHeader>
                    <DialogTitle>Update KPI</DialogTitle>
                  </DialogHeader>
                  <KpiUpdateDialogForm
                    kpiId={row.original.kpiId}
                    basePath={resolvedBasePath}
                  />
                </DialogContent>
              </Dialog>
            )} */}
            
            {actions.includes("View") && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant={"link"}
                    className="text-sm font-bold text-[#43A047] underline"
                  >
                    View
                  </Button>
                </SheetTrigger>
                <KpiDetailSheet
                  contractId={contractId}
                  kpiId={row.original.kpiId}
                  basePath={resolvedBasePath}
                  canUpdate={canUpdate}
                />
              </Sheet>
            )}
          </div>
        );
      },
    },
  ];

  const filteredRows = React.useMemo(() => {
    if (!search) return rows;
    const query = search.toLowerCase();
    return rows.filter((row) =>
      [
        row.kpiId,
        row.category,
        row.currentAvgScore,
        row.allTimeAvgScore,
        row.lastUpdated,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [search, rows]);

  return (
    <div className="relative flex flex-col gap-8">
      <div className="flex flex-col rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E9E9EB] dark:border-slate-800 px-6 py-6">
          <div className="flex items-center gap-6">
            <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">KPI</div>
            <div className="relative w-[300px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#6B6B6B] dark:text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="h-12 w-[300px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 pl-9 text-sm text-[#0F0F0F] dark:text-slate-100 dark:bg-slate-900 placeholder:text-[#6B6B6B] dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        <DataTable<KpiRow>
          data={filteredRows}
          columns={columns}
          options={{
            disableSelection: true,
            disablePagination: true,
            manualPagination: false,
            totalCounts: filteredRows.length,
            setPagination: () => {},
            pagination: { pageIndex: 0, pageSize: 10 },
          }}
          classNames={{
            container: "[&>div:last-child]:hidden",
            table: "border-spacing-y-0",
            tHeader: "bg-[#F9FAFB] dark:bg-slate-800",
            tHeadRow: "border-b border-[#E5E7EB] dark:border-slate-800",
            tBody: "bg-white dark:bg-slate-900",
            tRow: "border-b border-[#E5E7EB] dark:border-slate-800",
            tHead: "px-6 py-3 text-sm font-semibold text-[#2A4467] dark:text-indigo-300",
            tCell: "px-6 py-4 text-sm text-slate-700 dark:text-slate-200 align-top",
          }}
        />
      </div>
    </div>
  );
};

export default KpiTable;
