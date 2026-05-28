import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { getRequest } from "@/lib/axiosInstance";
import { getFileIcon } from "@/lib/fileUtils";
import { ContractComplianceDTO } from "../api/contractManagerApi";
import Spinner from "@/components/ui/Spinner";
import { formatSecurityType } from "@/lib/utils";

type PolicyItem = NonNullable<ContractComplianceDTO["policy"]>[number];
type SecurityItem = NonNullable<ContractComplianceDTO["security"]>[number];

interface ComplianceDetailsSheetProps {
  trigger: React.ReactNode;
  type: "policy" | "security";
  id: string;
  contractId: string;
  basePath: string;
  currency?: string;
  data?: PolicyItem | SecurityItem;
  actionsDisabled?: boolean;
}

const LabelValue = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
  </div>
);

const DocumentCard = ({
  name,
  type,
  size,
  url,
}: {
  name: string;
  type: string;
  size: string;
  url?: string;
}) => (
  <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
    <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500">
      {getFileIcon(type)}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{name}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {type.toUpperCase()} • {size}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <a
        href={url || "#"}
        target="_blank"
        rel="noreferrer"
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 transition-colors"
        aria-disabled={!url}
        onClick={(e) => {
          if (!url) e.preventDefault();
        }}
      >
        <Eye className="h-4 w-4" />
      </a>
      <a
        href={url || "#"}
        download
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 transition-colors"
        aria-disabled={!url}
        onClick={(e) => {
          if (!url) e.preventDefault();
        }}
      >
        <Download className="h-4 w-4" />
      </a>
    </div>
  </div>
);

const ComplianceDetailsSheet: React.FC<ComplianceDetailsSheetProps> = ({
  trigger,
  type,
  id,
  contractId,
  basePath,
  currency,
  data,
}) => {
  const { data: complianceRes, isLoading } = useQuery({
    queryKey: useUserQueryKey(["contract-compliance-detail", contractId, basePath]),
    queryFn: async () => {
      const res = await getRequest({ url: basePath });
      return res.data as { data?: ContractComplianceDTO };
    },
    enabled: !!contractId,
  });

  const complianceData = complianceRes?.data;

  const formatMoney = (value: unknown) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "—";
    const locale = "en-US";
    const fractionDigits = 0;
    if (currency) {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
        maximumFractionDigits: fractionDigits,
      }).format(num);
    }
    return num.toLocaleString(locale, {
      maximumFractionDigits: fractionDigits,
    });
  };

  const fetchedDetail = React.useMemo(() => {
    if (data) return data;
    if (!complianceData) return undefined;

    if (type === "policy") {
      return complianceData.policy?.find(
        (p) => p._id === id || p.policyId === id,
      );
    } else {
      return complianceData.security?.find(
        (s) => s._id === id || s.securityTypeId === id,
      );
    }
  }, [data, complianceData, type, id]);

  const detail = (fetchedDetail || data) as any;

  const files = React.useMemo(() => {
    const itemFiles = (detail as { files?: any[] } | undefined)?.files;
    if (itemFiles && itemFiles.length > 0) return itemFiles;

    const details = complianceData?.details;
    if (!details) return [];

    if (type === "policy") {
      return details.policyStatus?.files ?? details.files ?? [];
    }

    const raw = details.securityStatus as unknown;
    if (raw && typeof raw === "object" && "files" in raw) {
      return (raw as { files?: NonNullable<typeof details.files> }).files ?? [];
    }
    return details.files ?? [];
  }, [complianceData?.details, type, detail]);
  const hasFiles = files.length > 0;

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[600px] p-0 border-l-0"
      >
        <SheetHeader className="flex flex-row items-center justify-between p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <SheetClose asChild>
              <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </SheetClose>
            <SheetTitle className="text-base font-bold text-[#2A4467] dark:text-indigo-300">
              {type === "policy" ? "Policy Details" : "Security Details"}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {detail?.policyName || formatSecurityType(detail?.securityType) || ""}
          </h2>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 justify-start bg-transparent w-full">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3 text-sm"
              >
                Overview
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="overview"
              className="pt-6 space-y-6 overflow-auto"
            >
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                <LabelValue
                  label={type === "policy" ? "Policy Name" : "Security Type"}
                  value={
                    type === "policy"
                      ? detail?.policyName || "—"
                      : formatSecurityType(detail?.securityType)
                  }
                />
                <LabelValue
                  label={type === "policy" ? "Limit" : "Amount"}
                  value={
                    type === "policy"
                      ? formatMoney(detail?.value)
                      : formatMoney(detail?.amount)
                  }
                />
                <LabelValue
                  label={type === "policy" ? "Policy ID" : "Security ID"}
                  value={
                    detail?.policyId ||
                    detail?.securityTypeId ||
                    detail?._id ||
                    "—"
                  }
                />
                <LabelValue
                  label={type === "policy" ? "Submission Date" : "Due Date"}
                  value={
                    type === "policy"
                      ? complianceData?.details?.policyStatus?.submissionDate
                        ? format(
                            new Date(
                              complianceData.details.policyStatus
                                .submissionDate,
                            ),
                            "dd MMM yyyy",
                          )
                        : detail?.createdAt
                          ? format(new Date(detail.createdAt), "dd MMM yyyy")
                          : "—"
                      : detail?.dueDate
                        ? format(new Date(detail.dueDate), "dd MMM yyyy")
                        : "—"
                  }
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status</p>
                {(() => {
                  const s = detail?.status || "Pending";
                  let tone =
                    "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";
                  if (
                    s?.toLowerCase() === "approved" ||
                    s?.toLowerCase() === "submitted"
                  )
                    tone =
                      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
                  if (
                    s?.toLowerCase() === "pending" ||
                    s?.toLowerCase() === "pending submission"
                  )
                    tone =
                      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
                  if (s?.toLowerCase() === "rejected")
                    tone =
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
                  return (
                    <Badge
                      variant="secondary"
                      className={`font-medium ${tone}`}
                    >
                      {s}
                    </Badge>
                  );
                })()}
              </div>

              {detail?.description && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Description
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {detail.description}
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Attached Documents
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {files.map((file, idx) => (
                    <DocumentCard
                      key={file.name || idx}
                      name={file.name || "Document"}
                      type={file.type || "pdf"}
                      size={file.size || "—"}
                      url={file.url}
                    />
                  ))}
                  {!hasFiles && (
                    <p className="text-slate-400 dark:text-slate-500 italic text-xs">
                      No documents attached.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ComplianceDetailsSheet;
