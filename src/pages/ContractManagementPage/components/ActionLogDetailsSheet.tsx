import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { contractManagerApi } from "../api/contractManagerApi";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
// import { ContractStatusBadge } from "./StatusBadge";

type ActionLogItem = {
  actionId: string;
  module: string;
  description: string;
  actorName: string;
  actorRole?: string;
  reference: string;
  dateLine1: string;
  dateLine2: string;
  rawReference?: any;
  id?: string;
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
  <div className="py-2">
    <span className="text-sm text-slate-500 dark:text-slate-400 block">{label}</span>
    <span
      className={`text-sm block ${
        highlight ? "font-semibold text-slate-900 dark:text-slate-100" : "text-slate-800 dark:text-slate-200"
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
  <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
    <div className="flex items-center justify-center h-10 w-10 rounded bg-slate-100 dark:bg-slate-800" />
    <div className="flex-1">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{name}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {type} • {size}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" aria-label="Preview" />
      <Button variant="ghost" size="icon" aria-label="Download" />
    </div>
  </div>
);

const ActionLogDetailsSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  action,
}) => {
  const { id, contractId: contractIdParam } = useParams<{
    id: string;
    contractId: string;
  }>();
  const contractId = id || contractIdParam;

  const { data: detailResponse, isLoading } = useQuery({
    queryKey: useUserQueryKey(["actionDetail", contractId, action?.actionId, action?.reference]),
    queryFn: async () => {
      if (!action || !contractId) return null;
      const logId = (action.id && action.id !== "Unknown")
        ? action.id
        : action.actionId;
      return await contractManagerApi.getLogDetail(contractId, logId);
    },
    enabled: !!action && !!contractId && isOpen,
  });

  const renderContent = () => {
    if (isLoading)
      return <div className="p-4 text-center">Loading details...</div>;
    const detailData = detailResponse?.data;

    if (!detailData)
      return <div className="p-4 text-center">No details available.</div>;

    const anyData = detailData;
    const moduleLabel = action?.module || "-";

    const submittedByRaw = anyData.user?.name || anyData.user || "Unknown";
    const submittedBy = typeof submittedByRaw === "string" ? submittedByRaw : "Unknown";

    const submissionDateValue = anyData.createdAt;
    const submissionDate =
      submissionDateValue &&
      !Number.isNaN(new Date(submissionDateValue).getTime())
        ? format(new Date(submissionDateValue), "dd MMM yyyy")
        : `${action?.dateLine1 || ""} ${action?.dateLine2 || ""}`.trim() || "-";

    // const statusText =
    //   anyData.meta?.status|| "Unknown";

    const files = [] as File[];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {typeof anyData.action === "string"
            ? anyData.action
            : action?.description || "Log Detail"}
        </h3>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 justify-start bg-transparent w-full">
            <TabsTrigger value="overview" className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <LabelRow label="Title" value={typeof anyData.action === "string" ? anyData.action : "-"} />
                <LabelRow
                  label="Action ID"
                  value={action?.actionId || "-"}
                />
                <LabelRow label="Module" value={moduleLabel || "-"} />
                <LabelRow
                  label="Reference"
                  value={action?.reference || "-"}
                />
                <LabelRow
                  label="Response Deadline"
                  value={
                    anyData.updatedAt
                      ? format(new Date(anyData.updatedAt), "dd MMM yyyy")
                      : "-"
                  }
                />
              </div>
              <div>
                <LabelRow
                  label="Submitted by"
                  value={
                    <a className="text-blue-600 underline">{submittedBy}</a>
                  }
                />
                <LabelRow label="Submission Date" value={submissionDate} />
                {/* <LabelRow
                  label="Status"
                  value={
                    <ContractStatusBadge status={statusText} />
                  }
                /> */}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Description</span>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {typeof anyData.contractDetailRef === "object" && anyData.contractDetailRef !== null
                  ? JSON.stringify(anyData.contractDetailRef)
                  : anyData.contractDetailRef || "No description provided."}
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">Attached Documents</span>
              <div className="grid grid-cols-1 gap-3">
                {files.map((file: any, index: number) => (
                  <DocCard
                    key={index}
                    name={file.name || "Document"}
                    type={file.type || "FILE"}
                    size={
                      file.size ? `${(file.size / 1024).toFixed(0)}KB` : "-"
                    }
                  />
                ))}
                {files.length === 0 && (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    No documents attached.
                  </div>
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
          <div className="mb-6">
            <SheetTitle>Details</SheetTitle>
          </div>
        </SheetHeader>
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
};

export default ActionLogDetailsSheet;
