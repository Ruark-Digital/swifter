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
import { ArrowLeft, Search, Share2, X } from "lucide-react";
import { useToastHandler } from "@/hooks/useToaster";
import { ApiResponse, ApiResponseError } from "@/types";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDate } from "date-fns";
import { DocumentItem, type DocType } from "./DocumentItem";
import { getFileExtension } from "@/lib/fileUtils";
import { cn } from "@/lib/utils";

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
  basePath: string;
};

export interface LemDetailResponse {
  manager:          Manager;
  _id:              string;
  approverStatus:   "N/A" | "approved" | "rejected" | "pending";
  company:          string;
  contractRef:      string;
  contractRefModel: string;
  submittedBy:      string;
  lemId:            string;
  title:            string;
  description:      string;
  amount:           number;
  status:           string;
  files:            File[];
  approvers:        any[];
  createdAt:        Date;
  updatedAt:        Date;
  __v:              number;
  summary:          Summary[];
  rateSheet:        RateSheet;
}

export interface Summary {
  name:   string;
  sheets: Sheet[];
}

export interface Sheet {
  sheetName: string;
  headers:   string[];
  rows:      { [key: string]: string }[];
}


export interface File {
  name: string;
  url:  string;
  type: string;
  size: number;
  _id:  string;
}

export interface Manager {
  user:       string;
  status:     string;
  comment:    string;
  actionedAt: Date;
}

export interface RateSheet {
}


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

