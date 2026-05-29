import React from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ArrowLeft, Share2, X } from "lucide-react";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import type { ApiResponseError } from "@/types";
import { formatDateTZ } from "@/lib/utils";
import {
  contractManagerApi,
  type ContractApproverItem,
  type ContractApproverItemsByCategory,
} from "../api/contractManagerApi";
export type ApproverRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  approvalLevel: string;
  assignedApprovals: string;
  status: "Completed" | "Pending";
};

type Props = {
  rows: ApproverRow[];
  isLoading?: boolean;
  contractId: string;
};

type ApproverDetailsSheetProps = {
  trigger: React.ReactNode;
  contractId: string;
  approverId: string;
  summary: ApproverRow;
};

const LabelRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">{label}</div>
    <div className="text-sm font-medium text-[#111827] dark:text-slate-100">{value}</div>
  </div>
);

const ApproverDetailsSheet: React.FC<ApproverDetailsSheetProps> = ({
  trigger,
  contractId,
  approverId,
  summary,
}) => {
  const [open, setOpen] = React.useState(false);
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<unknown>(null);
  const queryKey = useUserQueryKey([
    "contract-approver",
    contractId,
    approverId,
  ]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () =>
      contractManagerApi.getContractApproverDetails(contractId, approverId),
    enabled: open && Boolean(contractId) && Boolean(approverId),
    staleTime: 60000,
    retry: false,
  });

  React.useEffect(() => {
    toastErrorRef.current = toastHandler.error;
  }, [toastHandler.error]);

  React.useEffect(() => {
    if (!error) return;
    if (lastErrorRef.current === error) return;
    lastErrorRef.current = error;
    toastErrorRef.current("Approver Details", error as ApiResponseError);
  }, [error]);

  const detail = data?.data;
  const approver = detail?.approver;
  const approverName =
    approver?.name?.trim() ||
    [approver?.firstName, approver?.lastName]
      .filter((value) => typeof value === "string" && value.trim())
      .join(" ")
      .trim() ||
    summary.name;
  const approverEmail =
    approver?.email?.trim() || (summary.email !== "-" ? summary.email : "");

  const submissionDateLabel = detail?.submissionDate
    ? formatDateTZ(detail.submissionDate, "dd MMM yyyy")
    : "N/A";

  const assignedApprovalLabel =
    detail?.assignedApproval &&
    typeof detail.assignedApproval.completed === "number" &&
    typeof detail.assignedApproval.total === "number"
      ? `${detail.assignedApproval.completed}/${detail.assignedApproval.total}`
      : summary.assignedApprovals;

  const formatActionStatus = (status?: string) => {
    if (!status) return "Pending";
    return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
  };

  const headerStatusRaw = detail?.status ?? summary.status;
  const headerStatusLabel = formatActionStatus(headerStatusRaw);
  const headerStatusKey = (headerStatusRaw ?? "").toString().toLowerCase();
  const headerStatusTone =
    headerStatusKey === "approved" || headerStatusKey === "completed"
      ? "bg-[#DBEAFE] text-[#2563EB] dark:bg-blue-900/40 dark:text-blue-200"
      : headerStatusKey === "rejected"
        ? "bg-[#FEE2E2] text-[#DC2626] dark:bg-red-900/40 dark:text-red-200"
        : "bg-[#FEF3C7] text-[#D97706] dark:bg-amber-900/40 dark:text-amber-200";

  const itemStatusTone = (status?: string) => {
    const key = (status ?? "").toLowerCase();
    if (key === "approved")
      return "bg-[#DBEAFE] text-[#2563EB] dark:bg-blue-900/40 dark:text-blue-200";
    if (key === "rejected")
      return "bg-[#FEE2E2] text-[#DC2626] dark:bg-red-900/40 dark:text-red-200";
    return "bg-[#FEF3C7] text-[#D97706] dark:bg-amber-900/40 dark:text-amber-200";
  };

  const contractCurrency = detail?.contract?.currency || "CAD";
  const formatAmount = (amount?: number) => {
    if (typeof amount !== "number") return null;
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: contractCurrency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${contractCurrency} ${amount.toLocaleString()}`;
    }
  };

  const ITEM_GROUPS: Array<{
    key: keyof ContractApproverItemsByCategory;
    label: string;
  }> = [
    { key: "project", label: "Project" },
    { key: "changes", label: "Change" },
    { key: "claims", label: "Claim" },
    { key: "invoices", label: "Invoice" },
    { key: "lems", label: "LEM" },
    { key: "amendments", label: "Amendment" },
  ];

  type FlatApproverItem = ContractApproverItem & {
    categoryLabel: string;
    rowKey: string;
  };

  const flatItems: FlatApproverItem[] = ITEM_GROUPS.flatMap(({ key, label }) =>
    (detail?.items?.[key] ?? []).map((item, idx) => ({
      ...item,
      categoryLabel: label,
      rowKey: `${key}-${item.refId ?? "x"}-${item.level ?? idx}-${idx}`,
    })),
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[560px] rounded-2xl overflow-y-auto [&>button]:hidden"
      >
        <div className="space-y-6" data-testid="approver-details-sheet">
          <SheetHeader className="space-y-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] dark:border-slate-700 text-[#111827] dark:text-slate-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <SheetTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                  Approval Scorecard
                </SheetTitle>
              </div>
              <SheetClose asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FCA5A5] text-[#EF4444]"
                >
                  <X className="h-4 w-4" />
                </button>
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                Approver Details
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#E5E7EB] dark:border-slate-700 px-3 text-xs font-semibold text-[#0F0F0F] dark:text-slate-100"
              >
                <Share2 className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <LabelRow
                label="Approval Name"
                value={isLoading ? "Loading..." : approverName || "N/A"}
              />
              <LabelRow
                label="Contact"
                value={
                  approverEmail ? (
                    <a
                      className="text-[#2563EB] underline"
                      href={`mailto:${approverEmail}`}
                    >
                      {approverEmail}
                    </a>
                  ) : (
                    "N/A"
                  )
                }
              />
              <LabelRow label="Submission Date" value={submissionDateLabel} />
              <LabelRow
                label="Assigned Approval"
                value={assignedApprovalLabel}
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">Status</div>
              <div
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${headerStatusTone}`}
              >
                {headerStatusLabel}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                Approval Status
              </div>
              <Accordion type="single" collapsible className="space-y-4">
                {flatItems.length ? (
                  flatItems.map((item) => {
                    const subtitle =
                      item.refCode ||
                      item.title ||
                      item.group ||
                      (typeof item.level === "number"
                        ? `Level ${item.level}`
                        : undefined);
                    const amountLabel = formatAmount(item.amount);
                    const actionedAtLabel = item.actionedAt
                      ? formatDateTZ(item.actionedAt, "dd MMM yyyy")
                      : item.completedAt
                        ? formatDateTZ(item.completedAt, "dd MMM yyyy")
                        : null;
                    return (
                      <AccordionItem
                        key={item.rowKey}
                        value={item.rowKey}
                        className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 px-4"
                      >
                        <AccordionTrigger className="py-4 hover:no-underline">
                          <div className="flex flex-1 items-center justify-between gap-3 pr-3">
                            <div className="flex flex-col items-start text-left">
                              <span className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100">
                                {item.categoryLabel}
                              </span>
                              {subtitle && (
                                <span className="text-xs font-normal text-[#6B7280] dark:text-slate-400">
                                  {subtitle}
                                </span>
                              )}
                            </div>
                            <span
                              className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${itemStatusTone(item.status)}`}
                            >
                              {formatActionStatus(item.status)}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {item.title && item.refCode && (
                            <LabelRow label="Title" value={item.title} />
                          )}
                          {item.group && (
                            <LabelRow
                              label="Approval Group"
                              value={item.group}
                            />
                          )}
                          {typeof item.level === "number" && (
                            <LabelRow
                              label="Level"
                              value={`Level ${item.level}`}
                            />
                          )}
                          {amountLabel && (
                            <LabelRow label="Amount" value={amountLabel} />
                          )}
                          {actionedAtLabel && (
                            <LabelRow
                              label="Actioned"
                              value={actionedAtLabel}
                            />
                          )}
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
                              Comment
                            </div>
                            <div className="text-sm text-[#374151] dark:text-slate-300">
                              {item.comment || "N/A"}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-[#E5E7EB] dark:border-slate-700 px-4 py-6 text-sm text-[#6B7280] dark:text-slate-400">
                    {isLoading
                      ? "Loading approval actions..."
                      : "No approval actions available."}
                  </div>
                )}
              </Accordion>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const ApproversTable: React.FC<Props> = ({ rows, isLoading, contractId }) => {
  
  const columns = React.useMemo<ColumnDef<ApproverRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Approver Name",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {row.original.name}
            </p>
            {row.original.email !== "-" ? (
              <a
                href={`mailto:${row.original.email}`}
                className="text-xs text-blue-600 dark:text-blue-400 underline"
              >
                {row.original.email}
              </a>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
            )}
          </div>
        ),
      },
      { accessorKey: "role", header: "Role" },
      { accessorKey: "approvalLevel", header: "Approval Level" },
      { accessorKey: "assignedApprovals", header: "Assigned Approvals" },
      // {
      //   accessorKey: "status",
      //   header: "Status",
      //   cell: ({ getValue }) => {
      //     const s = getValue<ApproverRow["status"]>();
      //     const tone =
      //       s === "Completed"
      //         ? "bg-blue-100 text-blue-700"
      //         : "bg-yellow-100 text-yellow-700";
      //     return (
      //       <span
      //         className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tone}`}
      //       >
      //         {s}
      //       </span>
      //     );
      //   },
      // },
      {
        id: "view",
        header: "Status",
        cell: ({ row }) => (
          <ApproverDetailsSheet
            contractId={contractId}
            approverId={row.original.id}
            summary={row.original}
            trigger={
              <button
                type="button"
                className="text-sm font-medium text-green-700 dark:text-green-400 hover:underline"
              >
                View
              </button>
            }
          />
        ),
      },
    ],
    [contractId],
  );

  return (
    <div className="space-y-4">
      <DataTable<ApproverRow>
        data={rows}
        columns={columns}
        header={() => (
          <div className="flex items-center justify-between w-full border-b border-[#E5E7EB] dark:border-slate-800 px-5 py-4">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Approvers
            </span>
          </div>
        )}
        options={{
          disableSelection: true,
          disablePagination: true,
          manualPagination: false,
          totalCounts: rows.length,
          isLoading: Boolean(isLoading),
          setPagination: () => {},
          pagination: { pageIndex: 0, pageSize: 10 },
        }}
        classNames={{
          container: "border border-[#E5E7EB] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900",
          tHeader: "bg-[#F9FAFB] dark:bg-slate-800",
          tHeadRow: "border-b border-[#E5E7EB] dark:border-slate-800",
          tBody: "bg-white dark:bg-slate-900",
          tRow: "border-b border-[#E5E7EB] dark:border-slate-800",
          tHead: "px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400",
          tCell: "px-6 py-4 text-sm text-slate-700 dark:text-slate-200 align-top",
        }}
        emptyPlaceholder={
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No approvers available.
          </div>
        }
      />
    </div>
  );
};

export default ApproversTable;
