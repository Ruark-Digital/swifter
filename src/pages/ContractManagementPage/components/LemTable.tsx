import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Forge, Forger, useForge } from "@/lib/forge";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { TextArea } from "@/components/layouts/FormInputs";
import { postRequest } from "@/lib/axiosInstance";
import { getFileIcon } from "@/lib/fileUtils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Download,
  Eye,
  Search,
  Share2,
  X,
} from "lucide-react";
import { useToastHandler } from "@/hooks/useToaster";
import { ApiResponse, ApiResponseError } from "@/types";

export type LemRow = {
  id: string;
  title: string;
  amount: string;
  submissionDate: string;
  status: "Approved" | "Rejected" | "Pending";
};

type LemDetailsSheetProps = {
  trigger: React.ReactNode;
  contractId: string;
  lemId: string;
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
  type: "DOC" | "PDF";
  size: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2FF]">
      {getFileIcon(type)}
    </div>
    <div className="flex-1">
      <div className="text-sm font-medium text-[#111827]">{name}</div>
      <div className="text-xs text-[#9CA3AF]">
        {type} • {size}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6B7280]"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6F0FF] text-[#2563EB]"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const LemDetailsSheet: React.FC<LemDetailsSheetProps> = ({
  trigger,
  contractId,
  lemId,
}) => {
  const { data: lemDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["lem-detail", contractId, lemId],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/approver/contract/${contractId}/lems/${lemId}`,
      });
      return (res as any)?.data?.data;
    },
    enabled: !!contractId && !!lemId,
  });

  const { data: rateSheet, isLoading: sheetLoading } = useQuery({
    queryKey: ["lem-rate-sheet", contractId, lemId],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/user/contracts/${contractId}/lems/${lemId}/ratesheet`,
      });
      return (res as any)?.data?.data?.sheet;
    },
    enabled: !!contractId && !!lemId,
  });

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl rounded-2xl overflow-y-auto [&>button]:hidden"
      >
        <div className="space-y-6" data-testid="lem-details-sheet">
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
                  LEM Details
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
                {detailLoading ? "Loading..." : lemDetail?.title || "—"}
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
                  className="rounded-none border-b-2 border-transparent px-0 pb-2 text-xs font-semibold text-[#6B7280] data-[state=active]:border-[#2A4467] data-[state=active]:text-[#2A4467]"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="rounded-none border-b-2 border-transparent px-0 pb-2 text-xs font-semibold text-[#6B7280] data-[state=active]:border-[#2A4467] data-[state=active]:text-[#2A4467]"
                >
                  LEM Summary
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-6 sm:grid-cols-2">
                  <LabelRow
                    label="Deliverable Title"
                    value={
                      detailLoading ? "Loading..." : lemDetail?.title || "—"
                    }
                  />
                  <LabelRow
                    label="Submitted By"
                    value={
                      <a className="text-[#2563EB] underline">
                        Olamide Oladehinde
                      </a>
                    }
                  />
                  <LabelRow
                    label="Amount"
                    value={
                      detailLoading || typeof lemDetail?.amount !== "number"
                        ? "—"
                        : `$${lemDetail.amount.toLocaleString()}`
                    }
                  />
                  <LabelRow
                    label="Status"
                    value={
                      <span className="inline-flex rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#F59E0B]">
                        Pending
                      </span>
                    }
                  />
                  <LabelRow label="Submission Date" value="April 30, 2025" />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#9CA3AF]">
                    Description
                  </div>
                  <div className="text-sm text-[#374151]">
                    {detailLoading
                      ? "Loading..."
                      : lemDetail?.description || "—"}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-base font-semibold text-[#0F0F0F]">
                    Attachment
                  </div>
                  <DocCard name="RFP_HRSoftware" type="DOC" size="25KB" />
                </div>
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                <Tabs defaultValue="labor" className="space-y-4">
                  <TabsList className="h-auto w-full justify-start gap-3 rounded-full bg-[#F3F4F6] p-1">
                    <TabsTrigger
                      value="labor"
                      className="rounded-full px-4 py-2 text-xs font-semibold text-[#6B7280] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
                    >
                      Labor (Timesheet)
                    </TabsTrigger>
                    <TabsTrigger
                      value="equipment"
                      className="rounded-full px-4 py-2 text-xs font-semibold text-[#6B7280] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
                    >
                      Equipment Rent
                    </TabsTrigger>
                    <TabsTrigger
                      value="material"
                      className="rounded-full px-4 py-2 text-xs font-semibold text-[#6B7280] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
                    >
                      Material
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="labor">
                    <DataTable<any>
                      data={
                        Array.isArray(rateSheet?.labor) ? rateSheet.labor : []
                      }
                      columns={[
                        { accessorKey: "row", header: "#" },
                        { accessorKey: "label", header: "Row Label" },
                        { accessorKey: "avgRate", header: "Avg. Rate (CAD)" },
                        { accessorKey: "manHour", header: "Man Hour" },
                        { accessorKey: "cost", header: "Cost (CAD)" },
                        { accessorKey: "feePercent", header: "Fee(%)" },
                        { accessorKey: "fee", header: "Fee (CAD)" },
                        { accessorKey: "price", header: "Price (CAD)" },
                        {
                          accessorKey: "rateSheetPrice",
                          header: "Rate Sheet Price (CAD)",
                        },
                        { accessorKey: "variance", header: "Variance (CAD)" },
                        { accessorKey: "status", header: "Status" },
                      ]}
                      options={{
                        disableSelection: true,
                        disablePagination: true,
                        manualPagination: false,
                        totalCounts: Array.isArray(rateSheet?.labor)
                          ? rateSheet.labor.length
                          : 0,
                        setPagination: () => {},
                        pagination: { pageIndex: 0, pageSize: 10 },
                        isLoading: !!sheetLoading,
                      }}
                      classNames={{
                        container:
                          "border border-[#E5E7EB] rounded-xl bg-white",
                        tHeader: "bg-[#F9FAFB]",
                        tHeadRow: "border-b border-[#E5E7EB]",
                        tBody: "bg-white",
                        tRow: "border-b border-[#E5E7EB]",
                        tHead: "px-6 py-3 text-xs font-semibold text-[#6B7280]",
                        tCell: "px-6 py-4 text-sm text-slate-700 align-top",
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="equipment">
                    <DataTable<any>
                      data={
                        Array.isArray(rateSheet?.equipment)
                          ? rateSheet.equipment
                          : []
                      }
                      columns={[
                        { accessorKey: "row", header: "#" },
                        { accessorKey: "label", header: "Row Label" },
                        { accessorKey: "avgUnits", header: "Avg. of Units" },
                        {
                          accessorKey: "monthlyRateUnit",
                          header: "Mthly Rental Rate per Unit (w/o Markup)",
                        },
                        {
                          accessorKey: "monthlyRate",
                          header: "Mthly Rental Rate (w/o Markup)",
                        },
                        {
                          accessorKey: "rentalCost",
                          header: "Rental Cost (Period)",
                        },
                        { accessorKey: "feePercent", header: "Fee (%)" },
                        { accessorKey: "fee", header: "Fee $ (Period)" },
                        {
                          accessorKey: "rentalPrice",
                          header: "Rental Price (Period)",
                        },
                      ]}
                      options={{
                        disableSelection: true,
                        disablePagination: true,
                        manualPagination: false,
                        totalCounts: Array.isArray(rateSheet?.equipment)
                          ? rateSheet.equipment.length
                          : 0,
                        setPagination: () => {},
                        pagination: { pageIndex: 0, pageSize: 10 },
                        isLoading: !!sheetLoading,
                      }}
                      classNames={{
                        container:
                          "border border-[#E5E7EB] rounded-xl bg-white",
                        tHeader: "bg-[#F9FAFB]",
                        tHeadRow: "border-b border-[#E5E7EB]",
                        tBody: "bg-white",
                        tRow: "border-b border-[#E5E7EB]",
                        tHead: "px-6 py-3 text-xs font-semibold text-[#6B7280]",
                        tCell: "px-6 py-4 text-sm text-slate-700 align-top",
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="material">
                    <DataTable<any>
                      data={
                        Array.isArray(rateSheet?.material)
                          ? rateSheet.material
                          : []
                      }
                      columns={[
                        { accessorKey: "row", header: "#" },
                        { accessorKey: "label", header: "Row Label" },
                        { accessorKey: "unitRate", header: "Unit Rate (CAD)" },
                        { accessorKey: "units", header: "Units" },
                        { accessorKey: "cost", header: "Cost (CAD)" },
                        { accessorKey: "feePercent", header: "Fee(%)" },
                        { accessorKey: "fee", header: "Fee (CAD)" },
                        { accessorKey: "price", header: "Price (CAD)" },
                      ]}
                      options={{
                        disableSelection: true,
                        disablePagination: true,
                        manualPagination: false,
                        totalCounts: Array.isArray(rateSheet?.material)
                          ? rateSheet.material.length
                          : 0,
                        setPagination: () => {},
                        pagination: { pageIndex: 0, pageSize: 10 },
                        isLoading: !!sheetLoading,
                      }}
                      classNames={{
                        container:
                          "border border-[#E5E7EB] rounded-xl bg-white",
                        tHeader: "bg-[#F9FAFB]",
                        tHeadRow: "border-b border-[#E5E7EB]",
                        tBody: "bg-white",
                        tRow: "border-b border-[#E5E7EB]",
                        tHead: "px-6 py-3 text-xs font-semibold text-[#6B7280]",
                        tCell: "px-6 py-4 text-sm text-slate-700 align-top",
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex gap-3 pt-6">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 flex-1 rounded-xl border-[#E5E7EB] text-sm font-semibold text-[#111827]"
                >
                  Reject Change
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold text-[#0F0F0F]">
                    Reject LEM
                  </DialogTitle>
                </DialogHeader>
                <RejectLemForm contractId={contractId} lemId={lemId} />
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-11 flex-1 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white">
                  Approve
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold text-[#0F0F0F]">
                    Approve LEM
                  </DialogTitle>
                </DialogHeader>
                <ApproveLemForm contractId={contractId} lemId={lemId} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const createColumns = (contractId: string): ColumnDef<LemRow>[] => [
  { accessorKey: "id", header: "LEM ID" },
  {
    accessorKey: "title",
    header: "LEM Title",
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
      <span className="font-medium text-slate-900">{getValue<string>()}</span>
    ),
  },
  { accessorKey: "submissionDate", header: "Submission Date" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue<LemRow["status"]>();
      const tone =
        s === "Approved"
          ? "bg-green-100 text-green-700"
          : s === "Rejected"
            ? "bg-red-100 text-red-600"
            : "bg-yellow-100 text-yellow-700";
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${tone}`}>
          {s}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right">
          <LemDetailsSheet
            contractId={contractId}
            lemId={row.original.id}
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
];


const LemTable: React.FC<{
  contractId: string;
  rows: LemRow[];
  isLoading?: boolean;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}> = ({ contractId, rows, isLoading, searchValue, onSearchChange }) => {

  const filteredRows = React.useMemo(() => {
    const source = rows || [];
    const query = (searchValue || "").toLowerCase();
    if (!query) return source;
    return source.filter((row) =>
      [row.id, row.title].some((value) => value.toLowerCase().includes(query)),
    );
  }, [searchValue, rows]);

  return (
    <div className="space-y-4" data-testid="lem-table">
      <DataTable<LemRow>
        data={filteredRows}
        columns={createColumns(contractId)}
        header={() => (
          <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-4">
            <span className="text-sm font-medium text-slate-900">LEM</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search"
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="h-10 w-[260px] pl-9"
              />
            </div>
          </div>
        )}
        options={{
          disableSelection: true,
          disablePagination: true,
          manualPagination: false,
          totalCounts: filteredRows.length,
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
    </div>
  );
};

export default LemTable;

const RejectLemForm: React.FC<{ contractId: string; lemId: string }> = ({
  contractId,
  lemId,
}) => {
  const toast = useToastHandler();

  const schema = yup.object().shape({
    comment: yup.string().required("Reason is required"),
  });
  const { control } = useForge({
    resolver: yupResolver(schema),
    defaultValues: { comment: "" },
  });

  const queryClient = useQueryClient();
  const rejectMutation = useMutation<ApiResponse, ApiResponseError, { comment: string }>({
    mutationKey: ["reject-lem", contractId, lemId],
    mutationFn: async (data: { comment: string }) =>
      await postRequest({
        url: `/contract/approver/contract/${contractId}/lems/${lemId}/approve`,
        payload: { action: "rejected", comment: data.comment },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lems", contractId] });
      queryClient.invalidateQueries({ queryKey: ["lem-detail", contractId, lemId] });
    },
    onError(error) {
      toast.error("Failed to reject LEM", error);
    },
  });



  const onSubmit = async (data: { comment: string }) => {
    await rejectMutation.mutateAsync(data);
  };

  return (
    <Forge control={control} onSubmit={onSubmit}>
      <Forger
        name="comment"
        component={TextArea}
        placeholder="Enter rejection reason..."
        rows={4}
      />
      <DialogFooter>
        <Button
          type="submit"
          className="rounded-lg bg-[#EF4444]"
          disabled={rejectMutation.isPending}
          aria-busy={rejectMutation.isPending}
        >
          {rejectMutation.isPending ? "Rejecting..." : "Reject"}
        </Button>
      </DialogFooter>
      {rejectMutation.isError && (
        <div className="px-2 pt-2 text-sm text-[#EF4444]">Failed to reject LEM</div>
      )}
    </Forge>
  );
};

const ApproveLemForm: React.FC<{ contractId: string; lemId: string }> = ({
  contractId,
  lemId,
}) => {
  const toast = useToastHandler();
  
  const schema = yup.object().shape({
    note: yup.string().optional(),
  });
  const { control } = useForge({
    resolver: yupResolver(schema),
    defaultValues: { note: "" },
  });

  const queryClient = useQueryClient();

  const approveMutation = useMutation<ApiResponse, ApiResponseError, { note?: string }>({
    mutationKey: ["approve-lem", contractId, lemId],
    mutationFn: async (data: { note?: string }) =>
      await postRequest({
        url: `/contract/approver/contract/${contractId}/lems/${lemId}/approve`,
        payload: { action: "approved", comment: data.note },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lems", contractId] });
      queryClient.invalidateQueries({ queryKey: ["lem-detail", contractId, lemId] });
    },
    onError(error) {
      toast.error("Failed to approve LEM", error);
    },
  });

  const onSubmit = async (data: { note?: string }) => {
    await approveMutation.mutateAsync(data);
  };

  return (
    <Forge control={control} onSubmit={onSubmit}>
      <Forger
        name="note"
        component={TextArea}
        placeholder="Optional note..."
        rows={3}
      />
      <DialogFooter>
        <Button
          type="submit"
          className="rounded-lg bg-[#1F3B63]"
          disabled={approveMutation.isPending}
          aria-busy={approveMutation.isPending}
        >
          {approveMutation.isPending ? "Approving..." : "Approve"}
        </Button>
      </DialogFooter>
    </Forge>
  );
};
