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
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Share2, Eye, Download } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import { useToastHandler } from "@/hooks/useToaster";
import { getFileIcon } from "@/lib/fileUtils";
import { ContractComplianceDTO } from "../api/contractManagerApi";
import Spinner from "@/components/ui/Spinner";

// Extract the item types from the DTO
type PolicyItem = NonNullable<ContractComplianceDTO["policy"]>[number];
type SecurityItem = NonNullable<ContractComplianceDTO["security"]>[number];

interface ComplianceDetailsSheetProps {
  trigger: React.ReactNode;
  type: "policy" | "security";
  id: string;
  contractId: string;
  basePath: string;
  data?: PolicyItem | SecurityItem;
}

const LabelValue = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-sm text-slate-500 font-medium">{label}</p>
    <p className="text-base font-semibold text-slate-900">{value}</p>
  </div>
);

const DocumentCard = ({
  name,
  type,
  size,
}: {
  name: string;
  type: string;
  size: string;
}) => (
  <div className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
    <div className="h-12 w-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
      {getFileIcon(type)}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
      <p className="text-xs text-slate-500">
        {type.toUpperCase()} • {size}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
        <Eye className="h-4 w-4" />
      </button>
      <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
        <Download className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const ComplianceDetailsSheet: React.FC<ComplianceDetailsSheetProps> = ({
  trigger,
  type,
  id,
  contractId,
  basePath,
  data,
}) => {
  const { isManager, isAdmin } = useUserRole();
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  const { data: complianceRes, isLoading } = useQuery({
    queryKey: ["contract-compliance-detail", contractId, basePath],
    queryFn: async () => {
      const res = await getRequest({ url: basePath });
      return res.data as { data?: ContractComplianceDTO };
    },
    enabled: !!contractId,
    // staleTime: 60000,
  });

  const complianceData = complianceRes?.data;

  // Find the specific item from the fetched list if data prop isn't provided
  const fetchedDetail = React.useMemo(() => {
    if (data) return data;
    if (!complianceData) return undefined;

    if (type === "policy") {
      return complianceData.policy?.find(
        (p) => p._id === id || p.policyId === id,
      );
    } else {
      return complianceData.security?.find((s) => s.id === id);
    }
  }, [data, complianceData, type, id]);

  const detail = (fetchedDetail || data) as any;

  if(isLoading){
    return <Spinner />
  }

  const handleAction = async (action: "approved" | "rejected") => {
    try {
      await postRequest({
        url: `${basePath}/${type}/${id}/approve`,
        payload: { action },
      });
      toast.success("Success", `Status updated to ${action}`);
      queryClient.invalidateQueries({
        queryKey: ["contract-compliance-detail", contractId, basePath],
      });
      queryClient.invalidateQueries({
        queryKey: ["contract-compliance", contractId, basePath],
      });
    } catch (error: any) {
      toast.error("Error", error?.message || "Failed to update status");
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[600px] p-0 border-l-0"
      >
        <SheetHeader className="flex flex-row items-center justify-between p-6 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <SheetClose asChild>
              <button className="p-2 hover:bg-slate-200 rounded-full transition-colors border border-slate-300 bg-white">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </SheetClose>
            <SheetTitle className="text-xl font-bold text-[#2A4467]">
              {type === "policy" ? "Policy Details" : "Security Details"}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              {detail?.policyName || detail?.securityType || ""}
            </h2>
            <Button
              variant="outline"
              className="flex items-center gap-2 border-slate-300 text-slate-600 font-bold h-10 px-6 rounded-xl"
            >
              <Share2 className="h-4 w-4" /> Export
            </Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 justify-start bg-transparent w-full">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                Overview
              </TabsTrigger>
              {/* <TabsTrigger
                value="comments"
                className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                Comments
              </TabsTrigger> */}
            </TabsList>

            <TabsContent value="overview" className="pt-8 space-y-8 overflow-auto">
              <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                <LabelValue
                  label={type === "policy" ? "Policy Name" : "Security Type"}
                  value={detail?.policyName || detail?.securityType || "—"}
                />
                <LabelValue
                  label="Limit"
                  value={
                    detail?.value
                      ? `$${Number(detail.value).toLocaleString()}M`
                      : "—"
                  }
                />
                <LabelValue
                  label={type === "policy" ? "Policy ID" : "Security ID"}
                  value={detail?.policyId || detail?.id || "—"}
                />
                <LabelValue
                    label="Submission Date"
                    value={
                      detail?.createdAt
                        ? format(new Date(detail.createdAt), "dd MMM yyyy")
                        : "-"
                    }
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-500 font-medium">Status</p>
                <Badge className="bg-green-50 text-green-600 hover:bg-green-50 border-none px-4 py-1.5 text-sm font-bold rounded-lg capitalize">
                  {detail?.status || "Pending"}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-500 font-medium">
                  Description
                </p>
                <p className="text-base text-slate-700 leading-relaxed font-medium">
                  {detail?.description || "No description provided."}
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Attached Documents
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {detail?.files?.map((file: any, idx: number) => (
                    <DocumentCard
                      key={idx}
                      name={file.name || "Document"}
                      type={file.type || "pdf"}
                      size={file.size || "—"}
                    />
                  ))}
                  {!detail?.files?.length && (
                    <p className="text-slate-400 italic text-sm">
                      No documents attached.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {(isManager || isAdmin) &&
            !["published", "approved"].includes(
              detail?.status?.toLowerCase(),
            ) && (
            <div className="flex gap-4 pt-8 sticky bottom-0 bg-white pb-2 border-t border-slate-100 mt-auto">
              <Button
                variant="outline"
                className="flex-1  rounded-xl border-slate-200 bg-slate-50 text-slate-900 font-bold text-lg hover:bg-slate-100"
                onClick={() => handleAction("rejected")}
              >
                Reject
              </Button>
              <Button
                className="flex-1 rounded-xl bg-[#2A4467] text-white font-bold text-lg hover:bg-[#1f3552]"
                onClick={() => handleAction("approved")}
              >
                Approve
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ComplianceDetailsSheet;
