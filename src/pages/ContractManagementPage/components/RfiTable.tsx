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
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import MessageComposer from "@/pages/SolicitationManagementPage/components/MessageComposer";
import { Forge, Forger, useForge } from "@adexdsamson/forge";
import {
  TextArea,
  TextDatePicker,
  TextFileUploader,
  TextInput,
} from "@/components/layouts/FormInputs";
import {
  ArrowLeft,
  Check,
  CloudUpload,
  Download,
  Edit2,
  Search,
  X,
} from "lucide-react";
import { useFormContext } from "react-hook-form";
import { ContractRfis, type ApiResponseError } from "@/types";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import {
  contractManagerApi,
  // ContractRFIDetailDTO,
  type ContractChangeCommentDTO,
  type ContractCommentDTO,
  // type ContractRfiDTO,
} from "../api/contractManagerApi";
import { approverApi } from "../api/approverApi";
import { vendorApi } from "../api/vendorApi";
import { formatDateTZ } from "@/lib/utils";
import { formatFileSize, getFileExtension, getFileIcon } from "@/lib/fileUtils";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserRole } from "@/hooks/useUserRole";
import { useUser } from "@/store/authSlice";
import { postRequest } from "@/lib/axiosInstance";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
import { DocumentItem, type DocType } from "./DocumentItem";
import { IssueRfiDialog } from "../layouts/RfiTabContent";

// RFI `responder` is a single id (string) or a populated user object/ref —
// see memory project_rfi_responder_singular. Only that specific user
// should see Respond, not every approver on the team.
const getResponderId = (raw: any): string | undefined => {
  const r = raw?.responder;
  if (!r) return undefined;
  if (typeof r === "string") return r;
  if (typeof r?.user === "string") return r.user;
  return r?.user?._id ?? r?._id;
};

const getResponderName = (raw: any): string => {
  const responder = raw?.responder;
  if (!responder) return "-";
  if (typeof responder?.name === "string" && responder.name.trim()) {
    return responder.name;
  }
  if (typeof responder?.user?.name === "string" && responder.user.name.trim()) {
    return responder.user.name;
  }
  if (typeof responder?.email === "string" && responder.email.trim()) {
    return responder.email;
  }
  if (
    typeof responder?.user?.email === "string" &&
    responder.user.email.trim()
  ) {
    return responder.user.email;
  }
  return "-";
};

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
  rfiId: string;
  contractId: string;
  rfi?: ContractRfis;
};

const LabelRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">{label}</div>
    <div className="text-sm font-medium text-[#111827] dark:text-slate-100">{value}</div>
  </div>
);

const getSizeLabel = (size?: string | number) => {
  if (size === undefined || size === null) return "N/A";
  if (typeof size === "number") return formatFileSize(size);
  const numeric = Number(size);
  return Number.isFinite(numeric) ? formatFileSize(numeric) : size;
};

