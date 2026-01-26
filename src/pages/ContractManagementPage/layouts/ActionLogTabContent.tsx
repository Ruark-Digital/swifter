import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

const ActionLogTabContent: React.FC = () => {
  type ActionLogRow = {
    actionId: string;
    module: string;
    description: string;
    actorName: string;
    actorRole?: string;
    reference: string;
    dateLine1: string;
    dateLine2: string;
  };

  const rows: ActionLogRow[] = [
    {
      actionId: "ACT-2025-10",
      module: "Invoice",
      description: "Invoice INV-023 submitted",
      actorName: "Vendor",
      reference: "INV-2025-10",
      dateLine1: "12-05-2026,",
      dateLine2: "11:00 AM EST",
    },
    {
      actionId: "ACT-2025-10",
      module: "Claim",
      description: "Time claim approved (14 days)",
      actorName: "David Brown",
      actorRole: "Approver",
      reference: "CL-2025-10",
      dateLine1: "12-05-2026,",
      dateLine2: "11:00 AM EST",
    },
    {
      actionId: "ACT-2025-10",
      module: "Change",
      description: "Scope change rejected",
      actorName: "David Brown",
      actorRole: "Contract Manager",
      reference: "CH-2025-10",
      dateLine1: "12-05-2026,",
      dateLine2: "11:00 AM EST",
    },
  ];

  const columns: ColumnDef<ActionLogRow>[] = [
    {
      accessorKey: "actionId",
      header: "Action ID",
      cell: ({ getValue }) => (
        <span className="font-medium text-slate-700">{getValue<string>()}</span>
      ),
    },
    { accessorKey: "module", header: "Module" },
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
        <span className="font-medium text-slate-700">{getValue<string>()}</span>
      ),
    },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => (
        <div>
          <div>{row.original.dateLine1}</div>
          <div>{row.original.dateLine2}</div>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: () => (
        <div className="text-right">
          <button
            type="button"
            className="font-medium text-green-600 hover:underline"
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
            />
          </div>
        </div>

        <div className="p-0">
          <DataTable<ActionLogRow>
            data={rows}
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
              disablePagination: true,
              disableSelection: true,
              isLoading: false,
              totalCounts: rows.length,
            }}
          />
        </div>
      </Card>
    </TabsContent>
  );
};

export default ActionLogTabContent;

