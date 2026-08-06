import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/layouts/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ArrowLeft, Share2, X } from "lucide-react";
import { getRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useToastHandler } from "@/hooks/useToaster";
import { cn, formatDateTZ } from "@/lib/utils";
import type { ApiResponseError } from "@/types";

type Props = {
  contractId: string;
  isActive?: boolean;
};

type ApproverRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  approvalLevel: string;
  assignedApprovals: string;
  status: string;
  raw: any;
};

// Shape returned by GET /{role}/msa-contracts/{contractId}/approvers/{approverId}.
// Only the fields the sheet renders are typed; the rest is intentionally loose.
type MsaApproverDetail = {
  approver?: { _id?: string; name?: string | null; email?: string | null };
  submissionDate?: string;
  assignedApproval?: { completed?: number; total?: number };
  status?: string;
  models?: Record<
    string,
    { status?: string; comment?: string | null; actionedAt?: string | null }
  >;
  items?: Record<string, Array<{
    refId?: string;
    refType?: string;
    refCode?: string | null;
    title?: string;
    status?: string;
    comment?: string | null;
    actionedAt?: string | null;
    level?: number | null;
    group?: string | null;
    amount?: number | null;
    completedAt?: string | null;
  }>>;
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

const APPROVAL_ITEM_LABELS: Record<string, string> = {
  project: "Projects",
  changes: "Changes",
  claims: "Claims",
  invoices: "Invoices",
  lems: "LEMs",
  amendments: "Amendments",
};

const ApprovalItemsList = ({
  items,
}: {
  items: MsaApproverDetail["items"];
}) => {
  const entries = Object.entries(items ?? {}).filter(
    ([, list]) => Array.isArray(list) && list.length > 0,
  );
  if (entries.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100">
        Assigned Approvals
      </div>
      {entries.map(([key, list]) => (
        <div key={key} className="space-y-2">
          <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
            {APPROVAL_ITEM_LABELS[key] ?? key}
          </div>
          <ul className="space-y-1.5">
            {list.map((item, idx) => (
              <li
                key={item.refId ?? idx}
                className="flex items-center justify-between rounded-md border border-[#E5E7EB] dark:border-slate-800 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-[#111827] dark:text-slate-100">
                    {item.title || item.refCode || item.refType || "Untitled"}
                  </div>
                  {item.refCode && (
                    <div className="text-xs text-[#9CA3AF] dark:text-slate-400">
                      {item.refCode}
                    </div>
                  )}
                </div>
                <span
                  className={cn(
                    "ml-3 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                    getStatusClass(item.status ?? "Pending"),
                  )}
                >
                  {item.status ?? "Pending"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

const normalizeStatus = (
  value?: string,
  assignedApprovals?: string,
): string => {
  // BE provides a meaningful status label ("Not Assigned", "Pending",
  // "Approved", "Rejected", "Completed") — preserve it verbatim.
  if (value && value.trim()) return value.trim();
  if (assignedApprovals) {
    const [done, total] = assignedApprovals
      .split("/")
      .map((part) => Number(part.trim()));
    if (
      Number.isFinite(done) &&
      Number.isFinite(total) &&
      total > 0 &&
      done >= total
    ) {
      return "Completed";
    }
  }
  return "Pending";
};

const getStatusClass = (status: string) => {
  const key = status.toLowerCase();
  if (key === "completed" || key === "approved")
    return "bg-[#EAF2FF] text-[#2563EB]";
  if (key === "rejected") return "bg-[#FEE2E2] text-[#DC2626]";
  if (key === "not assigned")
    return "bg-[#F3F4F6] text-[#6B7280] dark:bg-slate-800 dark:text-slate-300";
  return "bg-[#FFF8E0] text-[#E8AE00]";
};

// Resolve the role-aware base path for a single MSA approver detail fetch.
// Mirrors the list's `basePath` so manager/vendor/approver/view-only each hit
// their own prefixed endpoint (e.g. /contract/manager/msa-contracts/:id/approvers/:aid).
const approverDetailBasePath = (
  contractId: string,
  role: {
    isManager: boolean;
    isApprover: boolean;
    isVendor: boolean;
    isProjectManager: boolean;
    isViewOnly: boolean;
  },
): string => {
  if (role.isVendor || role.isProjectManager)
    return `/contract/vendor/msa-contracts/${contractId}`;
  if (role.isApprover) return `/contract/approver/msa-contracts/${contractId}`;
  if (role.isViewOnly) return `/contract/user/msa-contracts/${contractId}`;
  return `/contract/manager/msa-contracts/${contractId}`;
};

const ApproverDetailsSheet = ({
  trigger,
  row,
  contractId,
}: {
  trigger: React.ReactNode;
  row: ApproverRow;
  contractId: string;
}) => {
  const { isManager, isApprover, isVendor, isProjectManager, isViewOnly } =
    useUserRole();
  // Prefer the approver's own id (matches the detail route param). Fall back to
  // the list row id, which is set from approverId || _id in the flat mapping.
  const approverId = row.raw?.approverId || row.raw?._id || row.id;

  // Fetch the dedicated MSA approver detail. The list payload only carries a
  // summary, so the sheet would otherwise show stale/partial data. The detail
  // endpoint returns completed/total approvals and per-type approval items.
  const {
    data: detailData,
    isLoading: detailLoading,
  } = useQuery({
    queryKey: useUserQueryKey([
      "msa-approver-detail",
      contractId,
      approverId,
    ]),
    queryFn: async () => {
      const base = approverDetailBasePath(contractId, {
        isManager,
        isApprover,
        isVendor,
        isProjectManager,
        isViewOnly,
      });
      const response = await getRequest({
        url: `${base}/approvers/${approverId}`,
      });
      return response.data as { data?: MsaApproverDetail };
    },
    enabled: Boolean(contractId) && Boolean(approverId),
    staleTime: 60000,
    retry: false,
  });

  // The detail fetch augments the list row; fall back to list data on any gap.
  const detail = detailData?.data;
  const createdAt =
    detail?.submissionDate ||
    row.raw?.createdAt ||
    row.raw?.updatedAt;
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[560px] rounded-2xl overflow-y-auto [&>button]:hidden"
      >
        <div className="space-y-6">
          <SheetHeader className="space-y-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SheetClose asChild>
                  <button
                    type="button"
                    aria-label="Close approver details"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] dark:border-slate-800 text-[#111827] dark:text-slate-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </SheetClose>
                <SheetTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                  Approver
                </SheetTitle>
              </div>
              <SheetClose asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FCA5A5] dark:border-red-900/60 text-[#EF4444]"
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
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                  getStatusClass(detail?.status ?? row.status),
                )}
              >
                {detail?.status ?? row.status}
              </span>
            </div>
            {detailLoading && (
              <div className="text-xs text-[#9CA3AF] dark:text-slate-400">
                Loading approver details…
              </div>
            )}
            <div className="grid gap-6 sm:grid-cols-2">
              <LabelRow
                label="Approver Name"
                value={detail?.approver?.name ?? row.name || "N/A"}
              />
              <LabelRow
                label="Contact"
                value={
                  (detail?.approver?.email ?? row.email) !== "-" ? (
                    <a
                      className="text-[#2563EB] underline"
                      href={`mailto:${detail?.approver?.email ?? row.email}`}
                    >
                      {detail?.approver?.email ?? row.email}
                    </a>
                  ) : (
                    "N/A"
                  )
                }
              />
              <LabelRow label="Role" value={row.role || "-"} />
              <LabelRow
                label="Approval Level"
                value={row.approvalLevel || "-"}
              />
              <LabelRow
                label="Assigned Approvals"
                value={
                  detail?.assignedApproval
                    ? `${detail.assignedApproval.completed ?? 0}/${
                        detail.assignedApproval.total ?? 0
                      }`
                    : row.assignedApprovals || "-"
                }
              />
              <LabelRow
                label="Last Updated"
                value={
                  createdAt ? formatDateTZ(createdAt, "MMMM dd, yyyy") : "N/A"
                }
              />
            </div>
            {detail?.items && (
              <ApprovalItemsList items={detail.items} />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const Approvers: React.FC<Props> = ({ contractId, isActive }) => {
  const { isManager, isApprover, isVendor, isProjectManager, isViewOnly } =
    useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<unknown>(null);

  const basePath = React.useMemo(() => {
    if (isVendor || isProjectManager)
      return `/contract/vendor/msa-contracts/${contractId}`;
    if (isApprover) return `/contract/approver/msa-contracts/${contractId}`;
    if (isViewOnly) return `/contract/user/msa-contracts/${contractId}`;
    if (isManager) return `/contract/manager/msa-contracts/${contractId}`;
    return `/contract/manager/msa-contracts/${contractId}`;
  }, [
    contractId,
    isApprover,
    isManager,
    isVendor,
    isProjectManager,
    isViewOnly,
  ]);

  const approversPath = React.useMemo(
    () => `${basePath}/approvers`,
    [basePath],
  );

  const queryKey = useUserQueryKey([
    "msa-approvers",
    contractId,
    approversPath,
  ]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getRequest({ url: approversPath });
      return response.data as { data?: any[] | { approvers?: any[] } | any };
    },
    enabled: Boolean(contractId) && !!isActive,
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
    toastErrorRef.current("MSA Approvers", error as ApiResponseError);
  }, [error]);

  const rows = React.useMemo<ApproverRow[]>(() => {
    const payload = (data as any)?.data;
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.approvers)
        ? payload.approvers
        : Array.isArray(payload?.data?.approvers)
          ? payload.data.approvers
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

    // Current BE shape: a flat array where each item is a single approver
    // (has approverId/name and no nested `user[]` group array).
    const isFlatApproverShape = list.some(
      (item: any) =>
        item &&
        (item.approverId || item.name || item.approvalLevels) &&
        !Array.isArray(item?.user),
    );

    if (isFlatApproverShape) {
      return list.map((item: any, index: number): ApproverRow => {
        const name = item?.name?.trim?.() || "Unknown";
        const email = item?.email?.trim?.() || "-";
        const rawRole = item?.role?.name ?? item?.role;
        const role =
          typeof rawRole === "string" && rawRole.trim() ? rawRole.trim() : "N/A";
        const level = Array.isArray(item?.approvalLevels)
          ? item.approvalLevels.join(", ")
          : (item?.approvalLevel ?? item?.level ?? index + 1);
        const assignedApprovals =
          typeof item?.assignedApprovals === "string"
            ? item.assignedApprovals
            : `${item?.approvedCount ?? 0}/${item?.totalCount ?? 0}`;
        return {
          id: item?.approverId || item?._id || `approver-${index}`,
          name,
          email,
          role,
          approvalLevel: String(level),
          assignedApprovals,
          status: normalizeStatus(item?.status, assignedApprovals),
          raw: item,
        };
      });
    }

    const groups = list;
    const mapped = groups.flatMap((group: any, groupIndex: number) => {
      const users = Array.isArray(group?.user) ? group.user : [];
      const level =
        group?.levelName ??
        group?.level ??
        group?.approvalLevel ??
        group?.approvalLevels?.[0] ??
        groupIndex + 1;
      const assignedApprovals =
        typeof group?.assignedApprovals === "string"
          ? group.assignedApprovals
          : `${group?.completedApprovals ?? 0}/${group?.totalApprovals ?? 2}`;

      const mapUser = (user: any, userIndex: number): ApproverRow => {
        const name =
          user?.name?.trim() ||
          [user?.firstName, user?.lastName]
            .filter((v: unknown) => typeof v === "string" && v.trim())
            .join(" ")
            .trim() ||
          "Unknown";
        const email = user?.email?.trim() || "-";
        const role =
          user?.role?.name?.trim() ||
          user?.role?.trim?.() ||
          group?.groupName?.trim?.() ||
          "N/A";
        const status = normalizeStatus(group?.status, assignedApprovals);
        return {
          id: user?._id || `${groupIndex}-${userIndex}`,
          name,
          email,
          role,
          approvalLevel: String(level),
          assignedApprovals,
          status,
          raw: group,
        };
      };

      if (users.length === 0) {
        return [
          {
            id: `group-${groupIndex}`,
            name: group?.groupName || "Unknown",
            email: "-",
            role: group?.groupName || "N/A",
            approvalLevel: String(level),
            assignedApprovals,
            status: normalizeStatus(group?.status, assignedApprovals),
            raw: group,
          },
        ];
      }
      return users.map(mapUser);
    });

    return mapped;
  }, [data]);

  const columns = React.useMemo<ColumnDef<ApproverRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Approver Name",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm font-medium leading-5 text-[#2A4467]">
              {row.original.name}
            </p>
            {row.original.email !== "-" ? (
              <a
                href={`mailto:${row.original.email}`}
                className="text-sm text-[#3B82F6] underline"
              >
                {row.original.email}
              </a>
            ) : null}
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
          const status = getValue<ApproverRow["status"]>();
          return (
            <Badge
              variant="secondary"
              className={cn(
                "rounded-full border-none px-4 py-1 font-semibold",
                getStatusClass(status),
              )}
            >
              {status}
            </Badge>
          );
        },
      },
      {
        id: "view",
        header: "Status",
        cell: ({ row }) => (
          <ApproverDetailsSheet
            row={row.original}
            contractId={contractId}
            trigger={
              <button
                type="button"
                className="text-sm font-semibold text-[#43A047] underline-offset-2 hover:underline"
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
    <TabsContent value="approvers" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold leading-[36px] tracking-[-0.02em] text-[#0F0F0F] dark:text-slate-100">
          Approvers
        </h3>
        <Button
          variant="outline"
          className="h-10 rounded-xl border-[#E5E7EB] dark:border-slate-800 px-4 text-sm font-semibold text-[#0F0F0F] dark:text-slate-100"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <DataTable<ApproverRow>
        data={rows}
        columns={columns}
        header={() => (
          <div className="flex items-center justify-between w-full border-b border-[#E5E7EB] dark:border-slate-800 px-5 py-4">
            <span className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
              Approvers
            </span>
          </div>
        )}
        options={{
          disableSelection: true,
          disablePagination: true,
          isLoading: isLoading,
        }}
        classNames={{
          container: "border border-[#E5E7EB] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900",
          tHeader: "bg-[#F9FAFB] dark:bg-slate-800",
          tHeadRow: "border-b border-[#E5E7EB] dark:border-slate-800",
          tBody: "bg-white dark:bg-slate-900",
          tRow: "border-b border-[#E5E7EB] dark:border-slate-800",
          tHead: "px-6 py-3 text-sm font-semibold text-[#2A4467] dark:text-indigo-300",
          tCell: "px-6 py-4 text-sm text-[#2A4467] dark:text-slate-200 align-top",
        }}
        emptyPlaceholder={
          <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">
            No approvers found.
          </div>
        }
      />
    </TabsContent>
  );
};

export default Approvers;
