import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import MessageComposer from "@/pages/SolicitationManagementPage/components/MessageComposer";
import { Forge, Forger, useForge } from "@/lib/forge";
import {
  TextArea,
  TextDatePicker,
  TextFileUploader,
  TextInput,
} from "@/components/layouts/FormInputs";
import { ArrowLeft, Check, CloudUpload, Download, Eye, Search } from "lucide-react";
import { ContractRfis, type ApiResponseError } from "@/types";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import {
  contractManagerApi,
  type ContractChangeCommentDTO,
  type ContractCommentDTO,
  type ContractRfiDTO,
} from "../api/contractManagerApi";
import { approverApi } from "../api/approverApi";
import { formatDateTZ } from "@/lib/utils";
import { formatFileSize, getFileExtension } from "@/lib/fileUtils";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserRole } from "@/hooks/useUserRole";

export type RfiRow = {
  id: string;
  title: string;
  type: "issue" | "received" | "-";
  status: "closed" | "open" | "-";
  rfi?: ContractRfis;
  contractId?: string;
};

type RfiDetailsSheetProps = {
  trigger: React.ReactNode;
  rfiId: string;
  contractId: string;
  rfi?: ContractRfis;
};

type RespondToRfiDialogProps = {
  trigger: React.ReactNode;
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
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2FF] text-xs font-semibold text-[#3B82F6]">
      {type}
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

const RfiDetailsSheet: React.FC<RfiDetailsSheetProps> = ({
  trigger,
  rfiId,
  contractId,
  rfi,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const toastHandler = useToastHandler();
  const { isApprover } = useUserRole();
  const queryKey = useUserQueryKey([
    isApprover ? "approver" : "contractManager",
    "contractRfis",
    "detail",
    rfiId,
  ]);
  const commentsQueryKey = useUserQueryKey([
    isApprover ? "approver" : "contractManager",
    "contractRfis",
    "comments",
    contractId,
    rfiId,
  ]);

  const { data: rfiDetailRes } = useQuery<
    { message?: string; data?: ContractRfiDTO },
    ApiResponseError
  >({
    queryKey,
    queryFn: async () =>
      isApprover
        ? await approverApi.getRfiDetail(rfiId)
        : await contractManagerApi.getRfiDetail(rfiId),
    enabled: Boolean(rfiId) && isOpen,
    staleTime: 60000,
  });

  const { data: rfiCommentsRes, isLoading: isCommentsLoading } = useQuery<
    {
      message?: string;
      data?: { data?: ContractCommentDTO[]; page?: number; limit?: number };
    },
    ApiResponseError
  >({
    queryKey: commentsQueryKey,
    queryFn: async () =>
      isApprover
        ? await approverApi.listRfiComments(contractId, rfiId)
        : await contractManagerApi.listRfiComments(contractId, rfiId),
    enabled: Boolean(contractId) && Boolean(rfiId) && isOpen,
    staleTime: 60000,
  });

  const addCommentMutation = useMutation<
    { message?: string; data?: ContractCommentDTO },
    ApiResponseError,
    ContractChangeCommentDTO
  >({
    mutationKey: [
      isApprover ? "approver" : "contractManager",
      "contractRfis",
      "comments",
      "add",
      contractId,
      rfiId,
    ],
    mutationFn: async (payload) =>
      isApprover
        ? await approverApi.addRfiComment(contractId, rfiId, payload)
        : await contractManagerApi.addRfiComment(contractId, rfiId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: commentsQueryKey });
    },
    onError: (error) => {
      toastHandler.error("RFI Comment", error);
    },
  });

  const rfiDetail = rfiDetailRes?.data;
  const rfiTitle = rfiDetail?.title ?? rfi?.title ?? "-";
  const rfiDescription = rfiDetail?.description ?? rfi?.description ?? "-";
  const rfiStatus = rfi?.status ?? "-";
  const rfiSubmittedBy = rfi?.submittedBy ?? "-";
  const rfiIdentifier = rfi?.rfiId ?? rfi?._id ?? "-";
  const formatDate = (value?: string | Date) =>
    formatDateTZ(value, "MMMM dd, yyyy");
  const submissionDate = formatDate(rfi?.createdAt);
  const responseDeadline = formatDate(rfiDetail?.deadline ?? rfi?.deadline);

  const statusTone =
    rfiStatus?.toLowerCase() === "open"
      ? "bg-[#DCFCE7] text-[#16A34A]"
      : rfiStatus?.toLowerCase() === "closed"
        ? "bg-red-100 text-red-600"
        : "bg-slate-100 text-slate-700";

  const files =
    (rfiDetail?.files ?? rfi?.files ?? []) as Array<{
      name?: string;
      type?: string;
      size?: string | number;
    }>;
  const comments = (rfiCommentsRes?.data?.data ?? []) as Array<
    ContractCommentDTO & {
      createdBy?: { name?: string; email?: string };
    }
  >;

  const getSizeLabel = (size?: string | number) => {
    if (size === undefined || size === null) return "N/A";
    if (typeof size === "number") return formatFileSize(size);
    const numeric = Number(size);
    return Number.isFinite(numeric) ? formatFileSize(numeric) : size;
  };

  const getCommentAuthor = (comment: ContractCommentDTO) =>
    comment.user?.name ??
    (comment as { createdBy?: { name?: string } }).createdBy?.name ??
    comment.replyTo?.name ??
    "Unknown";

  const getCommentEmail = (comment: ContractCommentDTO) =>
    comment.user?.email ??
    (comment as { createdBy?: { email?: string } }).createdBy?.email ??
    comment.replyTo?.email ??
    "";

  const handleSendComment = async (content: string) => {
    if (!content.trim()) return;
    if (!contractId || !rfiId) return;
    try {
      await addCommentMutation.mutateAsync({ content });
    } catch {
      return;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl rounded-2xl overflow-y-auto [&>button]:hidden"
      >
        <div className="space-y-6" data-testid="rfi-details-sheet">
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
                  RFI Details
                </SheetTitle>
              </div>
              
            </div>
          </SheetHeader>

          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="text-base font-semibold text-[#0F0F0F]">
                {rfiTitle}
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F]"
              >
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 w-full justify-start bg-transparent">
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

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <LabelRow
                    label="RFI Title"
                    value={rfiTitle}
                  />
                  <LabelRow
                    label="Submitted by"
                    value={
                      <a className="text-[#2563EB] underline">
                        {rfiSubmittedBy}
                      </a>
                    }
                  />
                  <LabelRow label="RFI ID" value={rfiIdentifier} />
                  <LabelRow label="Submission Date" value={submissionDate} />
                  <LabelRow
                    label="Response Deadline"
                    value={responseDeadline}
                  />
                  <LabelRow
                    label="Status"
                    value={
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}
                      >
                        {rfiStatus || "-"}
                      </span>
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#9CA3AF]">
                    Description
                  </div>
                  <div className="text-sm text-[#374151]">
                    {rfiDescription}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-base font-semibold text-[#0F0F0F]">
                    Attached Documents
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {files.map((file, index) => {
                      const name = file.name ?? "Untitled";
                      const type = getFileExtension(name, file.type ?? "");
                      return (
                        <DocCard
                          key={`${name}-${index}`}
                          name={name}
                          type={type || "FILE"}
                          size={getSizeLabel(file.size)}
                        />
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled>All</DropdownMenuItem>
                      <DropdownMenuItem disabled>Unread</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Separator />

                {isCommentsLoading ? (
                  <div className="rounded-xl border border-[#E5E7EB] p-4 text-sm text-[#6B7280]">
                    Loading comments...
                  </div>
                ) : comments.length ? (
                  <div className="space-y-4">
                    {comments.map((comment, index) => (
                      <div
                        key={comment._id ?? `${index}`}
                        className="rounded-xl border border-[#E5E7EB] p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-[#111827]">
                              {getCommentAuthor(comment)}
                            </div>
                            {getCommentEmail(comment) ? (
                              <div className="text-xs text-[#6B7280]">
                                {getCommentEmail(comment)}
                              </div>
                            ) : null}
                          </div>
                          <div className="text-xs text-[#6B7280]">
                            {formatDateTZ(comment.createdAt, "MMM dd, yyyy")}
                          </div>
                        </div>
                        <div
                          className="text-sm text-[#374151] mt-3 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: comment.content ?? "",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#E5E7EB] p-4 text-sm text-[#6B7280]">
                    No comments yet.
                  </div>
                )}

                <MessageComposer
                  onSend={(content) => {
                    void handleSendComment(content);
                  }}
                  isLoading={addCommentMutation.isPending}
                  replyToUser={{ name: "Zenith Solution" }}
                  currentUser={{ name: "You" }}
                  sendType="reply"
                  isNewChat={false}
                  onSendTypeChange={() => {}}
                />
              </TabsContent>
            </Tabs>
          </div>

          <SheetFooter>
            <div className="flex w-full gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
              >
                Cancel
              </Button>
              <Button className="flex-1 h-12 rounded-xl">Respond</Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const RespondToRfiDialog: React.FC<RespondToRfiDialogProps> = ({ trigger }) => {
  const { isApprover } = useUserRole();
  const toastHandler = useToastHandler();
  const { control } = useForge({
    defaultValues: {
      rfiTitle: "",
      responseDeadline: undefined,
      responseDescription: "",
      files: null,
    },
  });
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleSubmit = (data: {
    rfiTitle: string;
    responseDeadline?: Date;
    responseDescription: string;
    files: File[] | null;
  }) => {
    void data;
    if (!isApprover) {
      toastHandler.error("RFI Response", {
        message: "Only approvers can respond to RFIs.",
      } as ApiResponseError);
      return;
    }
    setIsSuccess(true);
  };

  const FileListItem = ({ file, control }: { file: File; control: unknown }) => {
    void control;
    return <div className="hidden">{file.name}</div>;
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) setIsSuccess(false);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        {isSuccess ? (
          <div className="flex flex-col items-center gap-6 px-8 py-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#22C55E] text-[#22C55E]">
              <Check className="h-8 w-8" />
            </div>
            <div className="text-base font-semibold text-[#0F0F0F]">
              RFI Response Sent Successfully
            </div>
            <div className="flex w-full items-center gap-4">
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F]"
                >
                  Close
                </button>
              </DialogClose>
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#2A4467] text-base font-semibold text-white"
                >
                  Done
                </button>
              </DialogClose>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-8 pt-8">
              <DialogTitle className="text-xl font-semibold text-[#0F0F0F]">
                Respond to RFI
              </DialogTitle>
            </div>
            <div className="px-8 pb-8 pt-6">
              <Forge control={control} onSubmit={handleSubmit} className="space-y-5">
                <Forger
                  name="rfiTitle"
                  label="RFI Title"
                  placeholder="Enter Title"
                  component={TextInput}
                />
                <Forger
                  name="responseDeadline"
                  label="Response Deadline"
                  placeholder="Enter Date"
                  component={TextDatePicker}
                />
                <Forger
                  name="responseDescription"
                  label="Response / Description"
                  placeholder="Enter Detail"
                  component={TextArea}
                  rows={5}
                />
                <Forger
                  name="files"
                  label="Upload Files"
                  component={TextFileUploader}
                  element={
                    <div className="flex flex-col items-center gap-3">
                      <CloudUpload className="h-12 w-12 text-[#2A4467]" />
                      <div className="space-y-1 text-center">
                        <p className="text-base font-semibold text-[#2A4467]">
                          Drag & Drop or Click to choose files
                        </p>
                        <p className="text-sm text-[#6B7280]">
                          Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
                        </p>
                      </div>
                    </div>
                  }
                  List={FileListItem}
                  className="rounded-xl border border-dashed border-[#2A4467]"
                  accept={
                    {
                      "application/pdf": [".pdf"],
                      "application/msword": [".doc"],
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
                        ".docx",
                      ],
                      "application/vnd.ms-excel": [".xls"],
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
                        ".xlsx",
                      ],
                      "application/zip": [".zip"],
                      "image/png": [".png"],
                      "image/jpeg": [".jpeg", ".jpg"],
                    } as any
                  }
                />
                <div className="flex items-center gap-4 pt-2">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 flex-1 rounded-xl border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F] hover:bg-[#E5E7EB]"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    className="h-12 flex-1 rounded-xl bg-[#2A4467] text-base font-semibold text-white hover:bg-[#1f3552]"
                  >
                    Respond to RFI
                  </Button>
                </div>
              </Forge>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const columns: ColumnDef<RfiRow>[] = [
  { accessorKey: "id", header: "RFI ID" },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ getValue }) => (
      <div className="max-w-[260px] text-sm text-slate-700">
        {getValue<string>()}
      </div>
    ),
  },
  { accessorKey: "type", header: "Type" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue<RfiRow["status"]>();
      const tone =
        s === "open"
          ? "bg-green-100 text-green-700"
          : s === "closed"
            ? "bg-red-100 text-red-600"
            : "bg-slate-100 text-slate-700";
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
    cell: ({ row }) => (
      <div className="text-right">
        {row.original.type === "received" ? (
          <RespondToRfiDialog
            trigger={
              <button
                type="button"
                data-testid="view-rfi-detail"
                className="text-sm font-medium text-green-700 hover:underline"
              >
                Respond
              </button>
            }
          />
        ) : (
          <RfiDetailsSheet
            rfiId={row.original.id}
            contractId={row.original.contractId ?? ""}
            rfi={row.original.rfi}
            trigger={
              <button
                type="button"
                data-testid="view-rfi-detail"
                className="text-sm font-medium text-green-700 hover:underline"
              >
                View
              </button>
            }
          />
        )}
      </div>
    ),
  },
];

type Props = {
  rows?: ContractRfis[];
  isLoading?: boolean;
  totalCount?: number;
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
};

const RfiTable: React.FC<Props> = ({
  rows = [],
  isLoading,
  totalCount,
  pagination,
  setPagination,
}) => {
  const [search, setSearch] = React.useState("");

  const tableRows: RfiRow[] = React.useMemo(() => {
    return rows.map((rfi) => ({
      id: rfi._id ?? "-",
      title: rfi.title ?? "-",
      type: rfi.type as unknown as RfiRow["type"] ?? "-",
      status: rfi.status as unknown as RfiRow["status"] ?? "-",
      rfi,
      contractId: rfi.contractRef ?? "",
    }));
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    if (!search) return tableRows;
    const query = search.toLowerCase();
    return tableRows.filter((row) =>
      [row.id, row.title, row.type].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [search, tableRows]);


  return (
    <div className="space-y-4" data-testid="rfi-table">
      <DataTable<RfiRow>
        data={filteredRows}
        columns={columns}
        header={() => (
          <div className="flex items-center gap-3 w-full border-b border-[#E5E7EB] px-5 py-4">
            <span className="text-sm font-medium text-slate-900">RFI</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search changes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-[260px] pl-9"
              />
            </div>
          </div>
        )}
        options={{
          disableSelection: true,
          isLoading,
          manualPagination: true,
          totalCounts: totalCount ?? filteredRows.length,
          setPagination,
          pagination,
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

export default RfiTable;
