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
import { contractManagerApi } from "../api/contractManagerApi";
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
    <div className="text-xs font-medium text-[#9CA3AF]">{label}</div>
    <div className="text-sm font-medium text-[#111827]">{value}</div>
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

  const approver = data?.data?.approver;
  const approverName =
    [approver?.firstName, approver?.lastName]
      .filter((value) => typeof value === "string" && value.trim())
      .join(" ")
      .trim() || summary.name;
  const approverEmail =
    approver?.email?.trim() || (summary.email !== "-" ? summary.email : "");
  const approvalDetails = data?.data?.details ?? [];
  const latestApprovedDate = approvalDetails.reduce<string | undefined>(
    (latest, detail) => {
      if (!detail.approvedDate) return latest;
      if (!latest) return detail.approvedDate;
      return new Date(detail.approvedDate) > new Date(latest)
        ? detail.approvedDate
        : latest;
    },
    undefined,
  );

  const submissionDateLabel = latestApprovedDate
    ? formatDateTZ(latestApprovedDate, "MMMM dd, yyyy")
    : "N/A";
  const statusTone =
    summary.status === "Completed"
      ? "bg-[#DBEAFE] text-[#2563EB]"
      : "bg-[#FEF3C7] text-[#D97706]";

  const formatActionTitle = (title?: string) => {
    if (!title) return "Approval";
    if (title === "lem") return "LEM";
    return `${title.charAt(0).toUpperCase()}${title.slice(1)}`;
  };

  const formatActionStatus = (status?: string) => {
    if (!status) return "Pending";
    return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
  };

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
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <SheetTitle className="text-base font-semibold text-[#0F0F0F]">
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
              <div className="text-base font-semibold text-[#0F0F0F]">
                Approver Details
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F]"
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
                value={summary.assignedApprovals}
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF]">Status</div>
              <div
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}
              >
                {summary.status}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-base font-semibold text-[#0F0F0F]">
                Approval Status
              </div>
              <Accordion type="single" collapsible className="space-y-4">
                {approvalDetails.length ? (
                  approvalDetails.map((detail) => (
                    <AccordionItem
                      key={
                        detail._id ??
                        `${detail.title}-${detail.contractDetailRef}`
                      }
                      value={
                        detail._id ??
                        detail.contractDetailRef ??
                        detail.title ??
                        "approval"
                      }
                      className="rounded-xl border border-[#E5E7EB] px-4"
                    >
                      <AccordionTrigger className="py-4 text-sm font-semibold text-[#0F0F0F] hover:no-underline">
                        {formatActionTitle(detail.title)}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <LabelRow
                          label="Status"
                          value={formatActionStatus(detail.status)}
                        />
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-[#9CA3AF]">
                            Comments
                          </div>
                          <div className="text-sm text-[#374151]">
                            {detail.comment || "N/A"}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="text-sm font-medium text-[#2563EB] underline"
                        >
                          View Details
                        </button>
                      </AccordionContent>
                    </AccordionItem>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-[#E5E7EB] px-4 py-6 text-sm text-[#6B7280]">
                    No approval actions available.
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
  console.log({ rows });
  
  const columns = React.useMemo<ColumnDef<ApproverRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Approver Name",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">
              {row.original.name}
            </p>
            {row.original.email !== "-" ? (
              <a
                href={`mailto:${row.original.email}`}
                className="text-xs text-blue-600 underline"
              >
                {row.original.email}
              </a>
            ) : (
              <span className="text-xs text-slate-400">-</span>
            )}
          </div>
        ),
      },
      { accessorKey: "role", header: "Role" },
      { accessorKey: "approvalLevel", header: "Approval Level" },
      { accessorKey: "assignedApprovals", header: "Assigned Approvals" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const s = getValue<ApproverRow["status"]>();
          const tone =
            s === "Completed"
              ? "bg-blue-100 text-blue-700"
              : "bg-yellow-100 text-yellow-700";
          return (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tone}`}
            >
              {s}
            </span>
          );
        },
      },
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
                className="text-sm font-medium text-green-700 hover:underline"
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
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
            <span className="text-sm font-medium text-slate-900">
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
          container: "border border-[#E5E7EB] rounded-xl bg-white",
          tHeader: "bg-[#F9FAFB]",
          tHeadRow: "border-b border-[#E5E7EB]",
          tBody: "bg-white",
          tRow: "border-b border-[#E5E7EB]",
          tHead: "px-6 py-3 text-xs font-semibold text-slate-500",
          tCell: "px-6 py-4 text-sm text-slate-700 align-top",
        }}
        emptyPlaceholder={
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No approvers available.
          </div>
        }
      />
    </div>
  );
};

export default ApproversTable;
