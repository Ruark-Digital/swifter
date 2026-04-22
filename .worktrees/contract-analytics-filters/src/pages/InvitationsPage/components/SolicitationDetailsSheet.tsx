import React, { useState } from "react";
import { VendorSolicitation } from "../index";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Download, Loader2 } from "lucide-react";
import { getRequest, putRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
import { useToastHandler } from "@/hooks/useToaster";
// import { useUser } from "@/store/authSlice";

import { formatDateTZ } from "@/lib/utils";
import { PageLoader } from "@/components/ui/PageLoader";
import { getFileExtension, getFileIcon } from "@/lib/fileUtils.tsx";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import { useUser } from "@/store/authSlice";

// Types based on API documentation
type SolicitationType = {
  _id: string;
  name: string;
};

type Category = {
  _id: string;
  name: string;
};

type SolicitationEvent = {
  _id: string;
  name: string;
  date: string;
  description?: string;
};

type SolicitationFile = {
  _id: string;
  name: string;
  title: string;
  url: string;
  size: number;
  type: string;
};

type SolicitationVendor = {
  email: string;
  status: "invited" | "confirmed" | "declined";
  id: string;
  responseStatus: string;
};

type SolicitationDetails = {
  _id: string;
  name: string;
  typeId: SolicitationType;
  type?: SolicitationType;
  categoryIds: Category[];
  categories: Category[];
  submissionDeadline: string;
  estimatedCost?: number;
  description: string;
  visibility: "public" | "private";
  status: "invited" | "confirmed" | "declined" | "closed";
  questionDeadline?: string;
  bidIntentDeadline?: string;
  timezone: string;
  solId: string;
  events: SolicitationEvent[];
  files: SolicitationFile[];
  vendors: SolicitationVendor[];
  contact: string;
  vendorConfirmed: number;
  vendorDeclined: number;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  createdBy: { name: string; _id: string; email: string };
  projectOwner?: {
    name: string;
    email: string;
    phone?: string;
  };
};

interface SolicitationDetailsSheetProps {
  open?: boolean;
  disableButton?: boolean;
  onOpenChange?: (open: boolean) => void;
  solicitation?: {
    id: string;
    solicitationName: string;
    status: string;
  };
  originalData?: VendorSolicitation;
}

const SolicitationDetailsSheet: React.FC<SolicitationDetailsSheetProps> = ({
  open,
  onOpenChange,
  solicitation,
  disableButton,
  originalData,
}) => {

  const queryClient = useQueryClient();
  const toastHandlers = useToastHandler();
  const user = useUser();

  // Manage open state for confirm/decline dialogs so we can control closing programmatically
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = React.useState(false);

  // Document viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<SolicitationFile | null>(null);

  // Handle document viewing
  const handleViewDocument = (document: SolicitationFile) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  // Fetch solicitation details from API
  const {
    data: solicitationData,
    isLoading,
    error,
  } = useQuery<
    ApiResponse<{
      details: SolicitationDetails;
      requiredFiles: SolicitationFile[];
      status: "invited" | "confirmed" | "declined";
    }>,
    ApiResponseError
  >({
    queryKey: ["solicitation-details", solicitation?.id],
    queryFn: async () =>
      await getRequest({ url: `/vendor/solicitations/${solicitation?.id}` }),
    enabled: !!solicitation?.id && open,
  });

  // Mutation for confirming solicitation invitation
  const confirmMutation = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    undefined
  >({
    mutationFn: () =>
      putRequest({ url: `/vendor/solicitations/${solicitation?.id}/confirm` }),
    onSuccess: (result) => {
      toastHandlers.success(
        "Interest Confirmed",
        result.data.message ||
          "Successfully confirmed interest in solicitation",
      );
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: ["solicitation-details", solicitation?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["vendor-invitations"] });
      queryClient.invalidateQueries({
        queryKey: ["vendor-invitation-dashboard"],
      });
      // queryClient.invalidateQueries({ queryKey: ["vendor-solicitations"] });
      // Close the dialog and the sheet
      setConfirmDialogOpen(false);
      onOpenChange?.(false);
    },
    onError: (error) => {
      toastHandlers.error(
        "Confirmation Failed",
        error.message || "Failed to confirm interest in solicitation",
      );
    },
  });

  // Mutation for declining solicitation invitation
  const declineMutation = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    undefined
  >({
    mutationFn: () =>
      putRequest({ url: `/vendor/solicitations/${solicitation?.id}/decline` }),
    onSuccess: (result) => {
      toastHandlers.success(
        "Invitation Declined",
        result.data.message || "Successfully declined solicitation invitation",
      );
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: ["solicitation-details", solicitation?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["vendor-invitations"] });
      queryClient.invalidateQueries({
        queryKey: ["vendor-invitation-dashboard"],
      });
      queryClient.invalidateQueries({ queryKey: ["vendor-solicitations"] });
      // Close the dialog and the sheet
      setDeclineDialogOpen(false);
      onOpenChange?.(false);
    },
    onError: (error) => {
      toastHandlers.error(
        "Decline Failed",
        error.message || "Failed to decline solicitation invitation",
      );
    },
  });

  // Handler functions
  const handleConfirm = () => {
    confirmMutation.mutate(undefined);
  };

  const handleDecline = () => {
    declineMutation.mutate(undefined);
  };

  const details = solicitationData?.data?.data.details;
  const files = solicitationData?.data?.data.details.files || [];

  // Find current vendor's status
  // const currentVendor = details?.vendors?.find(
  //   (vendor) => vendor.email === user?.email
  // );
  // const currentVendorStatus = currentVendor?.status;

  // Helper function to check if current date is past a given deadline
  // const isDatePast = (dateString: string): boolean => {
  //   if (!dateString) return false;
  //   const deadline = new Date(dateString);
  //   const now = new Date();
  //   return now > deadline;
  // };

  // Determine if buttons should be hidden based on bid intent and solicitation deadlines
  const shouldHideButtons = () => {
    // Use originalData if available (from table), otherwise use API data
    const status =
      originalData?.vendor?.status ||
      solicitationData?.data?.data?.details.vendors.find(
        (item) => item.id === user?.vendorId,
      )?.status;
    // const bidIntentDeadline =
    //   originalData?.bidIntentDeadline ||
    //   solicitationData?.data?.data?.details?.bidIntentDeadline;
    // const submissionDeadline =
    //   originalData?.submissionDeadline ||
    //   solicitationData?.data?.data?.details?.submissionDeadline;

    // Only show buttons if status is "invited"
    if (status === "invited") {
      return true;
    }

    // If bid intent deadline is provided, check if it has passed
    // if (bidIntentDeadline) {
    //   return !isDatePast(bidIntentDeadline.toString());
    // }

    // // If no bid intent deadline, check solicitation submission deadline
    // if (submissionDeadline) {
    //   return !isDatePast(submissionDeadline.toString());
    // }

    // Default to showing buttons if no deadlines are available
    return false;
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    return formatDateTZ(dateString, "MMMM dd, yyyy hh:mm a", details?.timezone);
  };

  // console.log({ status: shouldHideButtons(), title: originalData?.name });
  const isDisabled = shouldHideButtons();

  // const formatTime = (dateString: string): string => {
  //   return formatDateTZ(dateString, "hh:mm a", details?.timezone);
  // };

  // // Map status to badge variant
  // const getStatusBadge = (status: string) => {
  //   switch (status?.toLowerCase()) {
  //     case "active":
  //       return {
  //         text: "Active",
  //         className:
  //           "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-300",
  //       };
  //     case "draft":
  //       return {
  //         text: "Draft",
  //         className:
  //           "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
  //       };
  //     case "closed":
  //       return {
  //         text: "Closed",
  //         className:
  //           "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-300",
  //       };
  //     case "awarded":
  //       return {
  //         text: "Awarded",
  //         className:
  //           "bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-300",
  //       };
  //     case "evaluating":
  //       return {
  //         text: "Evaluating",
  //         className:
  //           "bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-300",
  //       };
  //     default:
  //       return {
  //         text: "Not Selected",
  //         className:
  //           "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
  //       };
  //   }
  // };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {!disableButton && (
        <SheetTrigger asChild>
          <h6 className="text-green-600 dark:text-green-400 underline underline-offset-8 cursor-pointer">
            View Details
          </h6>
        </SheetTrigger>
      )}

      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 overflow-auto"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Solicitation Details
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <PageLoader
              showHeader={false}
              message="Loading solicitation details..."
              className="py-8"
            />
          ) : error ? (
            <div className="px-6 py-8 text-center">
              <p className="text-red-600 dark:text-red-400">
                Failed to load solicitation details
              </p>
            </div>
          ) : (
            <>
              {/* Project Header */}
              <div className="px-6 py-4">
                <div className="mb-4">
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {details?.name ||
                      solicitation?.solicitationName ||
                      "Solicitation Details"}
                  </h1>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>{details?.solId}</span>
                  <span>•</span>
                  <span>{details?.typeId?.name || details?.type?.name}</span>
                </div>
              </div>

              {/* Navigation Tabs - Origin UI Style */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 !bg-transparent outline-0 p-0 px-6 w-full justify-start">
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
                  >
                    Documents
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  {/* Solicitation Details Section */}
                  <div className="px-6 py-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                      Solicitation Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Category
                          </h3>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {details?.categoryIds
                              ?.map((cat) => cat.name)
                              .join(", ") ||
                              details?.categories
                                ?.map((cat) => cat.name)
                                .join(", ") ||
                              "Not specified"}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Created by
                          </h3>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {details?.createdBy?.name || "Not specified"}
                          </p>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Project Owner
                          </h3>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {details?.projectOwner?.name ||
                              details?.createdBy?.name ||
                              "Not specified"}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Reference Number
                          </h3>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {details?.solId || "Not specified"}
                          </p>
                        </div>

                        {/* {details?.estimatedCost && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                              Estimated Cost
                            </h3>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              ${details.estimatedCost.toLocaleString()}
                            </p>
                          </div>
                        )} */}
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Description
                      </h3>
                      <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                        {details?.description || "No description provided"}
                      </p>
                    </div>
                  </div>

                  {/* Timeline & Bid Details Section */}
                  <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                      Timeline & Bid Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Submission Deadline
                          </h3>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {details?.submissionDeadline
                              ? formatDate(details.submissionDeadline)
                              : "Not specified"}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Timezone
                          </h3>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {details?.timezone || "Not specified"}
                          </p>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                        {details?.questionDeadline && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                              Question Acceptance Deadline
                            </h3>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {formatDate(details.questionDeadline)}
                            </p>
                          </div>
                        )}

                        {/* {details?.bidIntentDeadline && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                              Bid Intent Deadline Time
                            </h3>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {formatTime(details.bidIntentDeadline)}
                            </p>
                          </div>
                        )} */}

                        {details?.bidIntentDeadline && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                              Bid Intent Deadline Date
                            </h3>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {formatDate(details.bidIntentDeadline)}
                            </p>
                          </div>
                        )}

                        {/* <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Visibility
                          </h3>
                          <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                            {details?.visibility || "Not specified"}
                          </p>
                        </div> */}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documents">
                  {/* Documents Section */}
                  <div className="px-6 py-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                      All Documents
                    </h2>

                    {files && files.length > 0 ? (
                      <div className="space-y-4">
                        {files.map((doc) => (
                          <div
                            key={doc._id}
                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">
                                  {getFileIcon(
                                    getFileExtension(doc.name, doc.type),
                                  )}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {doc.name.length > 100
                                    ? doc.name.substring(0, 40) + "..."
                                    : doc.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {getFileExtension(doc.name, doc.type)} •{" "}
                                  {doc.size}
                                </p>
                              </div>
                            </div>
                            {doc.url && (
                              <div className="flex items-center space-x-2">
                                <button
                                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                  onClick={() => handleViewDocument(doc)}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  className="p-2 text-blue-400 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                  onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = doc.url;
                                    link.download = doc.name;
                                    document.body.appendChild(link);
                                    link.target = "_blank";
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                          No documents available
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Footer */}
              {isDisabled && (
                <div className="px-6 py-4 mb-5">
                  <div className="flex space-x-3">
                    <ConfirmAlert
                      type="error"
                      title="Decline Invitation"
                      text="Are you sure you want to decline this solicitation invitation? This action cannot be undone."
                      primaryButtonText="Yes, Decline"
                      secondaryButtonText="Cancel"
                      onPrimaryAction={handleDecline}
                      open={declineDialogOpen}
                      onClose={setDeclineDialogOpen}
                      primaryButtonLoading={declineMutation.isPending}
                      trigger={
                        <Button
                          variant="outline"
                          className="px-6 w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          disabled={
                            declineMutation.isPending ||
                            confirmMutation.isPending
                          }
                        >
                          {declineMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Declining...
                            </>
                          ) : (
                            "Decline"
                          )}
                        </Button>
                      }
                    />
                    <ConfirmAlert
                      type="success"
                      title="Confirm Interest"
                      text="Are you sure you want to confirm your interest in this solicitation? You will be able to submit a proposal."
                      primaryButtonText="Yes, Confirm"
                      secondaryButtonText="Cancel"
                      onPrimaryAction={handleConfirm}
                      open={confirmDialogOpen}
                      onClose={setConfirmDialogOpen}
                      primaryButtonLoading={confirmMutation.isPending}
                      trigger={
                        <Button
                          className="px-6 w-full"
                          disabled={
                            declineMutation.isPending ||
                            confirmMutation.isPending
                          }
                        >
                          {confirmMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Confirming...
                            </>
                          ) : (
                            "Confirm Interest"
                          )}
                        </Button>
                      }
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedDocument(null);
          }}
          fileUrl={selectedDocument.url}
          fileName={selectedDocument.name}
          fileType={getFileExtension(
            selectedDocument.name,
            selectedDocument.type,
          )}
        />
      )}
    </Sheet>
  );
};

export default SolicitationDetailsSheet;
