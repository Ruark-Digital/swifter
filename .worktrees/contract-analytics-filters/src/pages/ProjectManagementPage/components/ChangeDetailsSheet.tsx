import React from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Share2, Eye, Download } from "lucide-react";
import { formatFileSize, getFileExtension, getFileIcon } from "@/lib/fileUtils";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import LinkedContractsHeader from "./LinkedContractsHeader";
import {
  useProjectDetail,
  useCompleteProject,
  type Project,
} from "../hooks/useProjectApi";
import { useToastHandler } from "@/hooks/useToaster";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState as GenericEmptyState } from "@/components/ui/empty-state";
import { ApiResponseError } from "@/types";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
import { formatDateTZ } from "@/lib/utils";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import CreateProjectDialog from "./CreateProjectDialog";

type Props = {
  trigger?: React.ReactNode;
  projectId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
  <div className="space-y-3 py-2">
    <span className="text-sm text-slate-500 block">{label}</span>
    <span
      className={`text-sm block ${
        highlight ? "font-semibold text-slate-900" : "text-slate-800 font-bold"
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
  onPreview,
  onDownload,
}: {
  name: string;
  type?: string;
  size: string | number;
  onPreview?: () => void;
  onDownload?: () => void;
}) => {
  const ext = getFileExtension(name, type ?? "");
  const iconEl = getFileIcon(ext);
  const sizeLabel =
    typeof size === "number"
      ? formatFileSize(size)
      : Number.isFinite(Number(size))
      ? formatFileSize(Number(size))
      : size;
  const bg =
    ext === "PDF"
      ? "bg-red-100"
      : ext === "DOC"
      ? "bg-blue-100"
      : ext === "XLS"
      ? "bg-green-100"
      : ext === "PPT"
      ? "bg-orange-100"
      : "bg-slate-100";
  const tone =
    ext === "PDF"
      ? "text-red-700"
      : ext === "DOC"
      ? "text-blue-700"
      : ext === "XLS"
      ? "text-green-700"
      : ext === "PPT"
      ? "text-orange-700"
      : "text-slate-700";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
      <div
        className={`flex items-center justify-center h-12 w-12 rounded ${bg}`}
      >
        {iconEl}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">
          <span className={tone}>{ext}</span> • {sizeLabel}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Preview"
          className="h-9 w-9 rounded-full bg-slate-100 grid place-items-center"
          onClick={onPreview}
        >
          <Eye className="h-4 w-4 text-slate-600" />
        </button>
        <button
          type="button"
          aria-label="Download"
          className="h-9 w-9 rounded-full bg-slate-100 grid place-items-center"
          onClick={onDownload}
        >
          <Download className="h-4 w-4 text-slate-600" />
        </button>
      </div>
    </div>
  );
};

type ProjectFile = NonNullable<Project["files"]>[number];

type ContractRow = {
  id: string;
  title: string;
  code: string;
  vendor: string;
  value?: string;
  owner: string;
  published?: string;
  endDate?: string;
  status: "Active" | "Draft" | "Expired" | "Terminated" | "Suspended";
};

const linkedColumns: ColumnDef<ContractRow>[] = [
  {
    accessorKey: "title",
    header: "Contracts",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <a
          href={`/dashboard/contract-management/${row.original.id}`}
          data-testid="project-name-link"
          className="font-medium text-slate-900 underline-offset-2 hover:underline"
        >
          {row.original.title}
        </a>
        <span className="text-xs text-slate-500">{row.original.code}</span>
      </div>
    ),
  },
  { accessorKey: "vendor", header: "Vendor" },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ getValue }) => {
      const v = getValue<string | undefined>();
      return <span className="font-semibold text-slate-900">{v ?? "-"}</span>;
    },
  },
  { accessorKey: "owner", header: "Owner" },
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="text-xs text-slate-500">
        {row.original.published && (
          <div>Published: {row.original.published}</div>
        )}
        {row.original.endDate && <div>End Date: {row.original.endDate}</div>}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue<ContractRow["status"]>();
      const tone =
        s === "Active"
          ? "bg-green-100 text-green-700"
          : s === "Draft"
          ? "bg-slate-100 text-slate-700"
          : "bg-red-100 text-red-700";
      return (
        <span
          data-testid="contract-status-badge"
          className={`px-2 py-1 rounded-full text-xs font-medium ${tone}`}
        >
          {s}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <a
        href={`/dashboard/contract-management/${row.original.id}`}
        className="text-green-600 font-medium underline-offset-2 hover:underline"
        data-testid="view-contract-link"
      >
        View
      </a>
    ),
  },
];

const ChangeDetailsSheet: React.FC<Props> = ({
  trigger,
  projectId,
  open,
  onOpenChange,
}) => {
  const toast = useToastHandler();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<ProjectFile | null>(
    null
  );
  const [completeConfirmOpen, setCompleteConfirmOpen] = React.useState(false);
  const [editProjectOpen, setEditProjectOpen] = React.useState(false);

  const {
    data: projectRes,
    isLoading: isProjectLoading,
    isError: isProjectError,
    refetch: refetchProject,
  } = useProjectDetail(projectId);

  const completeMutation = useCompleteProject(projectId);

  const project = projectRes?.data?.data;
  const isCompleted = project?.status === "completed";

  const sheetProps =
    typeof open === "boolean" ? { open, onOpenChange } : undefined;

  const handlePreview = React.useCallback(
    (file: ProjectFile) => {
      if (!file?.url) {
        toast.error("Preview", "File URL is missing");
        return;
      }

      setSelectedFile(file);
      setViewerOpen(true);
    },
    [toast]
  );

  const handleDownload = React.useCallback(
    async (file: ProjectFile) => {
      if (!file?.url) {
        toast.error("Download", "File URL is missing");
        return;
      }

      const downloadFromHref = (href: string) => {
        const link = document.createElement("a");
        link.href = href;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      try {
        const res = await fetch(file.url, { credentials: "include" });
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        downloadFromHref(objectUrl);
        window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
      } catch {
        downloadFromHref(file.url);
      }
    },
    [toast]
  );

  return (
    <Sheet {...(sheetProps ?? {})}>
      {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}
      <SheetContent
        className="sm:max-w-2xl lg:max-w-5xl rounded-2xl overflow-auto"
        side="right"
      >
        <div data-testid="change-details-sheet" className="space-y-6">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeft
                  className="h-4 w-4 text-slate-500"
                  aria-hidden="true"
                />
                <SheetTitle className="text-[#2A4467]">
                  Project Details
                </SheetTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
            </div>
          </SheetHeader>

          <h3 className="text-lg font-semibold text-slate-900">
            {projectRes?.data?.data?.name ?? ""}
          </h3>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 w-full justify-start bg-transparent">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="linked"
                className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                Linked Contract
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 ">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  {isProjectLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-64" />
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-6 w-56" />
                    </div>
                  ) : (
                    <>
                      <LabelRow
                        label="Project Name"
                        value={projectRes?.data?.data?.name ?? ""}
                      />
                      <LabelRow
                        label="Budget"
                        value={
                          projectRes?.data?.data?.budget != null
                            ? new Intl.NumberFormat(undefined, {
                                style: "currency",
                                currency: "USD",
                                maximumFractionDigits: 0,
                              }).format(projectRes.data.data.budget)
                            : ""
                        }
                        highlight
                      />
                      <LabelRow
                        label="Start Date"
                        value={
                          projectRes?.data?.data?.startDate
                            ? formatDateTZ(
                                projectRes.data.data.startDate,
                                "MMM d, yyyy"
                              )
                            : ""
                        }
                      />
                      <LabelRow
                        label="Date Created"
                        value={
                          projectRes?.data?.data?.createdAt
                            ? formatDateTZ(
                                projectRes.data.data.createdAt,
                                "MMM d, yyyy"
                              )
                            : ""
                        }
                      />
                      <LabelRow
                        label="Created by"
                        value={
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-normal"
                            href={`mailto:${projectRes?.data?.data?.creator?.email}`}
                          >
                            {projectRes?.data?.data?.creator?.email ?? ""}
                          </a>
                        }
                      />
                    </>
                  )}
                </div>
                <div>
                  {isProjectLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-28" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ) : (
                    <>
                      <LabelRow
                        label="Project Category"
                        value={projectRes?.data?.data?.category ?? ""}
                        highlight
                      />
                      <LabelRow
                        label="EAC"
                        value={
                          projectRes?.data?.data?.budget != null
                            ? new Intl.NumberFormat(undefined, {
                                style: "currency",
                                currency: "USD",
                                maximumFractionDigits: 0,
                              }).format(projectRes.data.data.budget)
                            : ""
                        }
                        highlight
                      />
                      <LabelRow
                        label="End Date"
                        value={
                          projectRes?.data?.data?.endDate
                            ? formatDateTZ(
                                projectRes.data.data.endDate,
                                "MMM d, yyyy"
                              )
                            : ""
                        }
                      />
                      <LabelRow
                        label="Status"
                        value={
                          <Badge
                            className={
                              projectRes?.data?.data?.status === "active"
                                ? "bg-green-100 text-green-700 font-semibold capitalize"
                                : projectRes?.data?.data?.status === "completed"
                                ? "bg-blue-100 text-blue-700 font-semibold capitalize"
                                : "bg-red-100 text-red-700 font-semibold capitalize"
                            }
                          >
                            {projectRes?.data?.data?.status?.replace(/_/g, " ")}
                          </Badge>
                        }
                      />
                      <div className="py-2" />
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-slate-500">Description</span>
                {isProjectLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <p className="text-sm text-slate-800">
                    {projectRes?.data?.data?.description ?? ""}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <span className="text-sm text-slate-800 block font-semibold">
                  Attached Documents
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {projectRes?.data?.data?.files?.map((f) => (
                    <DocCard
                      key={`${f.name}-${f.url}`}
                      name={f.name}
                      type={f.type}
                      size={f.size}
                      onPreview={() => handlePreview(f)}
                      onDownload={() => handleDownload(f)}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="linked" className="space-y-4">
              <DataTable<ContractRow>
                header={() => (
                  <LinkedContractsHeader
                    title="Contracts"
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    dateFilter={dateFilter}
                    statusFilter={statusFilter}
                    onDateFilterChange={setDateFilter}
                    onStatusFilterChange={setStatusFilter}
                  />
                )}
                classNames={{
                  container:
                    "bg-white dark:bg-slate-950 rounded-xl px-3 border border-gray-300 dark:border-slate-600",
                }}
                data={(projectRes?.data?.data?.contract ?? [])
                  .filter((c) =>
                    searchQuery
                      ? c.title
                          ?.toLowerCase?.()
                          .includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((c) => ({
                    id: c._id,
                    title: c.title,
                    code: "",
                    vendor: c.vendor,
                    value:
                      c.totalAmount != null
                        ? new Intl.NumberFormat(undefined, {
                            style: "currency",
                            currency: c.currency ?? "USD",
                            maximumFractionDigits: 0,
                          }).format(c.totalAmount)
                        : undefined,
                    owner: c.creator,
                    published: c.startDate
                      ? formatDateTZ(c.startDate, "MMM d, yyyy")
                      : undefined,
                    endDate: c.endDate
                      ? formatDateTZ(c.endDate, "MMM d, yyyy")
                      : undefined,
                    status: (c.status === "active"
                      ? "Active"
                      : c.status === "draft"
                      ? "Draft"
                      : c.status === "completed"
                      ? "Expired"
                      : "Suspended") as ContractRow["status"],
                  }))}
                columns={linkedColumns}
                options={{
                  disableSelection: true,
                  disablePagination: true,
                  isLoading: isProjectLoading,
                }}
                emptyPlaceholder={
                  <GenericEmptyState
                    title="No Contracts"
                    description="No linked contracts found for this project"
                  />
                }
              />
              {isProjectError && (
                <div className="px-3 py-2 text-sm text-red-600">
                  Failed to load project details
                  <Button variant="link" onClick={() => refetchProject()}>
                    Retry
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {selectedFile && (
            <DocumentViewer
              isOpen={viewerOpen}
              onClose={() => {
                setViewerOpen(false);
                setSelectedFile(null);
              }}
              fileUrl={selectedFile.url}
              fileName={selectedFile.name}
              fileType={selectedFile.type}
            />
          )}

          <SheetFooter>
            <div className="flex w-full gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                data-testid="edit-project-button"
                disabled={!projectId || isCompleted}
                onClick={() => setEditProjectOpen(true)}
              >
                Edit Project
              </Button>
              <ConfirmAlert
                type="info"
                title="Mark project as complete?"
                text="This action will set the project status to completed."
                primaryButtonText="Mark Complete"
                secondaryButtonText="Cancel"
                open={completeConfirmOpen}
                onClose={setCompleteConfirmOpen}
                primaryButtonLoading={completeMutation.isPending}
                onPrimaryAction={async () => {
                  try {
                    const result = await completeMutation.mutateAsync();
                    toast.success(
                      "Project",
                      result?.data?.message ?? "Project marked as complete"
                    );
                    setCompleteConfirmOpen(false);
                  } catch (error) {
                    toast.error("Project", error as ApiResponseError);
                  }
                }}
                trigger={
                  <Button
                    className="flex-1 h-12 rounded-xl"
                    data-testid="mark-complete-button"
                    disabled={
                      !projectId ||
                      projectRes?.data?.data?.status === "completed"
                    }
                  >
                    Mark As Complete
                  </Button>
                }
              />
            </div>
          </SheetFooter>

          <CreateProjectDialog
            open={editProjectOpen}
            onOpenChange={setEditProjectOpen}
            onSuccess={() => {
              refetchProject();
            }}
            title="Edit Project"
            dialogTestId="edit-project-dialog"
            submitButtonText="Save Changes"
            initialValues={{
              name: project?.name,
              category: project?.category,
              description: project?.description,
              budget: project?.budget,
              startDate: project?.startDate ? new Date(project.startDate) : undefined,
              endDate: project?.endDate ? new Date(project.endDate) : undefined,
              allowMultipleContracts: !!project?.allowMultiple,
            }}
            isSubmitting={false}
            onSubmit={async () => {
              toast.error(
                "Project",
                "Project update endpoint is not documented in API docs"
              );
              throw new Error("Project update endpoint is not documented");
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChangeDetailsSheet;
