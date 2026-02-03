import { SEOWrapper } from "@/components/SEO";
import { DataTable } from "@/components/layouts/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  businessDivisionApi,
  type BusinessDivision,
} from "./api/businessDivisionApi";
import CreateDivisionDialog from "./components/CreateDivisionDialog";
import BusinessDivisionDetailsSheet from "./components/BusinessDivisionDetailsSheet";
import { Search } from "lucide-react";

const formatCompactCurrency = (value?: number) => {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(num);
};

const BusinessDivisionsPage = () => {
  const { isCompanyAdmin } = useUserRole();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(
    null
  );

  if (!isCompanyAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: statsRes } = useQuery({
    queryKey: ["businessDivisions", "stats"],
    queryFn: async () => await businessDivisionApi.getDivisionStats(),
    enabled: isCompanyAdmin,
  });

  const { data: listRes, isLoading: isListLoading } = useQuery({
    queryKey: [
      "businessDivisions",
      "list",
      pagination.pageIndex,
      pagination.pageSize,
      searchQuery,
    ],
    queryFn: async () =>
      await businessDivisionApi.listDivisions({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: searchQuery || undefined,
      }),
    enabled: isCompanyAdmin,
  });

  const totalDivisions = statsRes?.data?.totalDivisions ?? 0;
  const divisions = listRes?.data?.docs ?? [];
  const totalDocs = listRes?.data?.totalDocs ?? divisions.length;
  const hasDivisions = totalDivisions > 0 || divisions.length > 0;

  const handleExport = () => {
    const header = [
      "Name",
      "Location",
      "Total Projects",
      "Total Contracts",
      "Total Project Value",
      "Total Contract Value",
    ];

    const escapeCell = (value: unknown) => {
      const cell = String(value ?? "");
      if (/[",\n]/.test(cell)) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    };

    const rows = divisions.map((d) => [
      d.name,
      d.location,
      d.totalProjects ?? 0,
      d.totalContracts ?? 0,
      d.totalProjectValue ?? 0,
      d.totalContractValue ?? 0,
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map(escapeCell).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "business-divisions.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  const openDetails = useCallback((divisionId: string) => {
    setSelectedDivisionId(divisionId);
    setDetailsOpen(true);
  }, []);

  const columns: ColumnDef<BusinessDivision>[] = useMemo(
    () => [
      {
        header: () => (
          <div className="w-[180px] py-2 text-sm font-semibold text-[#2A4467] font-quicksand">
            Division Name
          </div>
        ),
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="w-[180px] py-2 font-quicksand">
            <p className="text-sm font-semibold text-[#374151]">
              {row.original?.name ?? ""}
            </p>
            <p className="text-xs text-[#6B6B6B]">{row.original?._id ?? ""}</p>
          </div>
        ),
      },
      {
        header: () => (
          <div className="w-[100px] py-2 text-center text-sm font-semibold text-[#2A4467] font-quicksand">
            Total Contracts
          </div>
        ),
        accessorKey: "totalContracts",
        cell: ({ getValue }) => (
          <div className="w-[100px] py-2 text-center text-sm font-bold text-[#374151] font-quicksand">
            {Number(getValue() ?? 0)}
          </div>
        ),
      },
      {
        header: () => (
          <div className="w-[100px] py-2 text-center text-sm font-semibold text-[#2A4467] font-quicksand">
            Total Contract Value
          </div>
        ),
        accessorKey: "totalContractValue",
        cell: ({ row }) => (
          <div className="w-[100px] py-2 text-center text-sm font-bold text-[#374151] font-quicksand">
            {formatCompactCurrency(row.original?.totalContractValue)}
          </div>
        ),
      },
      {
        header: () => (
          <div className="w-[100px] py-2 text-center text-sm font-semibold text-[#2A4467] font-quicksand">
            Total Projects
          </div>
        ),
        accessorKey: "totalProjects",
        cell: ({ getValue }) => (
          <div className="w-[100px] py-2 text-center text-sm font-bold text-[#374151] font-quicksand">
            {Number(getValue() ?? 0)}
          </div>
        ),
      },
      {
        header: () => (
          <div className="w-[100px] py-2 text-center text-sm font-semibold text-[#2A4467] font-quicksand">
            Total Project Value
          </div>
        ),
        accessorKey: "totalProjectValue",
        cell: ({ row }) => (
          <div className="w-[100px] py-2 text-center text-sm font-bold text-[#374151] font-quicksand">
            {formatCompactCurrency(row.original?.totalProjectValue)}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => (
          <div className="w-[80px] py-2 text-center text-sm font-semibold text-[#2A4467] font-quicksand">
            Actions
          </div>
        ),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => openDetails(row.original._id)}
            className="w-[80px] py-2 text-center text-sm font-bold text-[#43A047] underline font-quicksand"
          >
            View
          </button>
        ),
      },
    ],
    [openDetails],
  );

  return (
    <>
      <SEOWrapper
        title="Business Divisions - SwiftPro eProcurement Portal"
        description="Manage your organization’s business divisions in the SwiftPro eProcurement Portal."
        keywords="business divisions, divisions, SwiftPro, eProcurement"
        canonical="/dashboard/business-divisions"
        robots="noindex, nofollow"
      />
      <div className="flex flex-1 flex-col px-8 py-12">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#0F0F0F] font-quicksand">
              Business Divisions
            </h2>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="gap-2 rounded-xl border-[#E5E7EB] bg-white px-4 text-base font-semibold text-[#6B6B6B] font-quicksand"
                onClick={handleExport}
                disabled={divisions.length === 0}
              >
                <img
                  src="/assets/business-divisions/icon-export.svg"
                  alt=""
                  className="h-4 w-4"
                />
                Export
              </Button>
              <CreateDivisionDialog
                trigger={
                  <Button className="gap-2 rounded-xl bg-[#2A4467] px-4 text-base font-semibold text-white font-quicksand hover:bg-[#1f3552]">
                    <img
                      src="/assets/business-divisions/icon-plus.svg"
                      alt=""
                      className="h-4 w-4"
                    />
                    Create Division
                  </Button>
                }
              />
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex w-[347px] items-center justify-between rounded-lg border border-[#E5E7EB] bg-white p-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-[#6B6B6B] font-quicksand">
                  All Business Divisions
                </p>
                <p className="text-2xl font-bold text-[#0F0F0F] font-quicksand">
                  {totalDivisions}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/10">
                <img
                  src="/assets/business-divisions/icon-distribution.svg"
                  alt=""
                  className="h-[29px] w-[29px]"
                />
              </div>
            </div>
          </div>
        </div>

        {hasDivisions ? (
          <div className="mt-8 w-full overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
            <div className="flex h-[72px] items-center gap-6 border-b border-[#E9E9EB] px-6">
              <p className="text-base font-semibold text-[#0F0F0F] font-quicksand">
                Business Divisions
              </p>
              <div className="flex h-12 w-[300px] items-center gap-2 rounded-lg border border-[#E5E7EB] px-[15px] font-quicksand">
                <div className="flex items-center p-[3px]">
                  <Search
                    className="h-[15px] w-[15px] text-[#6B6B6B]"
                    strokeWidth={1.67}
                  />
                </div>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contract"
                  className="h-10 border-0 p-0 text-sm text-[#6B6B6B] placeholder:opacity-50 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
            <div className="px-0">
              <DataTable
                data={divisions}
                columns={columns}
                options={{
                  isLoading: isListLoading,
                  totalCounts: totalDocs,
                  pagination,
                  setPagination,
                  disablePagination: true,
                  disableSelection: true,
                }}
                classNames={{
                  container: "w-full [&>div:last-child]:hidden",
                  table: "border-separate border-spacing-y-3",
                  tHeader: "bg-[#F9FAFB]",
                  tHead: "h-auto p-0",
                  tCell: "p-0 pl-0",
                  tRow: "bg-white [&>td:first-child]:pl-6 [&>td:last-child]:pr-6",
                  tHeadRow:
                    "border-b border-[#E5E7EB] [&>th:first-child]:pl-6 [&>th:last-child]:pr-6",
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-6">
              <img
                src="/assets/business-divisions/icon-empty-folder.svg"
                alt=""
                className="h-14 w-14"
              />
              <p className="text-2xl font-semibold text-[#6B6B6B] font-quicksand">
                No Division Yet
              </p>
              <CreateDivisionDialog
                trigger={
                  <Button className="gap-2 rounded-xl bg-[#2A4467] px-4 text-base font-semibold text-white font-quicksand hover:bg-[#1f3552]">
                    <img
                      src="/assets/business-divisions/icon-plus.svg"
                      alt=""
                      className="h-4 w-4"
                    />
                    Create Division
                  </Button>
                }
              />
            </div>
          </div>
        )}
      </div>
      <BusinessDivisionDetailsSheet
        open={detailsOpen}
        onOpenChange={(nextOpen) => {
          setDetailsOpen(nextOpen);
          if (!nextOpen) setSelectedDivisionId(null);
        }}
        divisionId={selectedDivisionId}
      />
    </>
  );
};

export default BusinessDivisionsPage;
