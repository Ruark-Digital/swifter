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
import { Send } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { DocumentItem, type DocType } from "@/pages/ContractManagementPage/components/DocumentItem";
import {
  formatFileSize,
  getFileIcon,
  getSimpleFileExtension,
} from "@/lib/fileUtils";
import Spinner from "@/components/ui/Spinner";
import { useToastHandler } from "@/hooks/useToaster";
import { cn } from "@/lib/utils";

type Props = {
  claimId?: string;
  contractId: string;
  roleBasePath: string;
  children: React.ReactNode;
};

type Detail = {
  id?: string;
  claimId?: string;
  title?: string;
  description?: string;
  status?: string;
  type?: string;
  time?: number;
  cost?: number;
  createdAt?: string;
  updatedAt?: string;
  documents?: Array<{
    id?: string;
    name?: string;
    url?: string;
    size?: string | number;
    type?: string;
  }>;
};

const statusTone = (status?: string) => {
  const normalized = status?.toLowerCase();
  if (normalized === "approved") return "bg-[#EAF7EE] text-[#43A047]";
  if (normalized === "pending" || normalized === "under review") {
    return "bg-[#FFF8E1] text-[#F4B400]";
  }
  if (normalized === "rejected") return "bg-[#FEECEC] text-[#E53935]";
  return "bg-slate-100 text-slate-700";
};

const MSAClaimDetailsSheet: React.FC<Props> = ({
  claimId,
  contractId,
  roleBasePath,
  children,
}) => {
  const { isVendor, isProjectManager } =
    useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [comment, setComment] = React.useState("");
  const queryClient = useQueryClient();
  const toast = useToastHandler();

  const detailQueryKey = React.useMemo(
    () => ["msa-claim-detail", roleBasePath, claimId],
    [roleBasePath, claimId],
  );

  const { data: detailRes, isLoading: isDetailLoading } = useQuery({
    queryKey: detailQueryKey,
    queryFn: async () => {
      const res = await getRequest({
        url: `${roleBasePath}/${claimId}`,
      });
      return res.data as Detail;
    },
    enabled: internalOpen && !!contractId && !!claimId,
    staleTime: 60_000,
  });

  const commentsQueryKey = React.useMemo(
    () => ["msa-claim-comments", roleBasePath, claimId],
    [roleBasePath, claimId],
  );

  const { data: commentsRes } = useQuery({
    queryKey: commentsQueryKey,
    queryFn: async () => {
      const url = `${roleBasePath}/${claimId}/comment`;
      const res = await getRequest({ url });
      return (res as any)?.data;
    },
    enabled: internalOpen && !!contractId && !!claimId && isContractVendorLike,
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
  const detail = detailRes ?? {};

  const docs: DocType[] = React.useMemo(() => {
    const source = Array.isArray(detail?.documents) ? detail.documents : [];
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
  }, [detail?.documents]);

  const formatImpact = (d: Detail) => {
    const parts: string[] = [];
    if (typeof d.time === "number" && Number.isFinite(d.time)) {
      parts.push(`${d.time} days`);
    }
    if (typeof d.cost === "number" && Number.isFinite(d.cost)) {
      parts.push(`$${(d.cost / 1000000).toFixed(1)}M`);
    }
    return parts.length > 0 ? parts.join(" + ") : "-";
  };

  const handlePreview = (doc: DocType) => {
    if (!doc?.url) return;
    window.open(doc.url, "_blank");
  };

  const handleDownload = (doc: DocType) => {
    if (!doc?.url) return;
    const a = document.createElement("a");
    a.href = doc.url;
    a.download = doc.name ?? "document";
    a.click();
  };

  return (
    <Sheet
      open={internalOpen}
      onOpenChange={(open) => {
        setInternalOpen(open);
        if (!open) {
          queryClient.removeQueries({ queryKey: detailQueryKey });
        }
      }}
    >
      <SheetTrigger asChild onClick={() => setInternalOpen(true)}>
        {children}
      </SheetTrigger>
      <SheetContent
        className="flex w-full flex-col overflow-hidden sm:max-w-[540px]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="flex-none">
          <SheetTitle className="text-base font-semibold text-slate-900">
            Claim Details
          </SheetTitle>
        </SheetHeader>

        {isDetailLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 px-1">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Claim ID</p>
                  <p className="text-base font-medium text-slate-900">
                    {detail.claimId ?? "-"}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "rounded-full border-none px-4 py-1 text-sm font-semibold",
                    statusTone(detail.status),
                  )}
                >
                  {detail.status
                    ? detail.status.charAt(0).toUpperCase() + detail.status.slice(1)
                    : "-"}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-slate-500">Title</p>
                <p className="text-base font-medium text-slate-900">
                  {detail.title ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Description</p>
                <p className="text-base text-slate-700">
                  {detail.description ?? "-"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Type</p>
                  <p className="text-base font-medium text-slate-900">
                    {detail.type ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Impact</p>
                  <p className="text-base font-medium text-slate-900">
                    {formatImpact(detail)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Submitted</p>
                  <p className="text-base text-slate-700">
                    {detail.createdAt
                      ? new Date(detail.createdAt).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Last Updated</p>
                  <p className="text-base text-slate-700">
                    {detail.updatedAt
                      ? new Date(detail.updatedAt).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {docs.length > 0 && (
              <>
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
                <Separator />
              </>
            )}

            {isContractVendorLike && (
              <section>
                <h3 className="text-base font-semibold text-slate-900 mb-4">
                  Comments
                </h3>
                {comments.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {comments.map((c: any, idx: number) => (
                      <div key={c.id || idx} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">
                            {c.commentedBy?.name || c.commentedBy?.email || "User"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{c.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mb-4">No comments yet.</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && comment.trim() && !addCommentMutation.isPending) {
                        addCommentMutation.mutate(comment);
                      }
                    }}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => comment.trim() && addCommentMutation.mutate(comment)}
                    disabled={!comment.trim() || addCommentMutation.isPending}
                    className="bg-[#2A4467]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </section>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MSAClaimDetailsSheet;
