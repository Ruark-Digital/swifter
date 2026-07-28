import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Search } from "lucide-react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import * as XLSX from "xlsx";
import { formatDateTZ } from "@/lib/utils";

type Props = { contractId: string; isActive?: boolean };

type ActionLogRow = {
  actionId: string;
  module: string;
  description: string;
  actorName: string;
  actorRole?: string;
  reference: string;
  dateLine1: string;
  dateLine2: string;
  rawDate: Date;
};

const LabelRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-1 py-2">
    <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
    <div className="text-sm text-slate-900 dark:text-slate-100">{value}</div>
  </div>
);

// MSA action logs don't yet have a separate detail endpoint documented
// (`/manager/msa-contracts/{contractId}/logs/{logId}` has no response
// schema) — the list row already carries every field the Contract-side
// detail sheet shows, so this renders that data directly instead of
// making a second, unverified network call.
const ActionLogDetailSheet = ({
  action,
  onClose,
}: {
  action: ActionLogRow | null;
  onClose: () => void;
}) => (
  <Sheet open={!!action} onOpenChange={(open) => !open && onClose()}>
    <SheetContent side="right" className="sm:max-w-md">
      <SheetHeader>
        <SheetTitle>Action Log Details</SheetTitle>
      </SheetHeader>
      {action && (
        <div className="mt-4">
          <LabelRow label="Action ID" value={action.actionId} />
          <LabelRow label="Module" value={action.module} />
          <LabelRow label="Description" value={action.description} />
          <LabelRow
            label="User / Actor"
            value={
              action.actorRole
                ? `${action.actorName} (${action.actorRole})`
                : action.actorName
            }
          />
          <LabelRow label="Reference" value={action.reference} />
          <LabelRow label="Date" value={`${action.dateLine1} ${action.dateLine2}`} />
        </div>
      )}
    </SheetContent>
  </Sheet>
);

const ActionLogTabContent: React.FC<Props> = ({ contractId, isActive }) => {
  const [selectedAction, setSelectedAction] = React.useState<ActionLogRow | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const listQuery = React.useMemo(() => {
    const query = searchQuery.trim();
    const isLogIdQuery = /^ACT-\d+/i.test(query);
    return {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      logId: query && isLogIdQuery ? query : undefined,
      module: query && !isLogIdQuery ? query : undefined,
    };
  }, [pagination, searchQuery]);

  const queryKey = useUserQueryKey(["msa-contract-logs", contractId, listQuery]);

  const { data: logsData, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/msa-contracts/${contractId}/logs`,
        config: { params: listQuery },
      });
      return res.data as {
        data?: { logs?: any[]; total?: number };
      };
    },
    enabled: !!contractId && !!isActive,
    staleTime: 30_000,
  });

  const rows = React.useMemo<ActionLogRow[]>(() => {
    if (!logsData?.data?.logs) return [];
    return logsData.data.logs
      .map((log: any) => {
        const sourceDate = log.date ?? new Date().toISOString();
        const date = new Date(sourceDate);
        let refStr = "Unknown";
        if (log.reference) {
          if (typeof log.reference === "string") {
            refStr = log.reference;
          } else if (typeof log.reference === "object") {
            refStr =
              log.reference.changeId ||
              log.reference.reportId ||
              log.reference.ncrId ||
              log.reference.rfiId ||
              log.reference.claimId ||
              log.reference._id ||
              "Unknown";
          }
        }
        let modStr = "Unknown";
        if (typeof log.module === "string") modStr = log.module;
        else if (typeof log.module === "object" && log.module !== null) {
          modStr = (Object.values(log.module)[0] as string) || "Unknown";
        }
        let userName = "Unknown User";
        if (typeof log.user === "string") userName = log.user;
        else if (log.user?.name) userName = log.user.name;
        let roleName: string | undefined;
        if (typeof log.actor === "string") roleName = log.actor;
        else if (log.actor?.name) roleName = log.actor.name;

        return {
          actionId: log.logId || log.actionId || log._id || "Unknown",
          module: modStr,
          description: log.description || "No description",
          actorName: userName,
          actorRole: roleName,
          reference: refStr,
          dateLine1: formatDateTZ(sourceDate, "dd MMM yyyy"),
          dateLine2: formatDateTZ(sourceDate, "hh:mm a"),
          rawDate: date,
        };
      })
      .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
  }, [logsData]);

  const totalCount = logsData?.data?.total ?? rows.length;

  const handleExport = React.useCallback(() => {
    if (!rows.length) return;
    const exportRows = rows.map((row) => ({
      "Action ID": row.actionId,
      Module: row.module.replace(/([a-z])([A-Z])/g, "$1 $2"),
      Description: row.description,
      User: row.actorName,
      Role: row.actorRole ?? "",
      Reference: row.reference,
      Date: row.dateLine1,
      Time: row.dateLine2,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Action Log");
    XLSX.writeFile(
      workbook,
      `msa-action-log-${contractId}-${format(new Date(), "yyyy-MM-dd")}.xlsx`,
    );
  }, [contractId, rows]);

  const columns: ColumnDef<ActionLogRow>[] = [
    {
      accessorKey: "actionId",
      header: "Action ID",
      cell: ({ getValue }) => (
        <span
          className="font-medium text-slate-700 dark:text-slate-300 truncate block max-w-[100px]"
          title={getValue<string>()}
        >
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: "module",
      header: "Module",
      cell: ({ getValue }) => (
        <span className="capitalize">
          {getValue<string>().replace(/([a-z])([A-Z])/g, "$1 $2")}
        </span>
      ),
    },
    { accessorKey: "description", header: "Description" },
    {
      accessorKey: "actorName",
      header: "User / Actor",
      cell: ({ row }) =>
        row.original.actorRole ? (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.actorName}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {row.original.actorRole}
            </span>
          </div>
        ) : (
          <span>{row.original.actorName}</span>
        ),
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ getValue }) => (
        <span
          className="font-medium text-slate-700 dark:text-slate-300 truncate block max-w-[120px]"
          title={getValue<string>()}
        >
          {getValue<string>()}
        </span>
      ),
    },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <div>{row.original.dateLine1}</div>
          <div>{row.original.dateLine2}</div>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <button
            type="button"
            className="font-medium text-green-600 hover:underline"
            onClick={() => setSelectedAction(row.original)}
          >
            View
          </button>
        </div>
      ),
    },
  ];

  return (
    <TabsContent value="action-log" className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Action Log</h2>

      <Card className="overflow-hidden rounded-xl">
        <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Action Log</div>
          <div className="relative w-full max-w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Search log"
              className="h-10 pl-9 text-sm placeholder:text-slate-400 dark:text-slate-500"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            />
          </div>
          <div className="ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!rows.length}
              data-testid="msa-action-log-export"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="p-0">
          <DataTable<ActionLogRow>
            data={rows}
            columns={columns}
            classNames={{
              table: "border-collapse border-spacing-0",
              tHeader: "bg-transparent",
              tHeadRow: "bg-slate-50/50 hover:bg-slate-50/50 dark:bg-slate-800/50",
              tHead: "text-[#2A4467] dark:text-blue-300 font-medium",
              tCell: "p-4 text-slate-700 dark:text-slate-300",
            }}
            options={{
              disablePagination: false,
              disableSelection: true,
              isLoading,
              totalCounts: totalCount,
              pagination,
              setPagination,
            }}
          />
        </div>
      </Card>

      <ActionLogDetailSheet action={selectedAction} onClose={() => setSelectedAction(null)} />
    </TabsContent>
  );
};

export default ActionLogTabContent;
