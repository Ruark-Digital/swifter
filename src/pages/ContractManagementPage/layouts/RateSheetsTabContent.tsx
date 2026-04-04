import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import {
  Search,
  ArrowLeft,
  X,
  Share2,
  FileText,
  UploadCloud,
} from "lucide-react";
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
  getFileIcon,
  formatFileSize,
  getSimpleFileExtension,
} from "@/lib/fileUtils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Forge, Forger, useForge } from "@/lib/forge";
import {
  TextArea,
  TextCurrencyInput,
  TextFileUploader,
  TextInput,
} from "@/components/layouts/FormInputs";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useFormContext, useWatch } from "react-hook-form";
import { useUserRole } from "@/hooks/useUserRole";
import { DocumentItem, type DocType } from "../components/DocumentItem";
import { useToastHandler } from "@/hooks/useToaster";
import type { ApiResponse, ApiResponseError } from "@/types";
import type { UploadURLs } from "../lib/contractChanges";

type Props = {
  contractId: string;
  isActive?: boolean;
};

type RateSheetRow = {
  id: string;
  sheetId: string;
  title: string;
  amount: string;
  submissionDate: string;
  status: "Approved" | "Rejected" | "Pending";
};

type SubmitRateSheetFormValues = {
  title: string;
  amount: string;
  description: string;
  files: File[] | null;
};

const submitRateSheetSchema = yup.object({
  title: yup.string().required("Rate Title is required"),
  amount: yup.string().required("Amount is required"),
  description: yup.string().required("Description is required"),
  files: yup.mixed().nullable().notRequired(),
});

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


const RateSheetUploadElement = () => {
  return (
    <div className="flex h-40 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#9CA3AF] bg-white px-4">
      <UploadCloud className="h-10 w-10 text-[#2A4467]" />
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="text-sm font-semibold text-[#2A4467]">
          Drag &amp; Drop or Click to choose files
        </div>
        <div className="text-xs font-medium text-[#9CA3AF]">
          Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
        </div>
      </div>
    </div>
  );
};

