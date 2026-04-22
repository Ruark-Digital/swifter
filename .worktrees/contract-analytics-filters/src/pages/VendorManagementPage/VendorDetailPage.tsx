import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError, Vendor } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Input } from "@/components/ui/input";
import { Edit, Eye, Download, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/layouts/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditVendorDialog from "./components/EditVendorDialog";
import { PageLoader } from "@/components/ui/PageLoader";
import { getFileExtension, getFileIcon } from "@/lib/fileUtils.tsx";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import { Solicitation } from "../SolicitationManagementPage/SolicitationDetailPage";
import { formatDateTZ } from "@/lib/utils";

type VendorSubmission = {
  _id: string;
  status: string;
  solicitation: Solicitation;
  createdAt: string;
};

// Vendor detail type extending the base Vendor type
type VendorDetail = Omit<Vendor, "documents"> & {
  registrationDate?: string;
  vendorContact?: string;
  user: {
    name: string;
    email: string;
    phone: string;
    _id: string;
  };
  documents?: {
    name: string;
    fileType: string;
    fileSize: string;
    link: string;
    _id: string;
  }[];
};

// Status badge component
const StatusBadge = ({
  status,
  isSuspended,
}: {
  status: string;
  isSuspended?: boolean;
}) => {
  const getStatusColor = (status: string, isSuspended?: boolean) => {
    if (isSuspended) {
      return "bg-gray-100 text-gray-800";
    }
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const displayStatus = isSuspended ? "Suspended" : status;

  return (
    <Badge
      className={`${getStatusColor(
        status,
        isSuspended
      )} border-0 text-xs px-2 py-1 rounded-md`}
    >
      {displayStatus}
    </Badge>
  );
};

// Overview Tab Component
const OverviewTab = ({ vendor }: { vendor: VendorDetail }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
      {/* Business Type */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">
          Business Type
        </h4>
        <p className="text-sm text-gray-900 dark:text-gray-200 font-medium capitalize">
          {vendor.businessType || "N/A"}
        </p>
      </div>

      {/* Business Address */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">
          Business Address
        </h4>
        <p className="text-sm text-gray-900 font-medium dark:text-gray-200">
          {vendor.location || "N/A"}
        </p>
      </div>

      {/* Registration Date */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">
          Registration Date
        </h4>
        <p className="text-sm text-gray-900 font-medium dark:text-gray-200">
          {vendor.createdAt ? formatDateTZ(vendor.createdAt, "MMMM d, yyyy") : "N/A"}
        </p>
      </div>

      {/* Phone Number */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Phone Number</h4>
        <p className="text-sm text-gray-900 font-medium dark:text-gray-200">
          {vendor?.user?.phone || "N/A"}
        </p>
      </div>

      {/* Website */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Website</h4>
        {vendor.website ? (
          <a
            href={
              vendor.website.startsWith("http")
                ? vendor.website
                : `https://${vendor.website}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
          >
            {vendor.website}
          </a>
        ) : (
          <p className="text-sm text-gray-900 font-medium dark:text-gray-200">
            N/A
          </p>
        )}
      </div>

      {/* Vendor Contact */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">
          Vendor Contact
        </h4>
        <a
          href={`mailto:${vendor.user?.email}`}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
        >
          {vendor.user?.email || "N/A"}
        </a>
      </div>
    </div>
  );
};

// Documents Tab Component
const DocumentsTab = ({
  vendor,
  onViewDocument,
}: {
  vendor: VendorDetail;
  onViewDocument: (document: NonNullable<VendorDetail["documents"]>[0]) => void;
}) => {
  const documents = vendor?.documents ?? [];

  return (
    <div className="pt-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-400 mb-4">
          Vendor's Documents
        </h3>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((document) => (
          <Card
            key={document._id}
            className="border hover:shadow-md transition-shadow bg-white"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                {/* Left side - Icon and Info */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0">
                    {getFileIcon(
                      getFileExtension(document.name, document.fileType)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                      {document.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {document.fileType}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {document.fileSize}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side - Action Buttons */}
                <div className="flex items-center gap-2 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 p-0 bg-gray-100 rounded-full hover:bg-gray-200"
                    )}
                    title="View"
                    onClick={() => onViewDocument(document)}
                  >
                    <Eye className="w-4 h-4 text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0 bg-blue-100 rounded-full hover:bg-blue-200"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-blue-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

type Submission = Vendor["submissions"][0];

// Submission Status Badge Component
const SubmissionStatusBadge = ({
  status,
}: {
  status: Submission["status"];
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "Awarded":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "Not Selected":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  // Map only 'submit' status to 'submitted' for display
  const displayStatus =
    typeof status === "string" && status.toLowerCase() === "submit"
      ? "submitted"
      : status;

  return (
    <Badge className={`${getStatusColor(status)} border-0 p-2 px-4 capitalize`}>
      {displayStatus}
    </Badge>
  );
};

// Submissions Tab Component
const SubmissionsTab = ({
  submissions,
}: {
  submissions: VendorSubmission[];
}) => {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const submissionData =
    submissions?.map?.((data) => ({
      ...data.solicitation,
      status: data.status,
      createdAt: data.createdAt,
    })) ?? [];

  // Define table columns
  const columns: ColumnDef<(typeof submissionData)[0]>[] = [
    {
      accessorKey: "solicitationName",
      header: "Solicitation Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-sm text-gray-500">
            {row.original.solId} • RFP
          </span>
        </div>
      ),
    },
    {
      accessorKey: "submissionDate",
      header: "Submission Date",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.createdAt
            ? formatDateTZ(
                row?.original?.createdAt,
                "dd MMMM, yyyy hh:mm aaa",
                (row?.original as any)?.timezone
              )
            : "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <SubmissionStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-2xl">
            <DropdownMenuItem
              className="p-3"
              onClick={() =>
                navigate(`/dashboard/solicitation/${row.original._id}`)
              }
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Empty state component
  const EmptySubmissions = () => (
    <div className="">
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">
            No Submissions Yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            This vendor hasn't submitted any proposals for solicitations yet.
            Submissions will appear here once they participate in procurement
            opportunities.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pt-6">
      <DataTable
        data={submissionData ?? []}
        columns={columns}
        header={() => (
          <div className="flex items-center justify-between border-b border-[#E9E9EB] pb-3 w-full px-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <h2
                    className="text-base font-semibold text-[#0F0F0F] dark:text-gray-400"
                    style={{ fontFamily: "Quicksand" }}
                  >
                    Solicitations ({submissionData.length})
                  </h2>
                </div>
              </div>
            </div>
          </div>
        )}
        classNames={{
          container:
            "bg-white dark:bg-slate-950 rounded-xl px-3 border border-gray-300 dark:border-gray-700",
          // tCell: "text-center",
          // tHead: "text-center",
        }}
        options={{
          disableSelection: true,
          isLoading: false,
          totalCounts: submissionData.length,
          manualPagination: false,
          setPagination,
          pagination,
        }}
        emptyPlaceholder={<EmptySubmissions />}
      />
    </div>
  );
};

export const VendorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Document viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<
    NonNullable<VendorDetail["documents"]>[0] | null
  >(null);

  // Fetch vendor details from API
  const {
    data: vendorData,
    isLoading,
    error,
  } = useQuery<
    ApiResponse<{ vendor: VendorDetail; submissions: VendorSubmission[] }>,
    ApiResponseError
  >({
    queryKey: ["vendor", id],
    queryFn: async () =>
      await getRequest({ url: `/procurement/vendors/${id}` }),
    enabled: !!id,
  });

  const vendor = vendorData?.data?.data.vendor;
  const submissions = vendorData?.data?.data?.submissions ?? [];

  const handleBack = () => {
    navigate(-1);
  };

  // Handle document viewing
  const handleViewDocument = (document: NonNullable<VendorDetail["documents"]>[0]) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  if (isLoading) {
    return (
      <PageLoader
        title="Vendor Details"
        message="Loading vendor details..."
        className="p-6 min-h-full"
      />
    );
  }

  if (error || !vendor) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-red-600 dark:text-red-400">
          {error?.response?.data?.message || "Failed to load vendor details"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full">
      {/* Header */}
      <div className="mb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
          >
            Vendors Management
          </button>
          <span className="text-gray-400 text-sm">→</span>
          <span className="text-gray-900 text-sm font-medium">
            Vendor Profile
          </span>
        </div>
      </div>

      {/* Vendor Profile Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-200">
                Vendor Profile
              </h2>
              <div className="flex items-center gap-3">
                <EditVendorDialog
                  vendorId={id}
                  vendorData={{
                    name: vendor.name,
                    website: vendor.website,
                    location: vendor.location,
                    phone: vendor.phone,
                    businessType: vendor.businessType,
                    secondaryEmails: vendor.secondaryEmails,
                  }}
                  trigger={
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  }
                />
                {/* <ExportReportSheet /> */}
              </div>
            </div>

            {/* Vendor Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-7">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Vendor Name
                  </h4>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-200">
                    {vendor.name}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Business Type
                  </h4>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-200">
                    {vendor.businessType || "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Status
                  </h4>
                  <StatusBadge
                    status={vendor.status}
                    isSuspended={vendor.isSuspended}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Email Address
                  </h4>
                  <a
                    href={`mailto:${vendor.user?.email}`}
                    className="text-base text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    {vendor.user?.email || "N/A"}
                  </a>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Vendor ID
                  </h4>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-200">
                    {vendor.vendorId}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 !bg-transparent p-0 w-full justify-start">
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
            <TabsTrigger
              value="submissions"
              className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
            >
              Submissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 border-0 p-0">
            <OverviewTab vendor={vendor} />
          </TabsContent>

          <TabsContent value="documents" className="mt-0 border-0 p-0">
            <DocumentsTab vendor={vendor} onViewDocument={handleViewDocument} />
          </TabsContent>

          <TabsContent value="submissions" className="mt-0 border-0 p-0">
            <SubmissionsTab
              {...{ submissions: submissions as VendorSubmission[] }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedDocument(null);
          }}
          fileUrl={selectedDocument.link}
          fileName={selectedDocument.name}
          fileType={selectedDocument.fileType}
        />
      )}
    </div>
  );
};

export default VendorDetailPage;
