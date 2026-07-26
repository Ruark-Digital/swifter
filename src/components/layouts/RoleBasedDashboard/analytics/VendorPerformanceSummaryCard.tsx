import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/layouts/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { TopNFilter } from "./TopNFilter";
import { AnalyticsEmptyState } from "./AnalyticsEmptyState";

type VendorRow = {
  vendor: string;
  contracts: number;
  risk: number;
  claims: number;
  changeOrders: number;
  performance: "warn" | "ok" | "good";
};

const columns: ColumnDef<VendorRow>[] = [
  { accessorKey: "vendor", header: "Vendor", cell: ({ row }) => <span className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">{row.original.vendor}</span> },
  { accessorKey: "contracts", header: "Contracts", cell: ({ row }) => <span className="text-sm text-[#0F0F0F] dark:text-slate-100">{row.original.contracts}</span> },
  {
    accessorKey: "risk",
    header: "Risk Score",
    cell: ({ row }) => (
      <span
        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
        style={{
          backgroundColor:
            row.original.risk >= 60 ? "#FEE2E2" : row.original.risk >= 45 ? "#FEF3C7" : "#D1FAE5",
          color:
            row.original.risk >= 60 ? "#DC2626" : row.original.risk >= 45 ? "#92400E" : "#065F46",
        }}
      >
        {row.original.risk}
      </span>
    ),
  },
  {
    accessorKey: "claims",
    header: "Claims",
    cell: ({ row }) => (
      <span
        className="text-sm font-semibold"
        style={{ color: row.original.claims > 0 ? "#DC2626" : "#0F0F0F" }}
      >
        {row.original.claims}
      </span>
    ),
  },
  { accessorKey: "changeOrders", header: "Change Orders", cell: ({ row }) => <span className="text-sm text-[#0F0F0F] dark:text-slate-100">{row.original.changeOrders}</span> },
  {
    accessorKey: "performance",
    header: "Performance",
    cell: ({ row }) => {
      const p = row.original.performance;
      const color = p === "warn" ? "#DC2626" : p === "ok" ? "#F59E0B" : "#10B981";
      return <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: color }} />;
    },
  },
];

type Props = {
  data?: {
    rows?: Array<{
      vendor?: string;
      contracts?: number;
      riskScore?: number;
      claims?: number;
      changeOrders?: number;
      performance?: string;
    }>;
  };
  selectedRange?: string;
  onRangeChange?: (value: string) => void;
  selectedTop?: number;
  onTopChange?: (value: number) => void;
};

export const VendorPerformanceSummaryCard: React.FC<Props> = ({
  data,
  selectedRange = "ytd",
  onRangeChange,
  selectedTop = 10,
  onTopChange,
}) => {
  const allRows: VendorRow[] = Array.isArray(data?.rows)
    ? data.rows.map((r) => {
        const performanceRaw = (r.performance ?? "").toLowerCase();
        const performance: VendorRow["performance"] =
          performanceRaw === "critical" || performanceRaw === "warn"
            ? "warn"
            : performanceRaw === "ok"
              ? "ok"
              : "good";

        return {
          vendor: r.vendor ?? "Unknown",
          contracts: r.contracts ?? 0,
          risk: r.riskScore ?? 0,
          claims: r.claims ?? 0,
          changeOrders: r.changeOrders ?? 0,
          performance,
        };
      })
    : [];
  const rows = allRows.slice(0, selectedTop);
  return (
    <Card className="rounded-2xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm flex flex-col max-h-[32rem]">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[16px] font-semibold text-[#030712] dark:text-slate-100">Vendor Performance Summary</CardTitle>
          <TopNFilter value={selectedTop} onChange={onTopChange} />
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1 min-h-0 overflow-y-auto">
        <Tabs
          value={selectedRange}
          onValueChange={(value) => onRangeChange?.(value)}
          className="w-full mb-3"
        >
          {/* Horizontal scroll on overflow; `!flex-none shrink-0` defeats
              shadcn TabsTrigger's baked-in `flex-1` so pills don't stretch. */}
          <TabsList className="bg-transparent p-0 gap-2 flex overflow-x-auto h-auto w-full justify-start">
            <TabsTrigger
              className="!flex-none shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-[#667085] dark:text-slate-400 data-[state=active]:bg-[#F0F0F0] data-[state=active]:text-[#2A4467] data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100"
              value="ytd"
            >
              YTD
            </TabsTrigger>
            {["12 months", "6 months", "3 months"].map((t) => (
              <TabsTrigger
                key={t}
                value={t.replace(/\s+/g, "")}
                className="!flex-none shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-[#667085] dark:text-slate-400 data-[state=active]:bg-[#F0F0F0] data-[state=active]:text-[#2A4467] data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100"
              >
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {rows.length === 0 ? (
          <AnalyticsEmptyState
            icon={Users}
            title="No vendor performance data yet"
            description="Risk scores, claims and change orders per vendor will appear here once contracts are awarded."
          />
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            options={{ disablePagination: true, disableSelection: true, isLoading: false, totalCounts: rows.length, manualPagination: false }}
            classNames={{
              tHeader: "rounded-xl",
              tHead: "text-xs text-[#6B6B6B] dark:text-slate-400 font-medium",
              tRow: "rounded-xl dark:border-slate-800",
              tCell: "text-sm",
              table: "w-full",
              container: "w-full",
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