const LemDetailsSheet: React.FC<LemDetailsSheetProps> = ({
  trigger,
  contractId,
  lemId,
  basePath,
}) => {
  const { isVendor } = useUserRole();
  const [sheetTab, setSheetTab] = React.useState("overview");

  const { data: lemDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["lem-detail", contractId, lemId, basePath],
    queryFn: async () => {
      const res = await getRequest({
        url: `${basePath}/${lemId}`,
      });
      return (res)?.data?.data as LemDetailResponse
    },
    enabled: !!contractId && !!lemId,
  });

  const getText = (value: unknown) =>
    typeof value === "string" ? value.toLowerCase() : "";

  const findSummarySheet = React.useCallback(
    (category: "labor" | "equipment" | "material") => {
      const summary = Array.isArray(lemDetail?.summary) ? lemDetail.summary : [];
      const needle = category.toLowerCase();

      for (const group of summary) {
        const groupName = getText(group?.name);
        const sheets = Array.isArray(group?.sheets) ? group.sheets : [];
        for (const sheet of sheets) {
          const sheetName = getText(sheet?.sheetName);
          if (groupName.includes(needle) || sheetName.includes(needle)) {
            return sheet;
          }
        }
      }
      return undefined;
    },
    [lemDetail?.summary],
  );

  const toColumns = React.useCallback((sheet?: Sheet) => {
    const headers = Array.isArray(sheet?.headers) ? sheet.headers : [];
    return headers.map((h) => ({
      id: h,
      header: h,
      accessorFn: (row: Record<string, string>) => row?.[h] ?? "",
    })) as Array<ColumnDef<Record<string, string>>>;
  }, []);

  const laborSheet = findSummarySheet("labor");
  const equipmentSheet = findSummarySheet("equipment");
  const materialSheet = findSummarySheet("material");

  const laborRows = Array.isArray(laborSheet?.rows) ? laborSheet.rows : [];
  const equipmentRows = Array.isArray(equipmentSheet?.rows)
    ? equipmentSheet.rows
    : [];
  const materialRows = Array.isArray(materialSheet?.rows)
    ? materialSheet.rows
    : [];

  const laborColumns = React.useMemo(
    () => toColumns(laborSheet),
    [laborSheet, toColumns],
  );
  const equipmentColumns = React.useMemo(
    () => toColumns(equipmentSheet),
    [equipmentSheet, toColumns],
  );
  const materialColumns = React.useMemo(
    () => toColumns(materialSheet),
    [materialSheet, toColumns],
  );

  const handlePreview = (doc: DocType) => {
    if (!doc.url) return;
    window.open(doc.url, "_blank", "noopener,noreferrer");
  };
  const handleDownload = (doc: DocType) => {
    if (!doc.url) return;
    const a = window.document.createElement("a");
    a.href = doc.url;
    a.download = doc.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };


  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className={cn(
          "w-full rounded-2xl overflow-y-auto [&>button]:hidden",
          sheetTab === "summary" ? "sm:max-w-6xl" : "sm:max-w-2xl",
        )}
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

            <Tabs
              value={sheetTab}
              onValueChange={setSheetTab}
              className="space-y-4"
            >
              <TabsList className="h-auto rounded-none w-full border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 justify-start bg-transparent">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
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
                        {lemDetail?.submittedBy || "-"}
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
                        {lemDetail?.status || "Pending"}
                      </span>
                    }
                  />
                  <LabelRow
                    label="Submission Date"
                    value={
                      lemDetail?.createdAt
                        ? formatDate(lemDetail.createdAt, "yyyy-MMM-dd")
                        : "—"
                    }
                  />
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

                {lemDetail?.files && lemDetail.files.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-base font-semibold text-[#0F0F0F]">
                      Attachment
                    </div>
                    {lemDetail.files.map((file: any, index: number) => {
                      const ext = getFileExtension(file?.name || "", file?.type || "");
                      const d: DocType = {
                        id: `${file?.name || "attachment"}-${index}`,
                        name: file?.name || "Attachment",
                        type: ext,
                        size: file?.size || "—",
                        url: file?.url,
                        icon: getFileIcon(ext),
                      };
                      return (
                        <DocumentItem
                          key={d.id}
                          d={d}
                          handlePreview={handlePreview}
                          handleDownload={handleDownload}
                        />
                      );
                    })}
                  </div>
                )}
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
                      data={laborRows}
                      columns={laborColumns as any}
                      options={{
                        disableSelection: true,
                        disablePagination: true,
                        manualPagination: false,
                        totalCounts: laborRows.length,
                        setPagination: () => {},
                        pagination: { pageIndex: 0, pageSize: 10 },
                        isLoading: !!detailLoading,
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
                      data={equipmentRows}
                      columns={equipmentColumns as any}
                      options={{
                        disableSelection: true,
                        disablePagination: true,
                        manualPagination: false,
                        totalCounts: equipmentRows.length,
                        setPagination: () => {},
                        pagination: { pageIndex: 0, pageSize: 10 },
                        isLoading: !!detailLoading,
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
                      data={materialRows}
                      columns={materialColumns as any}
                      options={{
                        disableSelection: true,
                        disablePagination: true,
                        manualPagination: false,
                        totalCounts: materialRows.length,
                        setPagination: () => {},
                        pagination: { pageIndex: 0, pageSize: 10 },
                        isLoading: !!detailLoading,
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

          {(!isVendor && lemDetail?.approverStatus === "pending") && (
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
                  <RejectLemForm
                    contractId={contractId}
                    lemId={lemId}
                    basePath={basePath}
                  />
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
                  <ApproveLemForm
                    contractId={contractId}
                    lemId={lemId}
                    basePath={basePath}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const createColumns = (
  contractId: string,
  basePath: string,
): ColumnDef<LemRow>[] => [
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
  {
    accessorKey: "submissionDate",
    header: "Submission Date",
    cell: ({ getValue }) => (
      <span className="text-sm text-slate-700">
        {formatDate(getValue<string>(), "yyyy-MMM-dd")}
      </span>
    ),
  },
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
            basePath={basePath}
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
  basePath: string;
}> = ({
  contractId,
  rows,
  isLoading,
  searchValue,
  onSearchChange,
  basePath,
}) => {
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
        columns={createColumns(contractId, basePath)}
        header={() => (
          <div className="flex items-center gap-3 border-b w-full border-[#E5E7EB] px-5 py-4">
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

import Spinner from "@/components/ui/Spinner";

const RejectLemForm: React.FC<{
  contractId: string;
  lemId: string;
  basePath: string;
  onSuccess?: () => void;
}> = ({ contractId, lemId, basePath, onSuccess }) => {
  const toast = useToastHandler();

  const schema = yup.object().shape({
    comment: yup.string().required("Rejection reason is required"),
  });
  const { control } = useForge({
    resolver: yupResolver(schema),
    defaultValues: { comment: "" },
  });

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation<
    ApiResponse,
    ApiResponseError,
    { comment: string }
  >({
    mutationKey: ["reject-lem", contractId, lemId, basePath],
    mutationFn: async (data) =>
      await postRequest({
        url: `${basePath}/${lemId}/approve`,
        payload: { action: "rejected", comment: data.comment },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lems", contractId] });
      queryClient.invalidateQueries({
        queryKey: ["lem-detail", contractId, lemId],
      });
      toast.success("Success", "LEM rejected successfully");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Error", error?.response?.data?.message || "Failed to reject LEM");
    },
  });

  const onSubmit = (data: { comment: string }) => {
    mutate(data);
  };

  return (
    <Forge control={control} onSubmit={onSubmit} className="space-y-4">
      <Forger
        name="comment"
        component={TextArea}
        placeholder="Enter rejection reason..."
        rows={4}
      />
      <DialogFooter >
        <Button
          type="submit"
          variant="destructive"
          className="w-full sm:w-auto bg-[#EF4444] hover:bg-[#DC2626]"
          disabled={isPending}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <Spinner className="h-4 w-4 text-white" />
              <span>Rejecting...</span>
            </div>
          ) : (
            "Reject LEM"
          )}
        </Button>
      </DialogFooter>
    </Forge>
  );
};

const ApproveLemForm: React.FC<{
  contractId: string;
  lemId: string;
  basePath: string;
  onSuccess?: () => void;
}> = ({ contractId, lemId, basePath, onSuccess }) => {
  const toast = useToastHandler();

  const schema = yup.object().shape({
    note: yup.string().optional(),
  });
  const { control } = useForge({
    resolver: yupResolver(schema),
    defaultValues: { note: "" },
  });

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<
    ApiResponse,
    ApiResponseError,
    { note?: string }
  >({
    mutationKey: ["approve-lem", contractId, lemId, basePath],
    mutationFn: async (data) =>
      await postRequest({
        url: `${basePath}/${lemId}/approve`,
        payload: { action: "approved", comment: data.note },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lems", contractId] });
      queryClient.invalidateQueries({
        queryKey: ["lem-detail", contractId, lemId],
      });
      toast.success("Success", "LEM approved successfully");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Error", error?.response?.data?.message || "Failed to approve LEM");
    },
  });

  const onSubmit = (data: { note?: string }) => {
    mutate(data);
  };

  return (
    <Forge control={control} onSubmit={onSubmit} className="space-y-4">
      <Forger
        name="note"
        component={TextArea}
        placeholder="Optional note..."
        rows={3}
      />
      <DialogFooter>
        <Button
          type="submit"
          className="w-full sm:w-auto bg-[#1F3B63] hover:bg-[#162c4b]"
          disabled={isPending}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <Spinner className="h-4 w-4 text-white" />
              <span>Approving...</span>
            </div>
          ) : (
            "Approve LEM"
          )}
        </Button>
      </DialogFooter>
    </Forge>
  );
};
