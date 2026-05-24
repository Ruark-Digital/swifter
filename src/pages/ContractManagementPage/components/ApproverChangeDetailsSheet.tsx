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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import MessageComposer from "@/pages/SolicitationManagementPage/components/MessageComposer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastHandler } from "@/hooks/useToaster";
import { DocumentItem, type DocType } from "./DocumentItem";
import { formatFileSize, getFileIcon, getSimpleFileExtension } from "@/lib/fileUtils";
import { formatDate } from "date-fns";
import { approverApi } from "../api/approverApi";
import type { ApprovalActionDTO } from "../api/approverApi";

type Props = {
  trigger: React.ReactNode;
  contractId: string;
  changeId: string;
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
  <div className="space-y-2 py-3">
    <span className="text-sm text-slate-500 dark:text-slate-400 block">{label}</span>
    <span
      className={`text-sm block ${
        highlight
          ? "font-semibold text-slate-900 dark:text-slate-100"
          : "text-slate-800 dark:text-slate-200"
      }`}
    >
      {value}
    </span>
  </div>
);

const ApproverChangeDetailsSheet: React.FC<Props> = ({
  trigger,
  contractId,
  changeId,
}) => {
  const toast = useToastHandler();
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const changeDetailQueryKey = React.useMemo(
    () => ["approver-change-detail", contractId, changeId],
    [contractId, changeId],
  );

  const { data: detailRes, isLoading: isDetailLoading } = useQuery({
    queryKey: changeDetailQueryKey,
    queryFn: async () => {
      const res = await approverApi.getChangeDetail(contractId, changeId);
      return res;
    },
    enabled: open && !!contractId && !!changeId,
    staleTime: 60_000,
  });

  const detail = detailRes?.data as any;

  const title = detail?.title ?? "";
  const description = detail?.description ?? "";
  const changeTypeRaw = detail?.type ?? "";
  const status = detail?.status ?? "";
  const approverStatus = detail?.approverStatus ?? "";
  const value = detail?.value;
  const files = detail?.files;
  const impactType = detail?.impactType ?? "";
  const prevDate = detail?.previousDate ?? detail?.prevExpiryDate ?? "";
  const newDate = detail?.newDate ?? detail?.newExpiryDate ?? "";

  const docs: DocType[] = React.useMemo(() => {
    const source = Array.isArray(files) ? files : [];
    return source.map((file: any, index: number) => {
      const ext = getSimpleFileExtension(file?.name || "").toUpperCase();
      const rawSize = file?.size;
      const sizeLabel =
        typeof rawSize === "number"
          ? formatFileSize(rawSize)
          : typeof rawSize === "string" && Number.isFinite(Number(rawSize))
            ? formatFileSize(Number(rawSize))
            : typeof rawSize === "string"
              ? rawSize
              : "—";
      return {
        id: `${file?.name || "attachment"}-${index}`,
        name: file?.name || "Attachment",
        type: ext,
        size: sizeLabel,
        url: file?.url,
        icon: getFileIcon(ext),
      };
    });
  }, [files]);

  const handlePreview = React.useCallback((d: DocType) => {
    window.open(d.url || "#", "_blank");
  }, []);

  const handleDownload = React.useCallback((d: DocType) => {
    if (!d.url) return;
    const link = document.createElement("a");
    link.href = d.url;
    link.download = d.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const commentsQueryKey = React.useMemo(
    () => ["approver-change-comments", contractId, changeId],
    [contractId, changeId],
  );

  const { data: commentsRes, isLoading: isCommentsLoading } = useQuery({
    queryKey: commentsQueryKey,
    queryFn: async () => {
      const res = await approverApi.listChangeComments(contractId, changeId);
      return res;
    },
    enabled: open && !!contractId && !!changeId,
    staleTime: 30_000,
  });

  const comments =
    (commentsRes as any)?.data?.data ?? (commentsRes as any)?.data ?? [];

  const { mutate: mutateAddComment, isPending: isAddingComment } = useMutation({
    mutationKey: ["approver-add-change-comment", contractId, changeId],
    mutationFn: async (content: string) => {
      if (!content.trim()) return;
      await approverApi.addChangeComment(contractId, changeId, { content });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentsQueryKey });
    },
    onError: (err: any) => {
      toast.error("Failed to send comment", err?.message ?? "Unknown error");
    },
  });

  const { mutate: mutateApproval, isPending: isApproving } = useMutation({
    mutationKey: ["approver-approve-change", contractId, changeId],
    mutationFn: async (action: "approved" | "rejected") => {
      const payload: ApprovalActionDTO = { action, comment: "" };
      const res = await approverApi.approveChange(contractId, changeId, payload);
      return res;
    },
    onSuccess: (res, action) => {
      toast.success(
        `Change ${action === "approved" ? "approved" : "rejected"}`,
        (res as any)?.message ?? "",
      );
      qc.invalidateQueries({ queryKey: changeDetailQueryKey });
      qc.invalidateQueries({ queryKey: commentsQueryKey });
    },
    onError: (err: any) => {
      toast.error(
        "Failed to update change status",
        err?.message ?? "Unknown error",
      );
    },
  });

  const isPending = approverStatus === "pending";
  const formattedValue =
    value != null ? `$${(Number(value) / 1000000).toFixed(2)}M` : null;
  const showTimeFields =
    impactType === "time" || impactType === "time & cost" || impactType === "time_and_cost";
  const showCostField =
    impactType === "cost" || impactType === "time & cost" || impactType === "time_and_cost";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        className="sm:max-w-2xl lg:max-w-3xl rounded-2xl overflow-y-auto"
        side="right"
      >
        <div className="space-y-6" data-testid="approver-change-details-sheet">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Change Details</SheetTitle>
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </SheetHeader>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {isDetailLoading ? "" : title}
          </h3>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="h-auto rounded-none border-b w-full border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 justify-start bg-transparent">
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

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <LabelRow label="Change Name" value={isDetailLoading ? "" : title} />
                  <LabelRow label="Change ID" value={isDetailLoading ? "" : (detail?.changeId ?? "-")} />
                </div>
                <div>
                  <LabelRow label="Impact Type" value={isDetailLoading ? "" : (changeTypeRaw ? changeTypeRaw.charAt(0).toUpperCase() + changeTypeRaw.slice(1) : "-")} />
                  {showTimeFields && (
                    <LabelRow
                      label="Prev. Expiry/Delivery/Completion Date"
                      value={
                        isDetailLoading
                          ? ""
                          : prevDate
                            ? formatDate(new Date(prevDate), "yyyy MMM dd")
                            : "-"
                      }
                    />
                  )}
                  {showCostField && formattedValue && (
                    <LabelRow label="Value" value={isDetailLoading ? "" : formattedValue} highlight />
                  )}
                </div>
              </div>

              {showTimeFields && (
                <div className="grid grid-cols-2 gap-6">
                  <LabelRow
                    label="New Expiry/Delivery/Completion Date"
                    value={
                      isDetailLoading
                        ? ""
                        : newDate
                          ? formatDate(new Date(newDate), "yyyy MMM dd")
                          : "-"
                    }
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <LabelRow
                  label="Status"
                  value={
                    isDetailLoading ? (
                      ""
                    ) : status ? (
                      <Badge
                        className={
                          status === "approved"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : status === "rejected"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                        }
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    ) : (
                      "-"
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Description</span>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-7">
                  {isDetailLoading ? "" : description || "—"}
                </p>
              </div>

              <div className="space-y-5">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Attached Documents
                </span>
                <div className="grid grid-cols-1 gap-3">
                  {docs.length > 0 ? (
                    docs.map((d) => (
                      <DocumentItem
                        key={d.id}
                        d={d}
                        handlePreview={handlePreview}
                        handleDownload={handleDownload}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No documents attached.</p>
                  )}
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

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                {isCommentsLoading ? (
                  <p className="text-sm text-slate-700 dark:text-slate-300">Loading comments...</p>
                ) : Array.isArray(comments) && comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((c: any) => (
                      <div key={c?._id} className="space-y-1">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {(c?.user?.name || c?.user?.email || "").toString()}
                        </div>
                        <div
                          className="text-sm text-slate-700 dark:text-slate-200 prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: c?.content || "" }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-700 dark:text-slate-300">No comments yet.</p>
                )}
              </div>

              <MessageComposer
                onSend={(content) => {
                  mutateAddComment(content);
                }}
                isLoading={isAddingComment}
                replyToUser={{ name: "Zenith Solution" }}
                currentUser={{ name: "You" }}
                sendType="reply"
                isNewChat={false}
                onSendTypeChange={() => {}}
              />
            </TabsContent>
          </Tabs>

          {isPending && (
            <SheetFooter>
              <div className="flex w-full gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  disabled={isApproving}
                  onClick={() => mutateApproval("rejected")}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl bg-[#2A4467] hover:bg-[#1e3552] text-white"
                  disabled={isApproving}
                  onClick={() => mutateApproval("approved")}
                >
                  Approve
                </Button>
              </div>
            </SheetFooter>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ApproverChangeDetailsSheet;
