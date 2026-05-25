import React from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Share2, ArrowLeft, Send } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { DocumentItem, type DocType } from "./DocumentItem";
import {
  formatFileSize,
  getFileIcon,
  getSimpleFileExtension,
} from "@/lib/fileUtils";
import Spinner from "@/components/ui/Spinner";
import { useToastHandler } from "@/hooks/useToaster";

type Props = {
  trigger?: React.ReactNode;
  contractId: string;
  claimId: string;
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
    <span className="text-sm text-slate-500 block">{label}</span>
    <span
      className={`text-sm block ${
        highlight ? "font-semibold text-slate-900" : "text-slate-800"
      }`}
    >
      {value}
    </span>
  </div>
);

const ClaimDetailsSheet: React.FC<Props> = ({
  trigger,
  contractId,
  claimId,
  basePath,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}) => {
  const {
    isManager,
    isApprover,
    isVendor,
    isProjectManager,
    isAdmin,
    isViewOnly,
  } = useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [comment, setComment] = React.useState("");
  const queryClient = useQueryClient();
  const toast = useToastHandler();

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  const roleBasePath = React.useMemo(() => {
    if (basePath) return basePath;
    if (isContractVendorLike)
      return `/contract/vendor/contracts/${contractId}/claims`;
    if (isApprover) return `/contract/approver/contracts/${contractId}/claims`;
    if (isManager) return `/contract/manager/contracts/${contractId}/claims`;
    if (isAdmin || isViewOnly)
      return `/contract/user/contracts/${contractId}/claims`;
    return `/contract/user/contracts/${contractId}/claims`;
  }, [
    basePath,
    isManager,
    isApprover,
    isContractVendorLike,
    isAdmin,
    isViewOnly,
    contractId,
  ]);

  const claimDetailQueryKey = useUserQueryKey([
    "contract-claim-detail",
    roleBasePath,
    contractId,
    claimId,
  ]);

  const { data: detailRes, isLoading: isDetailLoading } = useQuery({
    queryKey: claimDetailQueryKey,
    queryFn: async () => {
      const url = `${roleBasePath}/${claimId}`;
      const res = await getRequest({ url });
      return (res as any)?.data;
    },
    enabled: open && !!contractId && !!claimId,
    staleTime: 60_000,
  });

  const commentsQueryKey = useUserQueryKey([
    "contract-claim-comments",
    roleBasePath,
    claimId,
  ]);

  const { data: commentsRes } = useQuery({
    queryKey: commentsQueryKey,
    queryFn: async () => {
      const url = `${roleBasePath}/${claimId}/comment`;
      const res = await getRequest({ url });
      return (res as any)?.data;
    },
    enabled: open && !!contractId && !!claimId && isContractVendorLike,
    staleTime: 60_000,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      const url = `${roleBasePath}/${claimId}/comment`;
      return await postRequest({ url, payload: { comment: commentText } });
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: commentsQueryKey });
      toast.success("Success", "Comment added successfully");
    },
    onError: (error: any) => {
      toast.error(
        "Error",
        error?.response?.data?.message ?? "Failed to add comment",
      );
    },
  });

  const comments = commentsRes ?? [];

  const detail = (detailRes as any)?.data ?? (detailRes as any);

  const title = detail?.title ?? "—";
  const description = detail?.description ?? "—";
  const claimType = detail?.type ?? "—";
  const status = detail?.status ?? "—";
  const impact = detail?.impact ?? "—";
  const time = detail?.time;
  const cost = detail?.cost;
  const files = detail?.files;

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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        className="sm:max-w-2xl lg:max-w-4xl rounded-2xl overflow-auto p-0"
        side="right"
      >
        <div data-testid="claim-details-sheet" className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8"
                  onClick={() => setOpen(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <SheetTitle className="text-xl font-semibold text-slate-900">
                  {title}
                </SheetTitle>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="rounded-full">
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 ml-11">
              <Badge
                variant="secondary"
                className="capitalize text-slate-700 bg-slate-100"
              >
                {status}
              </Badge>
              <span className="text-sm text-slate-500">
                ID: {detail?.claimId ?? claimId}
              </span>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {isDetailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            ) : (
              <>
                <section>
                  <h3 className="text-base font-semibold text-slate-900 mb-4">
                    Claim Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <LabelRow label="Type" value={claimType} />
                    <LabelRow
                      label="Impact"
                      value={impact.replace("_", " ")}
                      highlight
                    />
                    {(impact === "time" || impact === "time_cost") && (
                      <LabelRow
                        label="Time Impact (Days)"
                        value={time ?? "—"}
                      />
                    )}
                    {(impact === "cost" || impact === "time_cost") && (
                      <LabelRow
                        label="Cost Impact"
                        value={cost ? `$${Number(cost).toLocaleString()}` : "—"}
                      />
                    )}
                  </div>
                </section>

                <Separator />

                <section>
                  <h3 className="text-base font-semibold text-slate-900 mb-4">
                    Description
                  </h3>
                  <div className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4 leading-relaxed whitespace-pre-wrap">
                    {description}
                  </div>
                </section>

                {docs.length > 0 && (
                  <>
                    <Separator />
                    <section>
                      <h3 className="text-base font-semibold text-slate-900 mb-4">
                        Supporting Documents ({docs.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {docs.map((d) => (
                          <DocumentItem
                            key={d.id}
                            d={d}
                            handlePreview={handlePreview}
                            handleDownload={handleDownload}
                          />
                        ))}
                      </div>
                    </section>
                  </>
                )}

                {isContractVendorLike && (
                  <>
                    <Separator />
                    <section>
                      <h3 className="text-base font-semibold text-slate-900 mb-4">
                        Comments
                      </h3>
                      {comments.length > 0 ? (
                        <div className="space-y-3 mb-4">
                          {comments.map((c: any, idx: number) => (
                            <div
                              key={c.id || idx}
                              className="bg-slate-50 rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-slate-700">
                                  {c.commentedBy?.name ||
                                    c.commentedBy?.email ||
                                    "User"}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {c.createdAt
                                    ? new Date(c.createdAt).toLocaleDateString()
                                    : ""}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600">
                                {c.comment}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 mb-4">
                          No comments yet.
                        </p>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              comment.trim() &&
                              !addCommentMutation.isPending
                            ) {
                              addCommentMutation.mutate(comment);
                            }
                          }}
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() =>
                            comment.trim() && addCommentMutation.mutate(comment)
                          }
                          disabled={
                            !comment.trim() || addCommentMutation.isPending
                          }
                          className="bg-[#2A4467]"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </section>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ClaimDetailsSheet;
