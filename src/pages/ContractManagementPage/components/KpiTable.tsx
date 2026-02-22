import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/layouts/DataTable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { Forge, Forger, useForge } from "@/lib/forge";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { postRequest } from "@/lib/axiosInstance";
import { DropdownFilters } from "@/components/layouts/SolicitationFilters";

export type KpiRow = {
  kpiId: string;
  category: string;
  currentAvgScore: string;
  allTimeAvgScore: string;
  lastUpdated: string;
  actions: Array<"Update" | "View">;
};

type Props = {
  rows: KpiRow[];
  contractId: string;
};

/* columns moved inside KpiTable component to capture props safely */
const schema = yup.object().shape({
  value: yup.number().required("Value is required"),
  note: yup.string().optional(),
});

const KpiUpdateDialogForm: React.FC<{ contractId: string; kpiId: string }> = ({
  contractId,
  kpiId,
}) => {
  const { control } = useForge({
    resolver: yupResolver(schema) as any,
    // defaultValue: {},
  });

  const onSubmit = async (payload: any) => {
    await postRequest({
      url: `/contract/manager/contracts/${contractId}/kpis/${kpiId}`,
      payload,
    });
  };

  return (
    <Forge control={control} onSubmit={onSubmit}>
      <div className="space-y-4">
        <Forger name="value" type="number" component="input" />
        <Forger name="note" type="text" component="input" />
        <button
          type="submit"
          className="h-10 rounded-md bg-[#2A4467] px-4 text-white"
        >
          Submit
        </button>
      </div>
    </Forge>
  );
};

