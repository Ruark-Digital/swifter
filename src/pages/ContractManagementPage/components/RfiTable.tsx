import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
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
  SheetClose,
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
import { ArrowLeft, Check, CloudUpload, Download, Eye, Search, X } from "lucide-react";
import type { ContractRfiDTO } from "../api/contractManagerApi";

export type RfiRow = {
  id: string;
  title: string;
  type: "Issued" | "Received" | "-";
  status: "Closed" | "Open" | "-";
};

type RfiDetailsSheetProps = {
  trigger: React.ReactNode;
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
  type: "DOC" | "PDF";
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

const RfiDetailsSheet: React.FC<RfiDetailsSheetProps> = ({ trigger }) => {
  const [isSending, setIsSending] = React.useState(false);

  return (
    <Sheet>
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

          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="text-base font-semibold text-[#0F0F0F]">
                Additional structural reinforcement
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F]"
              >
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-[#E5E7EB] bg-transparent p-0">
                <TabsTrigger
                  value="overview"
                  className="rounded-none border-b-2 border-transparent px-0 pb-2 text-xs font-semibold text-[#6B7280] data-[state=active]:border-[#2A4467] data-[state=active]:text-[#2A4467]"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className="rounded-none border-b-2 border-transparent px-0 pb-2 text-xs font-semibold text-[#6B7280] data-[state=active]:border-[#2A4467] data-[state=active]:text-[#2A4467]"
                >
                  Comments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <LabelRow
                    label="RFI Title"
                    value="Additional structural reinforcement"
                  />
                  <LabelRow
                    label="Submitted by"
                    value={
                      <a className="text-[#2563EB] underline">
                        Olamide Oladehinde
                      </a>
                    }
                  />
                  <LabelRow label="RFI ID" value="RFI-2025-10" />
                  <LabelRow label="Submission Date" value="April 30, 2025" />
                  <LabelRow label="Response Deadline" value="April 30, 2025" />
                  <LabelRow
                    label="Status"
                    value={
                      <span className="inline-flex rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#16A34A]">
                        Open
                      </span>
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#9CA3AF]">
                    Description
                  </div>
                  <div className="text-sm text-[#374151]">
                    Lorem ipsum dolor sit amet consectetur. Volutpat quis egestas
                    nunc egestas ut sed accumsan commodo vitae. Ullamcorper
                    feugiat pulvinar consectetur vel natoque amet enim ac sed.
                    Laoreet fringilla sollicitudin pharetra sit proin dictum. Sit
                    sed lorem mauris.
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-base font-semibold text-[#0F0F0F]">
                    Attached Documents
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DocCard name="RFP_HRSoftware" type="DOC" size="25KB" />
                    <DocCard name="RFP_HRSoftware" type="PDF" size="1MB" />
                    <DocCard name="RFP_HRSoftware" type="DOC" size="25KB" />
                    <DocCard name="RFP_HRSoftware" type="PDF" size="1MB" />
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

                <div className="rounded-xl border border-[#E5E7EB] p-4 text-sm text-[#6B7280]">
                  No comments yet.
                </div>

                <MessageComposer
                  onSend={() => {
                    setIsSending(true);
                    setTimeout(() => setIsSending(false), 600);
                  }}
                  isLoading={isSending}
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
        s === "Open"
          ? "bg-green-100 text-green-700"
          : s === "Closed"
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
        {row.original.type === "Received" ? (
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
  rows?: ContractRfiDTO[];
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
      id: "-",
      title: rfi.title ?? "-",
      type: "-",
      status: "-",
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
          <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-4">
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
