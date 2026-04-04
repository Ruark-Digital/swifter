import React, { useMemo, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
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
};

const ActionLogTabContent: React.FC<Props> = () => {
  const { id: contractId } = useParams<{ id: string }>();
  const [selectedAction, setSelectedAction] = useState<ActionLogRow | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isManager, isProcurement } = useUserRole()

  // 1. Fetch action logs
  const { data: logsData, isLoading } = useQuery({
    queryKey: ["contractLogs", contractId],
    queryFn: () => contractManagerApi.listLogs(contractId!, { limit: 100 }), // Fetch more items
    enabled: !!contractId && (isManager || isProcurement),
  });

  const rows = useMemo(() => {
    if (!logsData?.data?.logs) return [];

    return logsData.data.logs.map((log) => {
      const date = log.date ? new Date(log.date) : new Date();
      return {
        actionId: log.actionId || "Unknown",
        module: log.module?.["stripe out contract"] || "Unknown",
        description: "No description",
        actorName: log.user || "Unknown User",
        actorRole: log.actor || "Unknown Role",
        reference: log.reference || "Unknown",
        dateLine1: format(date, "MM-dd-yyyy"),
        dateLine2: format(date, "hh:mm a"),
        rawDate: date,
      };
    }).sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
  }, [logsData]);

  const filteredRows = useMemo(() => {
    if (!searchQuery) return rows;
    const lowerQuery = searchQuery.toLowerCase();
    return rows.filter(
      (row) =>
        row.description.toLowerCase().includes(lowerQuery) ||
        row.module.toLowerCase().includes(lowerQuery) ||
        row.actorName.toLowerCase().includes(lowerQuery) ||
        row.reference.toLowerCase().includes(lowerQuery)
    );
  }, [rows, searchQuery]);

  const columns: ColumnDef<ActionLogRow>[] = [
    {
      accessorKey: "actionId",
      header: "Action ID",
      cell: ({ getValue }) => (
        <span className="font-medium text-slate-700 truncate block max-w-[100px]" title={getValue<string>()}>
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
            <span className="text-xs text-slate-400">{row.original.actorRole}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ getValue }) => (
        <span className="font-medium text-slate-700 truncate block max-w-[120px]" title={getValue<string>()}>
          {getValue<string>()}
        </span>
      ),
    },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className="text-xs text-slate-500">
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
      <h2 className="text-lg font-semibold text-slate-900">Action Log</h2>

      <Card className="overflow-hidden rounded-xl">
        <div className="flex items-center gap-6 border-b border-slate-200 px-6 py-4">
          <div className="text-sm font-medium text-slate-900">Action Log</div>

          <div className="relative w-full max-w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search log"
              className="h-10 pl-9 text-sm placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="p-0">
          <DataTable<ActionLogRow>
            data={filteredRows}
            columns={columns}
            classNames={{
              container: "[&>div:last-child]:hidden",
              table: "border-collapse border-spacing-0",
              tHeader: "bg-transparent",
              tHeadRow: "bg-slate-50/50 hover:bg-slate-50/50",
              tHead: "text-[#2A4467] font-medium",
              tCell: "p-4 text-slate-700",
            }}
            options={{
              disablePagination: false, // Enabled pagination as list might grow
              disableSelection: true,
              isLoading: isLoading,
              totalCounts: filteredRows.length,
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