const KpiDetailSheet: React.FC<{ contractId: string; kpiId: string }> = ({
  contractId,
  kpiId,
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["contract-kpi-detail", kpiId],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/contracts/${contractId}/kpis/${kpiId}`,
      });
      return res.data?.data;
    },
    enabled: !!kpiId,
  });

  return (
    <SheetContent side="right" className="sm:max-w-[680px]">
      <SheetHeader>
        <SheetTitle>KPI Details</SheetTitle>
      </SheetHeader>
      <div className="mt-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            Loading...
          </div>
        ) : error ? (
          <div className="text-red-600 text-sm">Failed to load KPI</div>
        ) : data ? (
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-slate-900">{data.category}</div>
            <div className="text-slate-700">Target: {data.target ?? "N/A"}</div>
            <div className="text-slate-700">
              Non-Compliance: {data.nonCompliance ?? "N/A"}
            </div>
            <div className="text-slate-700">
              Current Avg: {data.currentAvgScore ?? "N/A"}
            </div>
            <div className="text-slate-700">
              All Time Avg: {data.allTimeAvgScore ?? "N/A"}
            </div>
          </div>
        ) : (
          <div className="text-slate-600 text-sm">No KPI data</div>
        )}
      </div>
    </SheetContent>
  );
};

const KpiTable: React.FC<Props> = ({ rows, contractId }) => {
  const [search, setSearch] = React.useState("");

  const columns: ColumnDef<KpiRow>[] = [
    {
      accessorKey: "kpiId",
      header: "KPI ID",
      cell: ({ getValue }) => (
        <div className="w-[100px] py-2 text-sm font-semibold text-[#374151]">
          {getValue<string>()}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ getValue }) => (
        <div className="w-[160px] overflow-hidden py-2 text-sm font-medium text-[#374151]">
          {getValue<string>()}
        </div>
      ),
    },
    {
      accessorKey: "currentAvgScore",
      header: () => (
        <div className="w-[160px] overflow-hidden">Current Avg. Score</div>
      ),
      cell: ({ getValue }) => (
        <div className="w-[160px] py-2 text-sm font-medium text-[#374151]">
          {getValue<string>()}
        </div>
      ),
    },
    {
      accessorKey: "allTimeAvgScore",
      header: () => (
        <div className="w-[160px] overflow-hidden">All Time Avg. Score</div>
      ),
      cell: ({ getValue }) => (
        <div className="w-[160px] py-2 text-sm font-medium text-[#374151]">
          {getValue<string>()}
        </div>
      ),
    },
    {
      accessorKey: "lastUpdated",
      header: () => <div className="w-[160px] overflow-hidden">Last Updated</div>,
      cell: ({ getValue }) => (
        <div className="w-[160px] py-2 text-sm font-medium text-[#374151]">
          {getValue<string>()}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="w-[80px]">Action</div>,
      cell: ({ row }) => {
        const actions = row.original.actions;
        return (
          <div className="flex w-[80px] items-center justify-center gap-[10px] py-2">
            {actions.includes("Update") && (
              <Dialog>
                <DialogTrigger asChild>
                  <a
                    href="#"
                    className="text-sm font-bold text-[#286EE0] underline"
                    onClick={(e) => e.preventDefault()}
                  >
                    Update
                  </a>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[520px]">
                  <DialogHeader>
                    <DialogTitle>Update KPI</DialogTitle>
                  </DialogHeader>
                  <KpiUpdateDialogForm
                    contractId={contractId}
                    kpiId={row.original.kpiId}
                  />
                </DialogContent>
              </Dialog>
            )}
            {actions.includes("View") && (
              <Sheet>
                <SheetTrigger asChild>
                  <a
                    href="#"
                    className="text-sm font-bold text-[#43A047] underline"
                    onClick={(e) => e.preventDefault()}
                  >
                    View
                  </a>
                </SheetTrigger>
                <KpiDetailSheet
                  contractId={contractId}
                  kpiId={row.original.kpiId}
                />
              </Sheet>
            )}
          </div>
        );
      },
    },
  ];

  const filteredRows = React.useMemo(() => {
    if (!search) return rows;
    const query = search.toLowerCase();
    return rows.filter((row) =>
      [
        row.kpiId,
        row.category,
        row.currentAvgScore,
        row.allTimeAvgScore,
        row.lastUpdated,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [search, rows]);

  return (
    <div className="relative flex flex-col gap-8">
      <div className="flex flex-col rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E9E9EB] px-6 py-6">
          <div className="flex items-center gap-6">
            <div className="text-base font-semibold text-[#0F0F0F]">KPI</div>
            <div className="relative w-[300px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#6B6B6B]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="h-12 w-[300px] rounded-lg border border-[#E5E7EB] pl-9 text-sm text-[#0F0F0F] placeholder:text-[#6B6B6B]"
              />
            </div>
          </div>

          <DropdownFilters
            filters={[
              {
                title: "Date",
                options: [
                  {
                    hasOptions: true,
                    value: "date",
                    label: "Date Published",
                    subOptions: [
                      {
                        title: "All",
                        value: "all",
                      },
                      {
                        title: "Today",
                        value: "today",
                      },
                      {
                        title: "Last 7 Days",
                        value: "7_days",
                      },
                      {
                        title: "Last 30 Days",
                        value: "30_days",
                      },
                      {
                        title: "Custom",
                        value: "custom",
                      },
                    ],
                  },
                ],
              },
              // {
              //   title: "Status",
              //   showIcon: true,
              //   options: statusOptions,
              // },
            ]}
            onFilterChange={() => {}}
          />
        </div>

        <DataTable<KpiRow>
          data={filteredRows}
          columns={columns}
          options={{
            disableSelection: true,
            disablePagination: true,
            manualPagination: false,
            totalCounts: filteredRows.length,
            setPagination: () => {},
            pagination: { pageIndex: 0, pageSize: 10 },
          }}
          classNames={{
            container: "[&>div:last-child]:hidden",
            table: "border-spacing-y-0",
            tHeader: "bg-[#F9FAFB]",
            tHeadRow: "border-b border-[#E5E7EB]",
            tBody: "bg-white",
            tRow: "border-b border-[#E5E7EB]",
            tHead: "px-6 py-3 text-sm font-semibold text-[#2A4467]",
            tCell: "px-6 py-4 text-sm text-slate-700 align-top",
          }}
        />
      </div>
    </div>
  );
};

export default KpiTable;
