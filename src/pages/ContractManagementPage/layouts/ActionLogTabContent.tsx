import React, { useMemo, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import type { PaginationState } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { contractManagerApi, LogModule } from "../api/contractManagerApi";
import { format } from "date-fns";
import ActionLogDetailsSheet from "../components/ActionLogDetailsSheet";
import { useUserRole } from "@/hooks/useUserRole";

type Props = { isActive?: boolean };

type ActionLogRow = {
  actionId: string;
  module: LogModule['stripe out contract'];
  description: string;
  actorName: string;
  actorRole?: string;
  reference: string;
  dateLine1: string;
  dateLine2: string;
  rawDate: Date; // For sorting
  rawReference?: any;
};

const ActionLogTabContent: React.FC<Props> = () => {
  const { id: contractId } = useParams<{ id: string }>();
  const [selectedAction, setSelectedAction] = useState<ActionLogRow | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const { isManager, isProcurement } = useUserRole()

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

  // 1. Fetch action logs
  const { data: logsData, isLoading } = useQuery({
    queryKey: ["contractLogs", contractId, listQuery],
    queryFn: () => contractManagerApi.listLogs(contractId!, listQuery),
    enabled: !!contractId && (isManager || isProcurement),
  });

  const rows = useMemo(() => {
    if (!logsData?.data?.logs) return [];

    return logsData.data.logs.map((log: any) => {
      const date = log.date ? new Date(log.date) : new Date();
      let refStr = "Unknown";
      if (log.reference) {
        if (typeof log.reference === "string") {
          refStr = log.reference;
        } else if (typeof log.reference === "object") {
          refStr = log.reference.changeId || log.reference.reportId || log.reference.ncrId || log.reference.rfiId || log.reference.claimId || log.reference._id || "Unknown";
        }
      }
      let modStr = "Unknown";
      if (typeof log.module === "string") {
        modStr = log.module;
      } else if (typeof log.module === "object" && log.module !== null) {
        modStr = (Object.values(log.module)[0] as string) || "Unknown";
      }

      let userName = "Unknown User";
      if (typeof log.user === "string") userName = log.user;
      else if (log.user?.name) userName = log.user.name;

      let roleName = "Unknown Role";
      if (typeof log.actor === "string") roleName = log.actor;
      else if (log.actor?.name) roleName = log.actor.name;

      return {
        actionId: log.logId || log.actionId || log._id || "Unknown",
        id: log._id || "Unknown",
        module: modStr,
        description: log.description || "No description",
        actorName: userName,
        actorRole: roleName,
        reference: refStr,
        dateLine1: format(date, "dd MMM yyyy"),
        dateLine2: format(date, "hh:mm a"),
        rawDate: date,
        rawReference: log.reference,
      };
    }).sort((a: any, b: any) => b.rawDate.getTime() - a.rawDate.getTime());
  }, [logsData]);

  const totalCount = logsData?.data?.total ?? rows.length;

  const columns: ColumnDef<ActionLogRow>[] = [
    {
      accessorKey: "actionId",
      header: "Action ID",
      cell: ({ getValue }) => (
        <span className="font-medium text-slate-700 dark:text-slate-300 truncate block max-w-[100px]" title={getValue<string>()}>
          {getValue<string>()}
        </span>
      ),
    },
    { 
        accessorKey: "module", 
        header: "Module",
        cell: ({ getValue }) => (
            <span className="capitalize">{getValue<string>()}</span>
        )
    },
    { accessorKey: "description", header: "Description" },
    {
      accessorKey: "actorName",
      header: "User / Actor",
      cell: ({ row }) => {
        if (!row.original.actorRole) return <span>{row.original.actorName}</span>;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.actorName}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{row.original.actorRole}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ getValue }) => (
        <span className="font-medium text-slate-700 dark:text-slate-300 truncate block max-w-[120px]" title={getValue<string>()}>
          {getValue<string>()}
        </span>
      ),
    },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
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
            onClick={() => {
                setSelectedAction(row.original);
                setIsSheetOpen(true);
            }}
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
        <div className="flex items-center gap-6 border-b border-slate-200 px-6 py-4">
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
        </div>

        <div className="p-0">
          <DataTable<ActionLogRow>
            data={rows}
            columns={columns}
            classNames={{
              table: "border-collapse border-spacing-0",
              tHeader: "bg-transparent",
              tHeadRow: "bg-slate-50/50 hover:bg-slate-50/50",
              tHead: "text-[#2A4467] dark:text-blue-300 font-medium",
              tCell: "p-4 text-slate-700 dark:text-slate-300",
            }}
            options={{
              disablePagination: false,
              disableSelection: true,
              isLoading: isLoading,
              totalCounts: totalCount,
              pagination,
              setPagination: setPagination,
            }}
          />
        </div>
      </Card>

      <ActionLogDetailsSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        action={selectedAction}
      />
    </TabsContent>
  );
};

export default ActionLogTabContent;
