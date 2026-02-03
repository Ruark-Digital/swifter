import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Eye,
  Download,
  Search,
  Share2,
  AlertTriangle,
} from "lucide-react";

export type AmendmentRow = {
  amendmentId: string;
  amendmentTitle: string;
  vendorStatus: "Accepted" | "Pending" | "Rejected";
  status: "Approved" | "Pending" | "Rejected";
};

type AmendmentDetailsSheetProps = {
  trigger: React.ReactNode;
};

const LabelRow = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) => (
  <div className="grid grid-cols-2 gap-3 py-2">
    <span className="text-sm text-[#6B7280]">{label}</span>
    <span
      className={`text-sm ${
        highlight ? "font-semibold text-[#0F0F0F]" : "text-[#111827]"
      }`}
    >
      {value}
    </span>
  </div>
);

const DocCard = ({
  name,
  type,
  size,
}: {
  name: string;
  type: "DOC" | "PDF";
  size: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3F4F6] text-xs font-semibold text-[#374151]">
      {type}
    </div>
    <div className="flex-1">
      <div className="text-sm font-medium text-[#0F0F0F]">{name}</div>
      <div className="text-xs text-[#6B7280]">
        {type} • {size}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#6B7280]"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#6B7280]"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const AmendmentDetailsSheet: React.FC<AmendmentDetailsSheetProps> = ({
  trigger,
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl rounded-2xl overflow-y-auto"
      >
        <div className="space-y-6" data-testid="amendment-details-sheet">
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
                  Amendment Details
                </SheetTitle>
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F]"
              >
                <Share2 className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </SheetHeader>

          <div className="text-base font-semibold text-[#0F0F0F]">
            Additional structural reinforcement
          </div>

          <Tabs defaultValue="overview" className="w-full bg-transparent space-y-4">
            <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0  justify-start bg-transparent w-full">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                Comments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-5">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <LabelRow
                    label="Amendment Name"
                    value="Additional structural reinforcement"
                  />
                  <LabelRow label="Impact Type" value="Time" />
                  <LabelRow label="Time" value="April 30, 2025" />
                  <LabelRow
                    label="New Expiry/Delivery/Completion Date"
                    value="Apr 30, 2025"
                  />
                </div>
                <div>
                  <LabelRow label="Amendment ID" value="AM-2025-10" />
                  <LabelRow label="Value" value="$1m" highlight />
                  <LabelRow label="Vendor" value="Accepted" />
                  <LabelRow
                    label="Status"
                    value={
                      <span className="inline-flex rounded-full bg-[#FACC151A] px-3 py-1 text-xs font-semibold text-[#FACC15]">
                        Pending
                      </span>
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-[#6B7280]">Description</div>
                <div className="text-sm text-[#374151]">
                  Lorem ipsum dolor sit amet consectetur. Volutpat quis egestas
                  nunc egestas ut sed accumsan commodo vitae. Ullamcorper
                  feugiat pulvinar consectetur vel natoque amet enim ac sed.
                  Laoreet fringilla sollicitudin pharetra sit proin dictum. Sit
                  sed lorem mauris.
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-[#6B7280]">Attached Documents</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DocCard name="RFP_HRSoftware" type="DOC" size="25KB" />
                  <DocCard name="RFP_HRSoftware" type="PDF" size="1MB" />
                  <DocCard name="RFP_HRSoftware" type="DOC" size="25KB" />
                  <DocCard name="RFP_HRSoftware" type="PDF" size="1MB" />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-[#2A44671A] bg-[#F8F8F8] p-4">
                <div className="flex h-8 w-10 items-center justify-center rounded-full border border-[#EF4444] text-[#EF4444]">
                  <AlertTriangle className="h-4 w-4" />
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[#0F0F0F]">
                    Action needed
                  </div>
                  <div className="text-sm text-[#626262]">
                    This amendment includes a time impact, but no approver has
                    been assigned to review time-related impacts.
                  </div>
                </div>
              </div>

              <Button className="h-11 w-full rounded-xl bg-[#2A4467] text-sm font-semibold text-white">
                Assign Approver
              </Button>
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              <div className="rounded-xl border border-[#E5E7EB] p-4 text-sm text-[#6B7280]">
                No comments yet.
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const columns: ColumnDef<AmendmentRow>[] = [
  {
    accessorKey: "amendmentId",
    header: "Amendment ID",
    cell: ({ getValue }) => (
      <div className="w-[100px] py-2 text-center text-sm font-semibold text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "amendmentTitle",
    header: "Amendment Title",
    cell: ({ getValue }) => (
      <div className="w-[160px] py-2 text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "vendorStatus",
    header: "Vendor Status",
    cell: ({ getValue }) => (
      <div className="w-[100px] py-2 text-center text-sm font-semibold text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue<AmendmentRow["status"]>();
      const tone =
        s === "Approved"
          ? "bg-[#43A0471A] text-[#43A047]"
          : s === "Pending"
            ? "bg-[#FACC151A] text-[#FACC15]"
            : "bg-[#E539351A] text-[#E53935]";
      return (
        <div className="flex w-[120px] items-center justify-center py-2">
          <div className={`rounded-xl px-[18px] py-[6px] ${tone}`}>
            <span className="text-xs font-semibold leading-[15px]">{s}</span>
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Action",
    cell: () => (
      <div className="w-[80px] py-2 text-center">
        <AmendmentDetailsSheet
          trigger={
            <button
              type="button"
              className="text-sm font-bold text-[#43A047] underline"
            >
              View
            </button>
          }
        />
      </div>
    ),
  },
];

type Props = {
  rows?: AmendmentRow[];
  isLoading?: boolean;
};

const AmendmentsTable: React.FC<Props> = ({ rows = [], isLoading }) => {
  const [search, setSearch] = React.useState("");

  const filteredRows = React.useMemo(() => {
    if (!search) return rows;
    const query = search.toLowerCase();
    return rows.filter((row) =>
      [row.amendmentId, row.amendmentTitle, row.vendorStatus, row.status].some(
        (value) => value.toLowerCase().includes(query),
      ),
    );
  }, [rows, search]);

  return (
    <div
      data-testid="amendments-table"
      className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden"
    >
      <div className="flex items-center gap-6 border-b border-[#E9E9EB] px-6 py-6">
        <div className="text-base font-semibold text-[#0F0F0F]">Amendments</div>
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

      <div className="px-0 pb-0">
        <DataTable<AmendmentRow>
          data={filteredRows}
          columns={columns}
          options={{
            disableSelection: true,
            isLoading,
            disablePagination: true,
            manualPagination: false,
            totalCounts: filteredRows.length,
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
            tCell: "px- py-4 text-sm text-slate-700 align-top",
          }}
        />
      </div>
    </div>
  );
};

export default AmendmentsTable;