const RateSheetFilesListItem = ({ file }: { file: File }) => {
  const { control, setValue } = useFormContext<SubmitRateSheetFormValues>();
  const value = useWatch({ control, name: "files" });

  return (
    <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-[#EAF1FB]">
          <FileText className="h-5 w-5 text-[#2A4467]" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium max-w-xs text-[#0F0F0F]">
            {file.name}
          </div>
          <div className="text-xs font-medium text-[#9CA3AF]">
            {getSimpleFileExtension(file.name).toUpperCase()} •{" "}
            {formatFileSize(file.size)}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() =>
          setValue(
            "files",
            (value ?? []).filter((f: File) => f.name !== file.name),
          )
        }
        className="inline-flex h-8 w-8 items-center justify-center text-[#9CA3AF] hover:text-red-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const SubmitRateSheetDialog: React.FC<{
  trigger: React.ReactElement;
  contractId: string;
  queryKeyPath: string;
}> = ({
  trigger,
  contractId,
  queryKeyPath,
}) => {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const toastHandler = useToastHandler();
  const queryClient = useQueryClient();

  const { control, reset } = useForge<SubmitRateSheetFormValues>({
    resolver: yupResolver(submitRateSheetSchema) as any,
    defaultValues: {
      title: "",
      amount: "",
      description: "",
      files: null,
    },
  });

  const { mutateAsync: uploadFile, isPending } = useMutation<
    ApiResponse<UploadURLs[]>,
    ApiResponseError,
    { file: File }
  >({
    mutationKey: ["uploadRateSheetFile"],
    mutationFn: async ({ file }) => {
      const formData = new FormData();
      formData.append("file", file as any);
      return await postRequest({
        url: "/upload",
        payload: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      });
    },
  });

  const submitMutation = useMutation({
    mutationKey: ["submitRateSheet", contractId],
    mutationFn: async (payload: {
      title: string;
      description: string;
      amount: number;
      files: { name: string; url: string; type: string; size: string }[];
    }) => {
      return await postRequest({
        url: `/contract/vendor/contracts/${contractId}/ratesheets`,
        payload,
      });
    },
    onSuccess: async (res: any) => {
      setOpen(false);
      reset();
      await queryClient.invalidateQueries({
        queryKey: ["rate-sheets", contractId, queryKeyPath],
      });
      toastHandler.success("Success", res?.data?.message || "Rate sheet submitted successfully");
    },
    onError: (error: any) => {
      toastHandler.error(
        "Error",
        error?.response?.data?.message || "Failed to submit rate sheet",
      );
    },
  });

  const onSubmit = React.useCallback(
    async (data: SubmitRateSheetFormValues) => {
      setIsSubmitting(true);
      try {
        let uploadedFiles: { name: string; url: string; type: string; size: string }[] = [];

        if (data.files && data.files.length > 0) {
          const responses = await Promise.all(
            data.files.map((file) => uploadFile({ file })),
          );

          uploadedFiles = responses
            .map((res, index) => {
              const uploaded = res.data?.data?.[0];
              const source = data.files?.[index];
              if (!uploaded || !source) return null;
              return {
                name: source.name,
                url: uploaded.url,
                type: getSimpleFileExtension(source.name).toUpperCase(),
                size: source.size?.toString?.() ?? "0",
              };
            })
            .filter(Boolean) as { name: string; url: string; type: string; size: string }[];
        }

        await submitMutation.mutateAsync({
          title: data.title,
          amount: Number(data.amount),
          description: data.description,
          files: uploadedFiles,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [submitMutation, uploadFile],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) {
          setOpen(nextOpen);
          if (!nextOpen) reset();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[70vh] overflow-auto gap-0 border-0 p-0 sm:max-w-xl">
        <Forge
          control={control}
          onSubmit={onSubmit}
          className="flex flex-col"
        >
          <div className="flex items-center justify-between px-8 py-8">
            <h2 className="text-xl font-semibold text-[#0F0F0F]">
              Submit Rate Sheet
            </h2>
          </div>

          <div className="flex flex-1 flex-col gap-6 px-8">
            <Forger
              name="title"
              label="Rate Title"
              component={TextInput}
              placeholder="Enter Title"
            />

            <Forger
              name="amount"
              label="Amount"
              component={TextCurrencyInput}
              placeholder="Enter Amount"
            />

            <Forger
              name="description"
              label="Description"
              component={TextArea}
              placeholder="Duration"
              rows={6}
            />

            <div className="flex flex-col gap-3">
              <label className="text-base font-normal text-[#0F0F0F]">
                Upload Files
              </label>
              <Forger
                name="files"
                component={TextFileUploader}
                element={<RateSheetUploadElement />}
                List={RateSheetFilesListItem}
                accept={
                  {
                    "application/pdf": [".pdf"],
                    "application/msword": [".doc"],
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                      [".docx"],
                    "application/vnd.ms-excel": [".xls"],
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                      [".xlsx"],
                    "application/zip": [".zip"],
                    "image/png": [".png"],
                    "image/jpeg": [".jpeg", ".jpg"],
                  } as any
                }
              />
            </div>
          </div>

          <div className="mt-auto flex items-center gap-6 px-8 py-8">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] py-3.5 text-base font-semibold text-[#0F0F0F] shadow-sm hover:bg-[#E5E7EB]"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isPending || submitMutation.isPending}
              className="flex-1 rounded-xl bg-[#2A4467] py-3.5 text-base font-semibold text-white shadow-sm hover:bg-[#1e3a5f]"
            >
              Submit Rate Sheet
            </button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export interface RateSheetDetailResponse {
  sheet: RateSheetDetailResponseSheet;
}

export interface RateSheetDetailResponseSheet {
  manager:          Manager;
  _id:              string;
  company:          string;
  contractRef:      string;
  contractRefModel: string;
  submittedBy:      SubmittedBy;
  sheetId:          string;
  title:            string;
  description:      string;
  amount:           number;
  status:           string;
  files:            File[];
  createdAt:        Date;
  updatedAt:        Date;
  __v:              number;
  summary:          Summary[];
}

export interface File {
  name: string;
  url:  string;
  type: string;
  size: number;
  _id:  string;
}

export interface Manager {
  status: string;
}

export interface SubmittedBy {
  _id:  string;
  name: string;
}

export interface Summary {
  name:   string;
  sheets: SheetElement[];
}

export interface SheetElement {
  sheetName: string;
  headers:   string[];
  rows:      { [key: string]: string }[];
}

const EMPTY_RATE_SHEET_SUMMARY: Summary[] = [];

const RateSheetSummaryTable = React.memo(
  ({ headers, rows }: { headers: string[]; rows: SheetElement["rows"] }) => {
    const headerCells = React.useMemo(
      () =>
        headers.map((h) => (
          <th key={h} className="whitespace-nowrap px-4 py-3">
            {h}
          </th>
        )),
      [headers],
    );

    const bodyRows = React.useMemo(() => {
      if (rows.length === 0) {
        return (
          <tr className="border-t border-[#E5E7EB]">
            <td className="px-4 py-3 text-[#6B7280]" colSpan={headers.length}>
              No rows available.
            </td>
          </tr>
        );
      }

      return rows.map((r, rowIndex) => (
        <tr key={rowIndex} className="border-t border-[#E5E7EB]">
          {headers.map((h) => (
            <td key={`${rowIndex}-${h}`} className="whitespace-nowrap px-4 py-3">
              {(r as any)?.[h] ?? "—"}
            </td>
          ))}
        </tr>
      ));
    }, [headers, rows]);

    return (
      <div className="overflow-x-auto rounded-lg border border-[#E5E7EB] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F9FAFB] text-xs font-semibold text-[#6B7280]">
            <tr>{headerCells}</tr>
          </thead>
          <tbody>{bodyRows}</tbody>
        </table>
      </div>
    );
  },
  (prev, next) => prev.headers === next.headers && prev.rows === next.rows,
);

const RateSheetSummarySheet = React.memo(
  ({ sheet }: { sheet: SheetElement }) => {
    return (
      <div className="space-y-3">
        <div className="text-sm font-semibold text-[#0F0F0F]">
          {sheet?.sheetName || "—"}
        </div>
        {Array.isArray(sheet?.headers) && sheet.headers.length > 0 ? (
          <RateSheetSummaryTable headers={sheet.headers} rows={sheet.rows || []} />
        ) : (
          <div className="text-sm text-[#6B7280]">No headers available.</div>
        )}
      </div>
    );
  },
  (prev, next) => prev.sheet === next.sheet,
);

const RateSheetSummaryGroup = React.memo(
  ({ group }: { group: Summary }) => {
    const sheets = group?.sheets || [];

    return (
      <div className="space-y-4">
        <div className="text-sm font-semibold text-[#0F0F0F]">
          {group?.name || "Summary"}
        </div>
        <div className="space-y-5">
          {sheets.map((s, sheetIndex) => (
            <RateSheetSummarySheet
              key={`${s?.sheetName || "sheet"}-${sheetIndex}`}
              sheet={s}
            />
          ))}
        </div>
      </div>
    );
  },
  (prev, next) => prev.group === next.group,
);

const RateSheetSummaryTab = React.memo(
  ({ detailLoading, summary }: { detailLoading: boolean; summary: Summary[] }) => {
    return (
      <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6 text-sm text-[#6B7280]">
        {detailLoading ? (
          <div>Loading summary...</div>
        ) : summary.length > 0 ? (
          <div className="space-y-6 text-[#111827]">
            {summary.map((group, groupIndex) => (
              <RateSheetSummaryGroup
                key={`${group?.name || "summary"}-${groupIndex}`}
                group={group}
              />
            ))}
          </div>
        ) : (
          <div>No summary available.</div>
        )}
      </div>
    );
  },
  (prev, next) => prev.detailLoading === next.detailLoading && prev.summary === next.summary,
);


const RateSheetDetailsSheet: React.FC<{
  trigger: React.ReactNode;
  contractId: string;
  row: RateSheetRow;
  basePath: string;
}> = ({ trigger, contractId, row, basePath }) => {
  const [open, setOpen] = React.useState(false);
  const toastHandler = useToastHandler();
  const queryClient = useQueryClient();
  const { isManager } = useUserRole();

  const { data: detailRes, isLoading: detailLoading } = useQuery({
    queryKey: ["rate-sheet-detail", basePath, contractId, row.sheetId],
    queryFn: async () => {
      const res = await getRequest({
        url: `${basePath}/${row.sheetId}`,
      });
      const sheet = res?.data?.data?.sheet as RateSheetDetailResponseSheet;
      return sheet ?? null;
    },
    enabled: open && !!contractId && !!row.sheetId && !!basePath,
  });

  const { mutate: mutateApproval, isPending: isApproving } = useMutation({
    mutationKey: ["approveRateSheet", contractId, row.id],
    mutationFn: async (action: "approved" | "rejected") => {
      return await postRequest({
        url: `${basePath}/${row.id}/approve`,
        payload: { action, comment: "" },
      });
    },
    onSuccess: (res, action) => {
      toastHandler.success(
        `Rate sheet ${action === "approved" ? "approved" : "rejected"}`,
        (res as any)?.data?.message,
      );
      queryClient.invalidateQueries({ queryKey: ["rate-sheets", contractId, basePath] });
      queryClient.invalidateQueries({
        queryKey: ["rate-sheet-detail", basePath, contractId, row.id],
      });
    },
    onError: (err: any) => {
      toastHandler.error("Failed to update rate sheet status", err);
    },
  });

  const canApprove = isManager && basePath.includes("/manager/contracts");

  const sheet = detailRes as RateSheetDetailResponseSheet | null;
  const files = sheet?.files ?? [];
  const summary = sheet?.summary ?? EMPTY_RATE_SHEET_SUMMARY;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
                  {sheet?.title || row.title || "—"}
                </div>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F]"
              >
                <Share2 className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="h-auto rounded-none border-b w-full border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 justify-start bg-transparent">
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
                  Rate Sheet Summary
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <LabelRow
                      label="Rate Sheet Title"
                      value={sheet?.title || row.title}
                    />
                    <LabelRow
                      label="Amount"
                      value={
                        sheet?.amount !== undefined
                          ? `$${sheet.amount.toLocaleString()}`
                          : row.amount
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <LabelRow label="Submission Date" value={row.submissionDate} />
                    <LabelRow
                      label="Status"
                      value={
                        <span className="rounded-full bg-[#FACC151A] px-3 py-1 text-xs font-semibold text-[#FACC15]">
                          {sheet?.status || row.status}
                        </span>
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#9CA3AF]">
                      Description
                    </div>
                    <div className="text-sm font-medium text-[#111827]">
                      {sheet?.description || "—"}
                    </div>
                  </div>
                  {detailLoading ? (
                    <div className="text-sm text-[#6B7280]">Loading attachments...</div>
                  ) : files.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-[#0F0F0F]">
                        Attachment
                      </div>
                      <div className="space-y-3">
                        {files.map((file, index) => {
                          const ext = getSimpleFileExtension(
                            file?.name || "",
                          ).toUpperCase();
                          const d: DocType = {
                            id: `${file?.name || "attachment"}-${index}`,
                            name: file?.name || "Attachment",
                            type: ext,
                            size:
                              typeof file?.size === "number"
                                ? `${file.size} B`
                                : "—",
                            url: file?.url,
                            icon: getFileIcon(ext),
                          };
                          return (
                            <DocumentItem
                              key={d.id}
                              d={d}
                              handlePreview={() => {
                                window.open(d.url || "#", "_blank");
                              }}
                              handleDownload={() => {
                                if (!d.url) return;
                                const link = document.createElement("a");
                                link.href = d.url;
                                link.download = d.name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-[#6B7280]">No attachments.</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="summary">
                <RateSheetSummaryTab detailLoading={detailLoading} summary={summary} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-xl border-[#E5E7EB] text-sm font-semibold text-[#111827]"
              disabled={!canApprove || isApproving}
              onClick={() => {
                if (!canApprove) {
                  toastHandler.error("Action not allowed", "Only managers can reject rate sheets");
                  return;
                }
                mutateApproval("rejected");
              }}
            >
              Reject Change
            </Button>
            <Button
              className="h-11 flex-1 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white"
              disabled={!canApprove || isApproving}
              onClick={() => {
                if (!canApprove) {
                  toastHandler.error("Action not allowed", "Only managers can approve rate sheets");
                  return;
                }
                mutateApproval("approved");
              }}
            >
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
  const { isVendor, isApprover, isManager, isAdmin, isViewOnly } = useUserRole();

  const basePath = React.useMemo(() => {
    if (isVendor) return `/contract/vendor/contracts/${contractId}/ratesheets`;
    if (isApprover) return `/contract/approver/contracts/${contractId}/ratesheets`;
    if (isManager) return `/contract/manager/contracts/${contractId}/ratesheets`;
    if (isAdmin || isViewOnly)
      return `/contract/user/contracts/${contractId}/ratesheets`;
    return `/contract/user/contracts/${contractId}/ratesheets`;
  }, [contractId, isVendor, isApprover, isManager, isAdmin, isViewOnly]);


  const { data, isLoading } = useQuery({
    queryKey: ["rate-sheets", contractId, basePath],
    queryFn: async () => {
      const res = await getRequest({
        url: basePath,
      });
      const items = (res as any)?.data?.data || [];
      const rows: RateSheetRow[] = items.map((it: any) => ({
        id: it?.rateId || it?._id || "",
        sheetId: it?.sheetId || "",
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
      { accessorKey: "sheetId", header: "Rate ID" },
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
      // { accessorKey: "submissionDate", header: "Submission Date" },
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
                basePath={basePath}
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
    [basePath, contractId],
  );

  return (
    <TabsContent value="rate-sheets" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Rate Sheets</h3>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 rounded-xl px-4">
            Export Report
          </Button>
          {isVendor && (
            <SubmitRateSheetDialog
              contractId={contractId}
              queryKeyPath={basePath}
              trigger={
                <Button className="h-10 rounded-xl bg-[#2A4467] px-4 text-sm font-semibold text-white hover:bg-[#2A4467]/90">
                  Submit Rate Sheet
                </Button>
              }
            />
          )}
        </div>
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
