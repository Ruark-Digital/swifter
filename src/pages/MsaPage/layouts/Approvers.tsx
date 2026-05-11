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
  status: "Completed" | "Pending";
  raw: any;
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

const normalizeStatus = (
  value?: string,
  assignedApprovals?: string,
): "Completed" | "Pending" => {
  const normalized = value?.toLowerCase();
  if (normalized === "completed" || normalized === "approved")
    return "Completed";
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

const getStatusClass = (status: "Completed" | "Pending") =>
  status === "Completed"
    ? "bg-[#EAF2FF] text-[#2563EB]"
    : "bg-[#FFF8E0] text-[#E8AE00]";

const ApproverDetailsSheet = ({
  trigger,
  row,
}: {
  trigger: React.ReactNode;
  row: ApproverRow;
}) => {
  const createdAt = row.raw?.createdAt || row.raw?.updatedAt;
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
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <SheetTitle className="text-base font-semibold text-[#0F0F0F]">
                  Approver
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
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                  getStatusClass(row.status),
                )}
              >
                {row.status}
              </span>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <LabelRow label="Approver Name" value={row.name || "N/A"} />
              <LabelRow
                label="Contact"
                value={
                  row.email !== "-" ? (
                    <a
                      className="text-[#2563EB] underline"
                      href={`mailto:${row.email}`}
                    >
                      {row.email}
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
                value={row.assignedApprovals || "-"}
              />
              <LabelRow
                label="Last Updated"
                value={
                  createdAt ? formatDateTZ(createdAt, "MMMM dd, yyyy") : "N/A"
                }
              />
            </div>
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
      return `/contract/vendor/msa-contract/${contractId}`;
    if (isApprover) return `/contract/approver/msa-contract/${contractId}`;
    if (isViewOnly) return `/contract/user/msa-contract/${contractId}`;
    if (isManager) return `/contract/manager/msa-contract/${contractId}`;
    return `/contract/manager/msa-contract/${contractId}`;
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
    const groups = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.approvers)
        ? payload.approvers
        : Array.isArray(payload?.data?.approvers)
          ? payload.data.approvers
          : [];

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
    [],
  );

  return (
    <TabsContent value="approvers" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold leading-[36px] tracking-[-0.02em] text-[#0F0F0F]">
          Approvers
        </h3>
        <Button
          variant="outline"
          className="h-12 rounded-xl border-[#E5E7EB] px-5 text-base font-semibold text-[#0F0F0F]"
        >
          <Share2 className="mr-2 h-5 w-5" />
          Export Report
        </Button>
      </div>

      <DataTable<ApproverRow>
        data={rows}
        columns={columns}
        header={() => (
          <div className="flex items-center justify-between w-full border-b border-[#E5E7EB] px-5 py-4">
            <span className="text-base font-semibold text-[#0F0F0F]">
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
          container: "border border-[#E5E7EB] rounded-xl bg-white",
          tHeader: "bg-[#F9FAFB]",
          tHeadRow: "border-b border-[#E5E7EB]",
          tBody: "bg-white",
          tRow: "border-b border-[#E5E7EB]",
          tHead: "px-6 py-3 text-sm font-semibold text-[#2A4467]",
          tCell: "px-6 py-4 text-sm text-[#2A4467] align-top",
        }}
        emptyPlaceholder={
          <div className="px-6 py-8 text-sm text-slate-500">
            No approvers found.
          </div>
        }
      />
    </TabsContent>
  );
};

export default Approvers;
