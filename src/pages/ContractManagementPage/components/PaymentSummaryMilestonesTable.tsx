import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export type PaymentMilestoneRow = {
  milestoneId: string;
  milestoneTitle: string;
  deliverable: string;
  amount: string;
  dueDate: string;
};

type PaymentSummaryTableProps<T> = {
  title?: string;
  rows?: T[];
  columns?: ColumnDef<T>[];
  searchPlaceholder?: string;
  getRowSearchValues?: (row: T) => Array<string | number | null | undefined>;
};

const milestoneColumns: ColumnDef<PaymentMilestoneRow>[] = [
  {
    accessorKey: "milestoneId",
    header: "Milestone ID",
    cell: ({ getValue }) => (
      <div className="w-[100px] py-2 text-sm font-semibold text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "milestoneTitle",
    header: "Milestone Title",
    cell: ({ getValue }) => (
      <div className="w-[160px] py-2 text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "deliverable",
    header: "Deliverable",
    cell: ({ getValue }) => (
      <div className="w-[160px] py-2 text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: () => <div className="w-[80px] text-center">Amount</div>,
    cell: ({ getValue }) => (
      <div className="w-[80px] py-2 text-center text-sm font-semibold text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "dueDate",
    header: () => <div className="w-[120px] text-center">Due Date</div>,
    cell: ({ getValue }) => (
      <div className="w-[120px] py-2 text-center text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
];

const milestoneRows: PaymentMilestoneRow[] = [
  {
    milestoneId: "MIL-2025-10",
    milestoneTitle: "Additional structural reinforcement",
    deliverable: "Additional structural reinforcement",
    amount: "$2.5M",
    dueDate: "12-65-2025",
  },
  {
    milestoneId: "MIL-2025-10",
    milestoneTitle: "Additional structural reinforcement",
    deliverable: "Additional structural reinforcement",
    amount: "$2.5M",
    dueDate: "12-65-2025",
  },
  {
    milestoneId: "MIL-2025-10",
    milestoneTitle: "Additional structural reinforcement",
    deliverable: "Additional structural reinforcement",
    amount: "$2.5M",
    dueDate: "12-65-2025",
  },
  {
    milestoneId: "MIL-2025-10",
    milestoneTitle: "Additional structural reinforcement",
    deliverable: "Additional structural reinforcement",
    amount: "$2.5M",
    dueDate: "12-65-2025",
  },
];

const PaymentSummaryMilestonesTable = <
  T extends Record<string, unknown> = PaymentMilestoneRow,
>({
  title = "Milestones",
  rows,
  columns,
  searchPlaceholder = "Search",
  getRowSearchValues,
}: PaymentSummaryTableProps<T>) => {
  const [search, setSearch] = React.useState("");

  const filteredRows = React.useMemo(() => {
    const resolvedRows = (rows ?? (milestoneRows as unknown as T[])) ?? [];
    if (!search) return resolvedRows;
    const query = search.toLowerCase();
    const getValues =
      getRowSearchValues ??
      ((row: T) =>
        Object.values(row).map((value) =>
          value === null || value === undefined ? "" : String(value),
        ));

    return resolvedRows.filter((row) =>
      getValues(row).some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [getRowSearchValues, rows, search]);

  const resolvedColumns =
    (columns ?? (milestoneColumns as unknown as ColumnDef<T>[])) ?? [];

  return (
    <DataTable<T>
      header={() => (
        <div className="flex items-center gap-6 border-b w-full border-[#E9E9EB] px-4 pb-3">
          <div className="text-base font-semibold text-[#0F0F0F]">
            {title}
          </div>
          <div className="relative w-[300px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#6B6B6B]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-12 w-[300px] rounded-lg border border-[#E5E7EB] pl-9 text-sm text-[#0F0F0F] placeholder:text-[#6B6B6B]"
            />
          </div>
        </div>
      )}
      data={filteredRows}
      columns={resolvedColumns}
      options={{
        disableSelection: true,
        disablePagination: true,
        manualPagination: false,
        totalCounts: filteredRows.length,
        setPagination: () => {},
        pagination: { pageIndex: 0, pageSize: 10 },
      }}
      classNames={{
        container:
          "bg-white dark:bg-slate-950 rounded-xl px- border border-gray-300 dark:border-slate-600",
        expandedCell: "px-5",
        tHeadRow: "bg-[#F9FAFB]"
      }}
    />
  );
};

export default PaymentSummaryMilestonesTable;