const RfiDetailsSheet: React.FC<RfiDetailsSheetProps> = ({
  trigger,
  rfiId,
  contractId,
  rfi,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const toastHandler = useToastHandler();
  const currentUser = useUser();
  const { isApprover, isVendor, isProjectManager } = useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;
  const roleNs = isApprover
    ? "approver"
    : isContractVendorLike
      ? "vendor"
      : "contractManager";
  const queryKey = useUserQueryKey([
    roleNs,
    "contractRfis",
    "detail",
    rfiId,
  ]);
  const commentsQueryKey = useUserQueryKey([
    roleNs,
    "contractRfis",
    "comments",
    contractId,
    rfiId,
  ]);

  const { data: rfiDetailRes } = useQuery({
    queryKey,
    queryFn: async () =>
      isApprover
        ? await approverApi.getRfiDetail(rfiId, contractId)
        : isContractVendorLike
          ? await vendorApi.getRfiDetail(contractId, rfiId)
          : await contractManagerApi.getRfiDetail(contractId, rfiId),
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
        : isContractVendorLike
          ? await vendorApi.listRfiComments(contractId, rfiId)
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
      roleNs,
      "contractRfis",
      "comments",
      "add",
      contractId,
      rfiId,
    ],
    mutationFn: async (payload) =>
      isApprover
        ? await approverApi.addRfiComment(contractId, rfiId, payload)
        : isContractVendorLike
          ? await vendorApi.addRfiComment(contractId, rfiId, payload)
          : await contractManagerApi.addRfiComment(contractId, rfiId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: commentsQueryKey });
    },
    onError: (error) => {
      toastHandler.error("RFI Comment", error);
    },
  });

  const rfiDetail = ((rfiDetailRes?.data as any)?.contractRfi ?? rfiDetailRes?.data ?? rfiDetailRes) as unknown as any;
  const responderId = getResponderId(rfiDetail) ?? getResponderId(rfi);
  const isAssignedResponder =
    Boolean(currentUser?._id) && responderId === currentUser?._id;

  // RFI response is now embedded on the detail DTO (QA #52), so the issuer
  // (Vendor PM) sees it via their own role's detail fetch — no separate,
  // role-gated /response call. `isCurrentResponder`/`hasResponse` are
  // BE-authoritative; fall back to the legacy `isResponse` flag + client-side
  // responder check for older payloads.
  const rfiResponse = (rfiDetail?.response ?? null) as {
    description?: string;
    files?: Array<{ name?: string; url?: string; type?: string; size?: string | number }>;
  } | null;
  const hasResponse = Boolean(
    rfiDetail?.hasResponse ??
      (rfiDetailRes?.data as any)?.isResponse ??
      rfiResponse,
  );
  const canRespond =
    typeof rfiDetail?.isCurrentResponder === "boolean"
      ? rfiDetail.isCurrentResponder
      : !hasResponse && isAssignedResponder;
  const rfiTitle = rfiDetail?.title ?? rfi?.title ?? "-";
  const rfiDescription = rfiDetail?.description ?? rfi?.description ?? "-";
  const rfiStatus = rfi?.status ?? "-";
  // Backend now returns `submittedBy` as a populated user object
  // (`{_id, name, email}`) on both list + detail. Older rows could
  // still be plain strings. Coerce to a string before rendering —
  // otherwise React crashes with "Objects are not valid as a
  // React child".
  const submittedByRaw = rfiDetail?.submittedBy ?? rfi?.submittedBy;
  const rfiSubmittedBy =
    typeof submittedByRaw === "string"
      ? submittedByRaw
      : (submittedByRaw?.name ?? submittedByRaw?.email ?? "-");
  const rfiIdentifier = rfi?.rfiId ?? rfi?._id ?? "-";
  const responderName = getResponderName(rfiDetail) || getResponderName(rfi);

  // Only the RFI issuer may close it, and only while it is still open.
  // Manager uses /rfis (plural); vendor/approver/user use /rfi (singular) —
  // mirror RfiTabContent.getBasePath() and the edit path above.
  const rfiIssuerId =
    typeof submittedByRaw === "object" ? submittedByRaw?._id : undefined;
  const isRfiIssuer =
    Boolean(currentUser?._id) &&
    Boolean(rfiIssuerId) &&
    rfiIssuerId === currentUser?._id;
  // RFI close is singular `/rfi/{id}/close` for ALL roles per docs.json —
  // including manager (which uniquely uses `/rfis` plural for EDIT but `/rfi`
  // for close). Do not reuse the edit base here.
  const rfiRoleBase = isApprover
    ? `/contract/approver/contracts/${contractId}/rfi`
    : isContractVendorLike
      ? `/contract/vendor/contracts/${contractId}/rfi`
      : `/contract/manager/contracts/${contractId}/rfi`;
  const [closeRfiOpen, setCloseRfiOpen] = React.useState(false);
  const closeRfiMutation = useMutation<{ message?: string }, ApiResponseError, void>({
    mutationKey: [roleNs, "contractRfis", "close", contractId, rfiId],
    mutationFn: async () => {
      const res = await postRequest({ url: `${rfiRoleBase}/${rfiId}/close`, payload: {} });
      return res.data as { message?: string };
    },
    onSuccess: async (res) => {
      toastHandler.success("RFI", res?.message ?? "RFI closed");
      setCloseRfiOpen(false);
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toastHandler.error("Close RFI", error);
    },
  });

  const formatDate = (value?: string | Date) =>
    formatDateTZ(value, "dd MMM yyyy");

  const submissionDate = formatDate(rfi?.createdAt);
  const responseDeadline = formatDate(rfiDetail?.deadline ?? rfi?.deadline);

  const statusTone =
    rfiStatus?.toLowerCase() === "open"
      ? "bg-[#DCFCE7] text-[#16A34A] dark:bg-green-900/40 dark:text-green-300"
      : rfiStatus?.toLowerCase() === "closed"
        ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  const files = (rfiDetail?.files ?? rfi?.files ?? []) as Array<{
    name?: string;
    type?: string;
    size?: string | number;
  }>;
  const comments = (rfiCommentsRes?.data?.data ?? []) as Array<
    ContractCommentDTO & {
      createdBy?: { name?: string; email?: string };
    }
  >;

  // console.log({ comments, rfiCommentsRes })

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
                <SheetClose asChild>
                  <button
                    type="button"
                    aria-label="Close RFI details"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] dark:border-slate-700 text-[#111827] dark:text-slate-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </SheetClose>
                <SheetTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                  RFI Details
                </SheetTitle>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                {rfiTitle}
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const issuerId =
                    typeof submittedByRaw === "object"
                      ? submittedByRaw?._id
                      : undefined;
                  const isIssuer =
                    Boolean(currentUser?._id) &&
                    Boolean(issuerId) &&
                    issuerId === currentUser?._id;
                  if (!isIssuer) return null;
                  // Manager uses /rfis (plural); vendor/approver use /rfi
                  // (singular). Match RfiTabContent.getBasePath().
                  const editBase = isApprover
                    ? `/contract/approver/contracts/${contractId}/rfi`
                    : isContractVendorLike
                      ? `/contract/vendor/contracts/${contractId}/rfi`
                      : `/contract/manager/contracts/${contractId}/rfis`;
                  const editPath = `${editBase}/${rfiId}`;
                  const responderInitial =
                    typeof rfiDetail?.responder === "string"
                      ? rfiDetail.responder
                      : (rfiDetail?.responder?.user?._id ??
                          rfiDetail?.responder?._id ??
                          undefined);
                  return (
                    <IssueRfiDialog
                      contractId={contractId}
                      basePath={editBase}
                      mode="edit"
                      rfiId={rfiId}
                      editPath={editPath}
                      detailInvalidateQueryKey={queryKey}
                      initialRfi={{
                        title: rfiTitle,
                        description: rfiDescription,
                        deadline:
                          rfiDetail?.deadline ?? rfi?.deadline ?? undefined,
                        responder: responderInitial,
                        files: (files as any) ?? [],
                      }}
                      trigger={
                        <Button
                          variant="outline"
                          className="h-9 rounded-lg border-[#E5E7EB] dark:border-slate-700 px-3 text-xs font-semibold text-[#0F0F0F] dark:text-slate-100"
                          data-testid="edit-rfi-trigger"
                        >
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </Button>
                      }
                    />
                  );
                })()}
                <Button
                  variant="outline"
                  className="h-9 rounded-lg border-[#E5E7EB] dark:border-slate-700 px-3 text-xs font-semibold text-[#0F0F0F] dark:text-slate-100"
                >
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                {isRfiIssuer && rfiStatus?.toLowerCase() !== "closed" && (
                  <Button
                    variant="outline"
                    className="h-9 rounded-lg border-red-200 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-900/30"
                    data-testid="close-rfi-trigger"
                    onClick={() => setCloseRfiOpen(true)}
                  >
                    Close RFI
                  </Button>
                )}
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 w-full justify-start bg-transparent">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  Overview
                </TabsTrigger>

                {(() => {
                  return hasResponse ? (
                    <TabsTrigger
                      value="response"
                      className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                    >
                      Response
                    </TabsTrigger>
                  ) : null;
                })()}

                <TabsTrigger
                  value="comments"
                  className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                >
                  Comments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <LabelRow label="RFI Title" value={rfiTitle} />
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
                  <LabelRow label="Responder" value={responderName} />
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
                  <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
                    Description
                  </div>
                  <div className="text-sm text-[#374151] dark:text-slate-200">{rfiDescription}</div>
                </div>

                <div className="space-y-3">
                  <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                    Attached Documents
                  </div>
                  <div className="grid gap-3 sm:grid-cols-1">
                    {files.map((file, index) => {
                      const name = file.name ?? "Untitled";
                      const type = getFileExtension(name, file.type ?? "");
                      const d: DocType = {
                        id: `${name}-${index}`,
                        name,
                        type: type || "FILE",
                        size: getSizeLabel(file.size),
                        url: (file as any).url,
                        icon: getFileIcon(type || "FILE"),
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
              </TabsContent>

              <TabsContent value="response" className="space-y-6">
                <RfiResponseContent
                  rfiId={rfiId}
                  contractId={contractId}
                  isApprover={isApprover}
                  response={rfiResponse}
                />
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
                  <div className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 p-4 text-sm text-[#6B7280] dark:text-slate-400">
                    Loading comments...
                  </div>
                ) : comments.length ? (
                  <div className="space-y-4">
                    {comments.map((comment, index) => (
                      <div
                        key={comment._id ?? `${index}`}
                        className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 dark:bg-slate-900 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-[#111827] dark:text-slate-100">
                              {getCommentAuthor(comment)}
                            </div>
                            {getCommentEmail(comment) ? (
                              <div className="text-xs text-[#6B7280] dark:text-slate-400">
                                {getCommentEmail(comment)}
                              </div>
                            ) : null}
                          </div>
                          <div className="text-xs text-[#6B7280] dark:text-slate-400">
                            {formatDateTZ(comment.createdAt, "dd MMM yyyy")}
                          </div>
                        </div>
                        <div
                          className="text-sm text-[#374151] dark:text-slate-200 mt-3 prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: comment.content ?? "",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 p-4 text-sm text-[#6B7280] dark:text-slate-400">
                    No comments yet.
                  </div>
                )}

                <MessageComposer
                  onSend={(content) => {
                    void handleSendComment(content);
                  }}
                  isLoading={addCommentMutation.isPending}
                  replyToUser={
                    rfiSubmittedBy && rfiSubmittedBy !== "-"
                      ? { name: rfiSubmittedBy }
                      : undefined
                  }
                  currentUser={{ name: "You" }}
                  sendType="reply"
                  isNewChat={false}
                  onSendTypeChange={() => {}}
                  sendLabel="Send"
                />
              </TabsContent>
            </Tabs>
          </div>

          {canRespond && (
            <SheetFooter>
              <div className="flex w-full gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-12 rounded-xl">
                  Cancel
                </Button>
                <RespondToRfiDialog
                  rfiId={rfiId}
                  rfi={rfiDetail?.contractRfi}
                  contractId={contractId}
                  trigger={
                    <Button className="flex-1 h-12 rounded-xl">Respond</Button>
                  }
                />
              </div>
            </SheetFooter>
          )}
        </div>
        <ConfirmAlert
          open={closeRfiOpen}
          onClose={(o) => !o && setCloseRfiOpen(false)}
          type="warning"
          title="Close RFI"
          text="Close this RFI? Once closed it can no longer receive a response."
          primaryButtonText="Close RFI"
          secondaryButtonText="Cancel"
          primaryButtonLoading={closeRfiMutation.isPending}
          onPrimaryAction={() => closeRfiMutation.mutate()}
          onSecondaryAction={() => setCloseRfiOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
};

const RfiResponseContent: React.FC<{
  rfiId: string;
  contractId: string;
  isApprover: boolean;
  /** Response embedded on the RFI detail DTO (QA #52). When present it is used
   *  directly — role-agnostic, so the issuer (Vendor PM) sees it too. The
   *  dedicated fetch below only exists for approver/manager and is a fallback
   *  for older payloads. */
  response?: {
    description?: string;
    files?: Array<{ name?: string; url?: string; type?: string; size?: string | number }>;
  } | null;
}> = ({ rfiId, contractId, isApprover, response }) => {
  const { data: respRes } = useQuery({
    queryKey: useUserQueryKey([
      isApprover ? "approver" : "contractManager",
      "contractRfis",
      "response",
      rfiId,
    ]),
    queryFn: async () =>
      isApprover
        ? await approverApi.getRfiResponse(contractId, rfiId)
        : await contractManagerApi.getRfiResponse(contractId, rfiId),
    // Only fetch when the detail didn't already embed the response, so we don't
    // fire a role-gated call that 403s for the issuer (Vendor PM).
    enabled: Boolean(rfiId) && !response,
    staleTime: 60000,
  });

  const fetched = Array.isArray(respRes?.data)
    ? (respRes.data[0] ?? {})
    : (respRes?.data ?? {});
  const resp = response ?? fetched;
  const description = resp?.description ?? "-";
  const files = (resp?.files ?? []) as Array<{
    name?: string;
    url?: string;
    type?: string;
    size?: string | number;
  }>;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
          Response / Description
        </div>
        <div className="text-sm text-[#374151] dark:text-slate-200">{description}</div>
      </div>
      <div className="space-y-3">
        <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
          Attached Documents
        </div>
        <div className="grid gap-3 sm:grid-cols-1">
          {files.map((file, index) => {
            const name = file.name ?? "Untitled";
            const type = getFileExtension(name, file.type ?? "");
            const d: DocType = {
              id: `${name}-${index}`,
              name,
              type: type || "FILE",
              size: getSizeLabel(file.size),
              url: file.url,
              icon: getFileIcon(type || "FILE"),
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
    </div>
  );
};

function RespondFileListItem({ file }: { file: File }) {
  const { setValue, getValues } = useFormContext();
  const handleRemove = () => {
    const current = (getValues("files") as File[] | undefined) || [];
    setValue(
      "files",
      current.filter((f: File) => f.name !== file.name) as any,
    );
  };
  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#EAF1FB]">
          <CloudUpload className="h-5 w-5 text-[#2A4467]" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-[#0F0F0F]">
            {file.name}
          </div>
          <div className="text-xs font-medium text-[#9CA3AF]">
            {formatFileSize(file.size)}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={handleRemove}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[#9CA3AF]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

const RespondToRfiDialog: React.FC<RespondToRfiDialogProps> = ({
  trigger,
  rfiId,
  rfi,
  contractId,
}) => {
  const { isApprover, isVendor, isProjectManager } = useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;
  const toastHandler = useToastHandler();
  const queryClient = useQueryClient();

  const { control, reset, setValue } = useForge({
    defaultValues: {
      rfiTitle: rfi?.title ?? "",
      responseDeadline: rfi?.deadline,
      responseDescription: "",
      files: null as File[] | null,
    },
  });
  const [isSuccess, setIsSuccess] = React.useState(false);

  React.useEffect(() => {
    if (rfi) {
      setValue("rfiTitle", rfi?.title ?? "", { shouldValidate: false });
      setValue("responseDeadline", rfi?.deadline, { shouldValidate: false });
      // setValue("responseDescription", rfi?.description ?? "", { shouldValidate: false });
    }
  }, [rfi, setValue]);

  const uploadFiles = async (
    files: File[] | null,
  ): Promise<
    Array<{
      name: string;
      url: string;
      type: string;
      size: string;
      download?: string;
    }>
  > => {
    if (!files || files.length === 0) return [];
    const formData = new FormData();
    files.forEach((file) => formData.append("file", file));
    const res = (await postRequest({
      url: "/upload",
      payload: formData,
      config: { headers: { "Content-Type": "multipart/form-data" } },
    })) as any;
    return res?.data?.data ?? [];
  };

  const respondMutation = useMutation({
    mutationKey: ["approver", "contractRfis", "respond", rfiId],
    mutationFn: async (data: {
      responseDescription: string;
      files: File[] | null;
    }) => {
      const uploaded = await uploadFiles(data.files);
      const payload = {
        description: data.responseDescription,
        files:
          uploaded && uploaded.length > 0
            ? uploaded.map((f) => ({
                name: f.name,
                url: f.url,
                type: f.type,
                size: f.size,
              }))
            : undefined,
      };
      return isApprover
        ? await approverApi.createRfiResponse(contractId, rfiId, payload as any)
        : isContractVendorLike
          ? await vendorApi.createRfiResponse(contractId, rfiId, payload as any)
          : await contractManagerApi.createRfiResponse(
              contractId,
              rfiId,
              payload as any,
            );
    },
    onSuccess: async () => {
      setIsSuccess(true);
      await queryClient.invalidateQueries({
        queryKey: ["approver", "contractRfis", "detail", rfiId],
      });
      // Refresh the RFI list + stats so the row's status/action update
      // (list/stats use the ["contractRfis", ...] prefix, not ["approver", ...]).
      await queryClient.invalidateQueries({
        queryKey: ["contractRfis"],
      });
    },
    onError: (error: ApiResponseError) => {
      toastHandler.error("RFI Response", error);
    },
  });

  const handleSubmit = async (data: {
    responseDescription: string;
    files: File[] | null;
  }) => {
    try {
      await respondMutation.mutateAsync({
        responseDescription: data.responseDescription,
        files: data.files,
      });
    } catch {
      return;
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setIsSuccess(false);
          reset();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        {isSuccess ? (
          <div className="flex flex-col items-center gap-6 px-8 py-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full">
              <Check className="h-16 w-16 text-green-600" />
            </div>
            <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
              RFI Issued Successfully
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
              <DialogTitle className="text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">
                Respond to RFI
              </DialogTitle>
            </div>
            <div className="px-8 pb-8 pt-6">
              <Forge
                control={control}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <Forger
                  name="rfiTitle"
                  label="RFI Title"
                  placeholder="Enter Title"
                  component={TextInput}
                  disabled
                />
                <Forger
                  name="responseDeadline"
                  label="Response Deadline"
                  placeholder="Enter Date"
                  component={TextDatePicker}
                  disabled
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
                      <CloudUpload className="h-12 w-12 text-[#2A4467] dark:text-slate-300" />
                      <div className="space-y-1 text-center">
                        <p className="text-base font-semibold text-[#2A4467] dark:text-slate-100">
                          Drag & Drop or Click to choose files
                        </p>
                        <p className="text-sm text-[#6B7280] dark:text-slate-400">
                          Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG,
                          JPEG
                        </p>
                      </div>
                    </div>
                  }
                  List={RespondFileListItem}
                  className="rounded-xl border-2 border-dashed border-[#9CA3AF] bg-white dark:border-slate-600 dark:bg-slate-900"
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
                <div className="flex items-center gap-4 pt-2">
                  <DialogClose asChild>
                    <button
                      type="button"
                      className="h-12 min-w-20 flex-1 rounded-xl border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F] hover:bg-[#E5E7EB]"
                    >
                      Cancel
                    </button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={respondMutation.isPending}
                    className="h-12 flex-1 rounded-xl bg-[#2A4467] text-base font-semibold text-white hover:bg-[#1f3552]"
                  >
                    {respondMutation.isPending
                      ? "Submitting..."
                      : "Respond to RFI"}
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
  { accessorKey: "rfiId", header: "RFI ID" },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ getValue }) => (
      <div className="max-w-[260px] text-sm text-slate-700 dark:text-slate-200">
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
          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
          : s === "closed"
            ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
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
    cell: ({ row }) => <RfiRowActions row={row.original} />,
  },
];

const RfiRowActions: React.FC<{ row: RfiRow }> = ({ row }) => {
  const currentUser = useUser();
  const responderId = getResponderId(row.rfi);
  const isAssignedResponder =
    Boolean(currentUser?._id) && responderId === currentUser?._id;

  return (
    <div className="flex items-center justify-end gap-3">
      <RfiDetailsSheet
        rfiId={row.id}
        contractId={row.contractId ?? ""}
        rfi={row.rfi}
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
      {row.type === "received" && row.status !== "closed" && isAssignedResponder && (
        <RespondToRfiDialog
          rfiId={row.id}
          rfi={row.rfi}
          contractId={row.contractId ?? ""}
          trigger={
            <button
              type="button"
              data-testid="respond-rfi"
              className="text-sm font-medium text-green-700 hover:underline"
            >
              Respond
            </button>
          }
        />
      )}
    </div>
  );
};

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
      rfiId: rfi.rfiId ?? "-",
      title: rfi.title ?? "-",
      type: (rfi.type as unknown as RfiRow["type"]) ?? "-",
      status: (rfi.status as unknown as RfiRow["status"]) ?? "-",
      rfi,
      contractId: rfi.contractRef ?? "",
    }));
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    if (!search) return tableRows;
    const query = search.toLowerCase();
    return tableRows.filter((row) =>
      [row.id, row.title, row.type].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [search, tableRows]);

  return (
    <div className="space-y-4" data-testid="rfi-table">
      <DataTable<RfiRow>
        data={filteredRows}
        columns={columns}
        header={() => (
          <div className="flex items-center gap-3 w-full border-b border-[#E5E7EB] dark:border-slate-800 px-5 py-4">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">RFI</span>
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
          container: "border border-[#E5E7EB] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900",
          tHeader: "bg-[#F9FAFB] dark:bg-slate-800",
          tHeadRow: "border-b border-[#E5E7EB] dark:border-slate-800",
          tBody: "bg-white dark:bg-slate-900",
          tRow: "border-b border-[#E5E7EB] dark:border-slate-800",
          tHead: "px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400",
          tCell: "px-6 py-4 text-sm text-slate-700 dark:text-slate-200 align-top",
        }}
      />
    </div>
  );
};

export default RfiTable;
