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
import SendApprovalDialog from "./SendApprovalDialog";
import MessageComposer from "@/pages/SolicitationManagementPage/components/MessageComposer";
import { useUserRole } from "@/hooks/useUserRole";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";
import { DocumentItem, type DocType } from "./DocumentItem";
import {
  formatFileSize,
  getFileIcon,
  getSimpleFileExtension,
} from "@/lib/fileUtils";
import {
  getManagerApproveChangeUrl,
  shouldShowChangeDecisionActions,
} from "../lib/contractChanges";
import { formatDate } from "date-fns";
import Spinner from "@/components/ui/Spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  trigger?: React.ReactNode;
  contractId: string;
  changeId: string;
  basePath?: string;
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

const ChangeDetailsSheet: React.FC<Props> = ({
  trigger,
  contractId,
  changeId,
  basePath,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}) => {
  const toast = useToastHandler();
  const qc = useQueryClient();
  const { isManager, isApprover, isVendor, isProjectManager, isAdmin, isViewOnly } =
    useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;
  const [internalOpen, setInternalOpen] = React.useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  const roleBasePath = React.useMemo(() => {
    if (basePath) return basePath;
    if (isManager) return "/contract/manager/contracts";
    if (isApprover) return "/contract/approver/contracts";
    if (isContractVendorLike) return "/contract/vendor/contracts";
    if (isAdmin || isViewOnly) return "/contract/user/contracts";
    return "/contract/user/contracts";
  }, [basePath, isManager, isApprover, isContractVendorLike, isAdmin, isViewOnly]);

  const isClaim = roleBasePath.includes("/claim");

  const usesListBasePath = React.useMemo(
    () =>
      roleBasePath.endsWith("/changes") ||
      roleBasePath.endsWith("/change") ||
      roleBasePath.endsWith("/claims") ||
      roleBasePath.endsWith("/claim"),
    [roleBasePath],
  );

  const changeDetailQueryKey = React.useMemo(
    () => [isClaim ? "contract-claim-detail" : "contract-change-detail", roleBasePath, contractId, changeId],
    [isClaim, roleBasePath, contractId, changeId],
  );

  const { data: detailRes, isLoading: isDetailLoading } = useQuery({
    queryKey: changeDetailQueryKey,
    queryFn: async () => {
      const url = usesListBasePath
        ? `${roleBasePath}/${changeId}`
        : isClaim
          ? `${roleBasePath}/${contractId}/claims/${changeId}`
          : `${roleBasePath}/${contractId}/changes/${changeId}`;

      const res = await getRequest({ url });
      return (res as any)?.data;
    },
    enabled: open && !!contractId && !!changeId,
    staleTime: 60_000,
  });

  const detail = (detailRes as any)?.data ?? (detailRes as any);

  const title = detail?.title ?? "";
  const description = detail?.description ?? "";
  const submittedByName =
    detail?.submittedBy?.name ?? detail?.submittedBy?.email ?? "";
  const vendorEmail =
    detail?.vendor?.email ?? detail?.vendor?.name ?? detail?.vendor ?? "";
  const changeType = detail?.type ?? "";
  const submittedAt = detail?.submittedAt ?? detail?.createdAt ?? "";
  const status = detail?.status ?? "";
  const approverStatus = detail?.approverStatus ?? "";
  const value = detail?.value;
  const files = detail?.files;
  
  // Claim specific fields
  const impact = detail?.impact;
  const time = detail?.time;
  const cost = detail?.cost;

  const canApprove = isManager;
  const showDecisionActions =
    shouldShowChangeDecisionActions(changeType) && approverStatus === "pending";

  // Approve / reject opens a comment dialog first. `pendingAction` drives
  // both the dialog visibility and which variant (Approve vs Reject) we
  // render — `commentDraft` is reset whenever the dialog closes.
  const [pendingAction, setPendingAction] = React.useState<
    "approved" | "rejected" | null
  >(null);
  const [commentDraft, setCommentDraft] = React.useState("");

  React.useEffect(() => {
    if (pendingAction === null) setCommentDraft("");
  }, [pendingAction]);

  const { mutate: mutateApproval, isPending: isApproving } = useMutation({
    mutationKey: ["approveChange", roleBasePath, contractId, changeId],
    mutationFn: async ({
      action,
      comment,
    }: {
      action: "approved" | "rejected";
      comment: string;
    }) => {
      const canApprovePath = roleBasePath.includes("/manager/");
      if (!canApprovePath) {
        throw new Error(
          "Change approve endpoint is not available for this role.",
        );
      }
      const url = getManagerApproveChangeUrl({
        roleBasePath,
        contractId,
        changeId,
      });
      return await postRequest({
        url,
        payload: { action, comment },
      });
    },
    onSuccess: (res, { action }) => {
      toast.success(
        `Change ${action === "approved" ? "approved" : "rejected"}`,
        (res as any)?.data?.message,
      );
      qc.invalidateQueries({
        queryKey: ["contractChanges", contractId],
      });
      qc.invalidateQueries({ queryKey: changeDetailQueryKey });
      setPendingAction(null);
    },
    onError: (err: any) => {
      toast.error("Failed to update change status", err);
    },
  });

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
    () => ["contract-change-comments", roleBasePath, contractId, changeId],
    [roleBasePath, contractId, changeId],
  );

  const canLoadComments =
    open && !!contractId && !!changeId && (isManager || isApprover || isContractVendorLike);

  const { data: commentsRes, isLoading: isCommentsLoading } = useQuery({
    queryKey: commentsQueryKey,
    queryFn: async () => {
      const url = roleBasePath.includes("/vendor/")
        ? `${roleBasePath}/${changeId}/comment`
        : roleBasePath.includes("/manager/")
          ? usesListBasePath
            ? `${roleBasePath}/${changeId}/comments`
            : `${roleBasePath}/${contractId}/changes/${changeId}/comments`
          : usesListBasePath
            ? `${roleBasePath}/${changeId}/comment`
            : `${roleBasePath}/${contractId}/change/${changeId}/comment`;
      const res = await getRequest({ url });
      return (res as any)?.data;
    },
    enabled: canLoadComments,
    staleTime: 30_000,
  });

  const comments =
    ((commentsRes as any)?.data?.data ?? (commentsRes as any)?.data) || [];

  const { mutate: mutateAddComment, isPending: isAddingComment } = useMutation({
    mutationKey: ["addChangeComment", roleBasePath, contractId, changeId],
    mutationFn: async (content: string) => {
      if (!content.trim()) return;
      const payload = { content };
      const url = roleBasePath.includes("/vendor/")
        ? `${roleBasePath}/${changeId}/comment`
        : roleBasePath.includes("/manager/")
          ? usesListBasePath
            ? `${roleBasePath}/${changeId}/comments`
            : `${roleBasePath}/${contractId}/changes/${changeId}/comments`
          : usesListBasePath
            ? `${roleBasePath}/${changeId}/comment`
            : `${roleBasePath}/${contractId}/change/${changeId}/comment`;
      await postRequest({ url, payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentsQueryKey });
    },
    onError: (err: any) => {
      toast.error("Failed to send comment", err);
    },
  });

  if (isDetailLoading) {
    return (
      <div className="flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        className="sm:max-w-2xl lg:max-w-3xl rounded-2xl overflow-y-auto"
        side="right"
      >
        <div className="space-y-6" data-testid="change-details-sheet">
          <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle>{isClaim ? "Claim Details" : "Change Details"}</SheetTitle>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
            </SheetHeader>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
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
                    <LabelRow label={isClaim ? "Claim Title" : "Change Title"} value={title} />
                    <LabelRow label={isClaim ? "Claim Type" : "Change Type"} value={changeType} />
                    {isClaim && impact && (
                      <LabelRow label="Impact" value={impact.replace("_", " ")} highlight />
                    )}
                    <LabelRow
                      label="Submission Date"
                      value={submittedAt ? formatDate(submittedAt, "yyyy MMM dd HH:mm aa") : null}
                    />
                    <LabelRow
                      label="Submitted by"
                      value={
                        <a className="text-blue-600 dark:text-blue-400 underline">
                          {isDetailLoading ? "" : submittedByName}
                        </a>
                      }
                    />
                  </div>

                  <div>
                    <LabelRow
                      label="Vendor/Contractor"
                      value={
                        <a className="text-blue-600 dark:text-blue-400 underline">
                          {isDetailLoading ? "" : vendorEmail}
                        </a>
                      }
                    />
                    {isClaim ? (
                      <>
                        {(impact === "time" || impact === "time_cost") && (
                          <LabelRow label="Time Impact (Days)" value={time ?? "—"} />
                        )}
                        {(impact === "cost" || impact === "time_cost") && (
                          <LabelRow
                            label="Cost Impact"
                            value={cost != null ? `$${Number(cost).toLocaleString()}` : "—"}
                            highlight
                          />
                        )}
                      </>
                    ) : (
                      <LabelRow
                        label="Value"
                        value={
                          isDetailLoading
                            ? ""
                            : value != null
                              ? `$${(Number(value) / 1000000).toFixed(2)}M`
                              : "-"
                        }
                        highlight
                      />
                    )}
                    <LabelRow
                    label="Status"
                    value={
                      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                        {isDetailLoading
                          ? ""
                          : status
                            ? status.charAt(0).toUpperCase() + status.slice(1)
                            : "-"}
                      </Badge>
                    }
                  />
                  <div className="py-2" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Description</span>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {isDetailLoading ? "" : description}
                </p>
              </div>

              <div className="space-y-5">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Attached Documents
                </span>
                <div className="grid grid-cols-1 gap-3">
                  {docs.map((d) => (
                    <DocumentItem
                      key={d.id}
                      d={d}
                      handlePreview={handlePreview}
                      handleDownload={handleDownload}
                    />
                  ))}
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

          {showDecisionActions && (
            <SheetFooter>
              <div className="flex w-full gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  disabled={!canApprove || isApproving}
                  onClick={() => {
                    if (!canApprove) {
                      toast.error(
                        "Action not allowed",
                        "Only managers can reject changes",
                      );
                      return;
                    }
                    setPendingAction("rejected");
                  }}
                >
                  Reject Change
                </Button>
                {canApprove ? (
                  <Button
                    className="flex-1 h-12 rounded-xl"
                    disabled={isApproving}
                    onClick={() => setPendingAction("approved")}
                  >
                    Approve
                  </Button>
                ) : (
                  <SendApprovalDialog
                    trigger={
                      <Button className="flex-1 h-12 rounded-xl">
                        Send for Approval
                      </Button>
                    }
                  />
                )}
              </div>
            </SheetFooter>
          )}
        </div>

        <Dialog
          open={pendingAction !== null}
          onOpenChange={(next) => {
            if (!next && !isApproving) setPendingAction(null);
          }}
        >
          <DialogContent className="sm:max-w-md p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                {pendingAction === "approved"
                  ? "Approve Change"
                  : "Reject Change"}
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6 space-y-4">
              <p className="text-sm text-[#6B7280] dark:text-slate-400">
                {pendingAction === "approved"
                  ? "Add an optional comment for the vendor before approving."
                  : "Let the vendor know why this change is being rejected (optional)."}
              </p>
              <textarea
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Enter your comment"
                rows={5}
                className="w-full resize-none rounded-lg border border-[#E5E7EB] bg-white p-3 text-sm text-[#0F0F0F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2A4467] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                autoFocus
              />
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-xl border-[#E5E7EB] text-sm font-semibold text-[#111827] dark:text-slate-100"
                  disabled={isApproving}
                  onClick={() => setPendingAction(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className={cn(
                    "h-11 flex-1 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed",
                    pendingAction === "approved"
                      ? "bg-[#16A34A] hover:bg-[#15803D]"
                      : "bg-[#E53935] hover:bg-[#C62828]",
                  )}
                  disabled={isApproving}
                  aria-busy={isApproving}
                  onClick={() => {
                    if (pendingAction === null) return;
                    mutateApproval({
                      action: pendingAction,
                      comment: commentDraft.trim(),
                    });
                  }}
                >
                  {isApproving
                    ? pendingAction === "approved"
                      ? "Approving..."
                      : "Rejecting..."
                    : pendingAction === "approved"
                      ? "Confirm Approve"
                      : "Confirm Reject"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
};

export default ChangeDetailsSheet;
