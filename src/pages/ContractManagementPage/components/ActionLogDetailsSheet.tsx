import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { contractManagerApi } from "../api/contractManagerApi";
import { useParams } from "react-router-dom";
import { format } from "date-fns";

type ActionLogItem = {
  actionId: string;
  module: string;
  description: string;
  actorName: string;
  actorRole?: string;
  reference: string;
  dateLine1: string;
  dateLine2: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  action: ActionLogItem | null;
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
  <div className="grid grid-cols-2 gap-3 py-2">
    <span className="text-sm text-slate-500">{label}</span>
    <span
      className={`text-sm ${
        highlight ? "font-semibold text-slate-900" : "text-slate-800"
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
}: {
  name: string;
  type: string;
  size: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
    <div className="flex items-center justify-center h-10 w-10 rounded bg-slate-100" />
    <div className="flex-1">
      <p className="text-sm font-medium text-slate-900">{name}</p>
      <p className="text-xs text-slate-500">
        {type} • {size}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" aria-label="Preview" />
      <Button variant="ghost" size="icon" aria-label="Download" />
    </div>
  </div>
);

const ActionLogDetailsSheet: React.FC<Props> = ({ isOpen, onClose, action }) => {
  const { contractId } = useParams<{ contractId: string }>();

  const { data: detailData, isLoading } = useQuery({
    queryKey: ["actionDetail", action?.module, action?.reference],
    queryFn: async () => {
      if (!action || !contractId) return null;
      switch (action.module.toLowerCase()) {
        case "invoice":
          return (await contractManagerApi.getInvoiceDetail(action.reference)).data;
        case "claim":
          return (await contractManagerApi.getClaimDetail(action.reference)).data;
        case "change":
          return (await contractManagerApi.getChangeDetail(action.reference)).data;
        case "rfi":
          return (await contractManagerApi.getRfiDetail(contractId, action.reference)).data;
        case "ncr":
            // NCR doesn't have getDetail, try fetching from list
            const ncrs = (await contractManagerApi.listNcrs(contractId, { ncrId: action.reference })).data;
            return ncrs?.[0];
        case "lem":
            return (await contractManagerApi.getLemDetail(contractId, action.reference)).data;
        case "amendment":
            return (await contractManagerApi.getAmendmentDetail(action.reference)).data;
        default:
          return null;
      }
    },
    enabled: !!action && !!contractId && isOpen,
  });

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "accepted":
      case "completed":
      case "open":
        return "bg-green-100 text-green-700";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "pending":
      case "under review":
      case "draft":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const renderContent = () => {
    if (isLoading) return <div className="p-4 text-center">Loading details...</div>;
    if (!detailData) return <div className="p-4 text-center">No details available.</div>;

    // Mapping based on module type (generic mapping for now based on common fields)
    // Adjust based on specific DTOs if needed
    const anyData = detailData as any;
    
    // Determine title and ID labels based on module
    let titleLabel = "Title";
    let idLabel = "ID";
    let submittedBy = action?.actorName || "Unknown"; // Fallback if not in detail
    let submissionDate = action?.dateLine1 + " " + action?.dateLine2; // Fallback
    
    // Try to get specific fields if available
    if (anyData.submittedBy?.name) submittedBy = anyData.submittedBy.name;
    if (anyData.createdAt) submissionDate = format(new Date(anyData.createdAt), "MMMM dd, yyyy");
    if (anyData.submittedAt) submissionDate = format(new Date(anyData.submittedAt), "MMMM dd, yyyy");

    switch (action?.module.toLowerCase()) {
        case "ncr":
            titleLabel = "NCR Title";
            idLabel = "NCR ID";
            break;
        case "rfi":
            titleLabel = "RFI Title";
            idLabel = "RFI ID";
            break;
        // ... add others
    }

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-900">
          {anyData.title || action?.description}
        </h3>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Separator />
            <div className="grid grid-cols-2 gap-6">
              <div>
                <LabelRow
                  label={titleLabel}
                  value={anyData.title || "-"}
                />
                <LabelRow label={idLabel} value={action?.reference || anyData._id || anyData.ncrId || anyData.rfiId || anyData.changeId || anyData.claimId || anyData.invoiceId || "-"} />
                <LabelRow label="Response Deadline" value={anyData.deadline ? format(new Date(anyData.deadline), "MMMM dd, yyyy") : "-"} />
              </div>
              <div>
                <LabelRow
                  label="Submitted by"
                  value={
                    <a className="text-blue-600 underline">
                      {submittedBy}
                    </a>
                  }
                />
                <LabelRow label="Submission Date" value={submissionDate} />
                <LabelRow
                  label="Status"
                  value={
                    <Badge className={getStatusColor(anyData.status)}>
                      {anyData.status || "Unknown"}
                    </Badge>
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm text-slate-500">Description</span>
              <p className="text-sm text-slate-700">
                {anyData.description || anyData.descrption || "No description provided."}
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-sm text-slate-500">
                Attached Documents
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {anyData.files?.map((file: any, index: number) => (
                    <DocCard 
                        key={index} 
                        name={file.name || "Document"} 
                        type={file.type || "FILE"} 
                        size={file.size ? `${(file.size / 1024).toFixed(0)}KB` : "-"} 
                    />
                ))}
                {(!anyData.files || anyData.files.length === 0) && (
                    <div className="text-sm text-slate-500">No documents attached.</div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        className="sm:max-w-2xl lg:max-w-3xl rounded-l-2xl overflow-y-auto"
        side="right"
      >
        <SheetHeader>
          <div className="flex items-center justify-between mb-6">
            <SheetTitle>Details</SheetTitle>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </SheetHeader>
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
};

export default ActionLogDetailsSheet;
