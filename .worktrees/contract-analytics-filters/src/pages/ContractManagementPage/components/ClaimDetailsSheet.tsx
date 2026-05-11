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
import { Share2, ArrowLeft } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { DocumentItem, type DocType } from "./DocumentItem";
import {
  formatFileSize,
  getFileIcon,
  getSimpleFileExtension,
} from "@/lib/fileUtils";
import Spinner from "@/components/ui/Spinner";

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
  const { isManager, isApprover, isVendor, isAdmin, isViewOnly } =
    useUserRole();
  const [internalOpen, setInternalOpen] = React.useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  const roleBasePath = React.useMemo(() => {
    if (basePath) return basePath;
    if (isVendor) return `/contract/vendor/contracts/${contractId}/claim`;
    if (isApprover) return `/contract/approver/contracts/${contractId}/claim`;
    if (isManager) return `/contract/manager/contracts/${contractId}/claims`;
    if (isAdmin || isViewOnly)
      return `/contract/user/contracts/${contractId}/claim`;
    return `/contract/user/contracts/${contractId}/claim`;
  }, [
    basePath,
    isManager,
    isApprover,
    isVendor,
    isAdmin,
    isViewOnly,
    contractId,
  ]);

  const claimDetailQueryKey = React.useMemo(
    () => ["contract-claim-detail", roleBasePath, contractId, claimId],
    [roleBasePath, contractId, claimId],
  );

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
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ClaimDetailsSheet;
