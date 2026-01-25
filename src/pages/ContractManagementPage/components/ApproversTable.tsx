import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
export type ApproverRow = {
  name: string;
  email: string;
  role: string;
  approvalLevel: string;
  assignedApprovals: string;
  status: "Completed" | "Pending";
};

const columns: ColumnDef<ApproverRow>[] = [
  {
    accessorKey: "name",
    header: "Approver Name",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-900">
          {row.original.name}
        </p>
        <a href="#" className="text-xs text-blue-600 underline">
          {row.original.email}
        </a>
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
    cell: () => (
      <a href="#" className="text-sm font-medium text-green-700 hover:underline">
        View
      </a>
    ),
  },
];

const sampleRows: ApproverRow[] = [
  {
    name: "Elise Johnson",
    email: "Mike@acme.com",
    role: "Engineer",
    approvalLevel: "5",
    assignedApprovals: "2/2",
    status: "Completed",
  },
  {
    name: "Elise Johnson",
    email: "Mike@acme.com",
    role: "Legal",
    approvalLevel: "4",
    assignedApprovals: "0/2",
    status: "Pending",
  },
  {
    name: "Elise Johnson",
    email: "Mike@acme.com",
    role: "Legal",
    approvalLevel: "4",
    assignedApprovals: "0/2",
    status: "Pending",
  },
  {
    name: "Elise Johnson",
    email: "Mike@acme.com",
    role: "Project Manager",
    approvalLevel: "3",
    assignedApprovals: "1/2",
    status: "Completed",
  },
  {
    name: "Elise Johnson",
    email: "Mike@acme.com",
    role: "Finance",
    approvalLevel: "2",
    assignedApprovals: "0/2",
    status: "Pending",
  },
  {
    name: "Elise Johnson",
    email: "Mike@acme.com",
    role: "Finance",
    approvalLevel: "1",
    assignedApprovals: "0/2",
    status: "Pending",
  },
];

const ApproversTable: React.FC = () => {
  return (
    <div className="space-y-4">
      <DataTable<ApproverRow>
        data={sampleRows}
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
          totalCounts: sampleRows.length,
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
      />
    </div>
  );
};

export default ApproversTable;

