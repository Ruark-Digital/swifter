import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { Search, ArrowLeft, X, Share2, Eye, Download } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFileIcon } from "@/lib/fileUtils";

type Props = {
  contractId: string;
  isActive?: boolean;
};

type RateSheetRow = {
  id: string;
  title: string;
  amount: string;
  submissionDate: string;
  status: "Approved" | "Rejected" | "Pending";
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

const DocCard = ({
  name,
  type,
  size,
}: {
  name: string;
  type: string;
  size: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2FF]">
      {getFileIcon(type.toUpperCase())}
    </div>
    <div className="flex-1">
      <div className="text-sm font-medium text-[#111827]">{name}</div>
      <div className="text-xs text-[#6B7280]">
        {type.toUpperCase()} • {size}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827]"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827]"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const RateSheetDetailsSheet: React.FC<{
  trigger: React.ReactNode;
  contractId: string;
  row: RateSheetRow;
}> = ({ trigger, contractId, row }) => {
  console.log({ contractId })
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl rounded-2xl overflow-y-auto [&>button]:hidden"
      >
        <div className="space-y-6" data-testid="rate-sheet-details-sheet">
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
                  Rate Sheet Details
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-[#0F0F0F]">
                {row.title || "—"}
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F]"
              >
                <Share2 className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-[#E5E7EB] bg-transparent p-0">
                <TabsTrigger
                  value="overview"
                  className="rounded-none px-0 pb-3 text-xs font-semibold text-[#111827] data-[state=active]:text-[#2A4467] data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[#2A4467]"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="rounded-none px-0 pb-3 text-xs font-semibold text-[#6B7280] data-[state=active]:text-[#2A4467] data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[#2A4467]"
                >
                  Rate Sheet Summary
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <LabelRow label="Rate Sheet Title" value={row.title} />
                    <LabelRow label="Amount" value={row.amount} />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <LabelRow label="Submission Date" value={row.submissionDate} />
                    <LabelRow
                      label="Status"
                      value={
                        <span className="rounded-full bg-[#FACC151A] px-3 py-1 text-xs font-semibold text-[#FACC15]">
                          {row.status}
                        </span>
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#9CA3AF]">
                      Description
                    </div>
                    <div className="text-sm font-medium text-[#111827]">—</div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-[#0F0F0F]">
                      Attachment
                    </div>
                    <div className="hidden">
                      <DocCard name="RFP_HRSoftware" type="DOC" size="25KB" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="summary">
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6 text-sm text-[#6B7280]">
                  No summary available.
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-xl border-[#E5E7EB] text-sm font-semibold text-[#111827]"
            >
              Reject Change
            </Button>
            <Button className="h-11 flex-1 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white">
              Approve
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const RateSheetsTabContent: React.FC<Props> = ({ contractId, isActive }) => {
  const [search, setSearch] = React.useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["rate-sheets", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/approver/contract/${contractId}/ratesheets`,
      });
      const items = (res as any)?.data?.data || [];
      const rows: RateSheetRow[] = items.map((it: any) => ({
        id: it?.rateId || it?._id || "",
        title: it?.title || "",
        amount:
          typeof it?.amount === "number"
            ? `$${it.amount.toLocaleString()}`
            : it?.amount || "",
        submissionDate: it?.createdAt || "",
        status: "Pending",
      }));
      return rows;
    },
    enabled: !!contractId && !!isActive,
  });

  const filtered = React.useMemo(() => {
    const source = data || [];
    const q = search.trim().toLowerCase();
    if (!q) return source;
    return source.filter((row) =>
      [row.id, row.title].some((v) => v.toLowerCase().includes(q)),
    );
  }, [data, search]);

  const columns: ColumnDef<RateSheetRow>[] = React.useMemo(
    () => [
      { accessorKey: "id", header: "Rate ID" },
      {
        accessorKey: "title",
        header: "Rate Title",
        cell: ({ getValue }) => (
          <div className="max-w-[260px] text-sm text-slate-700">
            {getValue<string>()}
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ getValue }) => (
          <span className="font-medium text-slate-900">
            {getValue<string>()}
          </span>
        ),
      },
      { accessorKey: "submissionDate", header: "Submission Date" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const s = getValue<RateSheetRow["status"]>();
          const tone =
            s === "Approved"
              ? "bg-green-100 text-green-700"
              : s === "Rejected"
                ? "bg-red-100 text-red-600"
                : "bg-yellow-100 text-yellow-700";
          return (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${tone}`}
            >
              {s}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const rs = row.original as RateSheetRow;
          return (
            <div className="text-right">
              <RateSheetDetailsSheet
                contractId={contractId}
                row={rs}
                trigger={
                  <button
                    type="button"
                    className="text-sm font-medium text-green-700 hover:underline"
                  >
                    View
                  </button>
                }
              />
            </div>
          );
        },
      },
    ],
    [contractId],
  );

  return (
    <TabsContent value="rate-sheets" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Rate Sheets</h3>
        <Button variant="outline" className="h-10 rounded-xl px-4">
          Export Report
        </Button>
      </div>

      <DataTable<RateSheetRow>
        data={filtered}
        columns={columns}
        header={() => (
          <div className="flex items-center gap-3 border-b w-full border-[#E5E7EB] px-5 py-4">
            <span className="text-sm font-medium text-slate-900">Rate Sheets</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-[260px] pl-9"
              />
            </div>
          </div>
        )}
        options={{
          disableSelection: true,
          disablePagination: true,
          manualPagination: false,
          totalCounts: filtered.length,
          setPagination: () => {},
          pagination: { pageIndex: 0, pageSize: 10 },
          isLoading: !!isLoading,
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
    </TabsContent>
  );
};

export default RateSheetsTabContent;
