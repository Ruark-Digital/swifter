import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { StatCard } from "./components/StatCard";
import { DataTable } from "@/components/layouts/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import SolicitationDetailsSheet from "./components/SolicitationDetailsSheet";
import { DropdownFilters } from "@/components/layouts/SolicitationFilters";
import { IconMap } from "@/components/layouts/RoleBasedDashboard/components/StatsCard";
import { formatDateTZ } from "@/lib/utils";

// API Types based on Swagger documentation
export interface VendorSolicitation {
  _id: string;
  name: string;
  typeId: TypeID;
  visibility: string;
  status: string;
  submissionDeadline: Date;
  bidIntentDeadline?: Date;
  timezone: string;
  vendor: Vendor;
  solId: string;
  createdAt: Date;
  submissionStatus: string;
  owner: boolean;
}

export interface TypeID {
  name: string;
}

export interface Vendor {
  id: string;
  status: string;
  responseStatus: string;
  invitedAt: string;
}

// API response type for invitation dashboard stats
type InvitationDashboardStats = {
  confirmed: number;
  declined: number;
  invited: number;
};

// UI Invitation type definition (mapped from API response)
type Invitation = {
  id: string;
  solId: string;
  solicitationName: string;
  solicitationId: string;
  rfp: string;
  invitedDate: string;
  deadline: string;
  timezone: string;
  status: "invited" | "confirmed" | "declined" | "not available" | "closed";
};

// Map API status to UI status
const mapApiStatusToUIStatus = (apiStatus: string): Invitation["status"] => {
  switch (apiStatus.toLowerCase()) {
    case "confirmed":
      return "confirmed";
    case "declined":
      return "declined";
    case "invited":
      return "invited";
    case "closed":
      return "closed";
    default:
      return "not available";
  }
};

// Transform API data to UI format
const transformSolicitationToInvitation = (
  solicitation: VendorSolicitation,
): Invitation => {
  return {
    id: solicitation._id,
    solId: solicitation.solId,
    solicitationName: solicitation.name,
    solicitationId: solicitation.solId,
    rfp: solicitation.typeId?.name || "RFP",
    invitedDate: formatDateTZ(
      solicitation?.vendor?.invitedAt ?? solicitation.createdAt,
      "MMM d, yyyy hh:mm a",
      solicitation?.timezone,
    ),
    deadline: formatDateTZ(
      solicitation.submissionDeadline as any,
      "MMM d, yyyy hh:mm a",
      solicitation?.timezone,
    ),
    timezone: solicitation?.timezone || "UTC",
    status: mapApiStatusToUIStatus(solicitation.vendor.status),
  };
};

// Status badge component
const StatusBadge = ({ status }: { status: Invitation["status"] }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "invited":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "declined":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "invited":
        return "Invited";
      case "declined":
        return "Declined";
      case "closed":
        return "Closed";
      default:
        return "Not Available";
    }
  };

  return (
    <Badge className={`${getStatusColor(status)} border-0 p-2 px-4`}>
      {getStatusLabel(status)}
    </Badge>
  );
};

const InvitationsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selectedInvitation, setSelectedInvitation] =
    useState<Invitation | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);

  // Extract invitationId from URL params
  const invitationId = id;

  // Handle filter changes
  const handleFilterChange = (filterTitle: string, value: string) => {
    setFilterValues((prev) => ({
      ...prev,
      [filterTitle]: value,
    }));

    switch (filterTitle.toLowerCase()) {
      case "status":
        setStatusFilter(value === "all" ? "all" : value.toLowerCase());
        break;
      case "category":
        setCategoryFilter(value === "all" ? "all" : value);
        break;
      case "date":
        setDateFilter(value);
        break;
    }

    // Reset pagination when filters change
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  // API query for invitation dashboard statistics
  const { data: dashboardStatsData } = useQuery<
    ApiResponse<InvitationDashboardStats>,
    ApiResponseError
  >({
    queryKey: ["vendor-invitation-dashboard"],
    queryFn: async () => {
      return await getRequest({
        url: "/vendor/solicitations/invitation/dashboard",
      });
    },
  });

  // API query for vendor invitations
  const { data: invitationsData, isLoading } = useQuery<
    ApiResponse<{ data: VendorSolicitation[], total: number }>,
    ApiResponseError
  >({
    queryKey: [
      "vendor-invitations",
      {
        status: statusFilter !== "all" ? statusFilter : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        dateFilter: dateFilter || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }
      if (dateFilter) {
        // Add date filtering based on the selected date filter
        switch (dateFilter) {
          case "date_invited":
            // You can add specific date range logic here if needed
            params.append("sortBy", "createdAt");
            params.append("sortOrder", "desc");
            break;
        }
      }
      params.append("page", String(pagination.pageIndex + 1));
      params.append("limit", String(pagination.pageSize));

      const queryString = params.toString();
      const url = `/vendor/solicitations/my-invitations${
        queryString ? `?${queryString}` : ""
      }`;

      return await getRequest({ url });
    },
  });

  // Transform API data to UI format
  const transformedData = useMemo(() => {
    if (!invitationsData?.data?.data?.data) return [];
    return invitationsData.data?.data?.data?.map?.(
      transformSolicitationToInvitation,
    );
  }, [invitationsData]);

  // Effect to handle URL parameter and auto-open sheet
  useEffect(() => {
    if (invitationId && transformedData?.length > 0) {
      // Find the invitation with the matching ID
      const invitation = transformedData.find((inv) => inv.id === invitationId);
      if (invitation) {
        setSelectedInvitation(invitation);
        setIsSheetOpen(true);
      }
    }
  }, [invitationId, transformedData]);

  // Calculate statistics from the API dashboard data
  const invitationStats = useMemo(() => {
    if (!dashboardStatsData?.data?.data) {
      return {
        allInvitations: 0,
        confirmedInvitations: 0,
        declinedInvitations: 0,
        pendingInvitations: 0,
      };
    }

    const statsData = dashboardStatsData.data.data;
    const stats = {
      allInvitations:
        statsData.confirmed + statsData.declined + statsData.invited,
      confirmedInvitations: statsData.confirmed,
      declinedInvitations: statsData.declined,
      pendingInvitations: statsData.invited,
    };

    return stats;
  }, [dashboardStatsData]);

  // Use transformed data for display
  const displayData = transformedData;
  const totalCount = invitationsData?.data?.data?.total || 0;

  // Table columns definition
  const columns: ColumnDef<Invitation>[] = [
    {
      accessorKey: "solicitationName",
      header: "Solicitation Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <button
            onClick={() => {
              setSelectedInvitation(row.original);
              setIsSheetOpen(true);
            }}
            className="text-blue-600 hover:text-blue-800 underline cursor-pointer text-left font-medium"
          >
            {row.original.solicitationName}
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {row.original.solicitationId} • {row.original.rfp}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "invitedDate",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span className="text-gray-700 dark:text-gray-300">
            Invited: {row.original.invitedDate}
          </span>
          <span className="text-gray-700 dark:text-gray-300">
            Deadline: {row.original.deadline}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "timezone",
      header: "Timezone",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span className="text-gray-700 dark:text-gray-300">
            {row.original.timezone}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        // Find the original VendorSolicitation data for this row
        const originalSolicitation = invitationsData?.data?.data?.data?.find(
          (sol: VendorSolicitation) => sol._id === row.original.id,
        );
        // console.log({ originalSolicitation, row: row.original });

        if (!originalSolicitation) return null;

        return (
          <SolicitationDetailsSheet
            solicitation={row.original}
            originalData={originalSolicitation}
          />
        );
      },
    },
  ];

  return (
    <div className="p-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Invitations
          </h1>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="All Invitations"
          value={invitationStats.allInvitations}
          icon={IconMap["folder-open"] as any}
          iconColor="text-gray-600 dark:text-gray-400"
          bgColor="bg-gray-500/20 dark:bg-gray-500/30"
          onClick={() => {
            setStatusFilter("all");
            setFilterValues((prev) => ({ ...prev, Status: "all" }));
            setPagination({ pageIndex: 0, pageSize: 10 });
          }}
        />
        <StatCard
          title="Confirmed Invitations"
          value={invitationStats.confirmedInvitations}
          icon={IconMap["folder-open"] as any}
          iconColor="text-green-600 dark:text-green-400"
          bgColor="bg-green-500/20 dark:bg-green-500/30"
          onClick={() => {
            setStatusFilter("confirmed");
            setFilterValues((prev) => ({ ...prev, Status: "confirmed" }));
            setPagination({ pageIndex: 0, pageSize: 10 });
          }}
        />
        <StatCard
          title="Declined Invitations"
          value={invitationStats.declinedInvitations}
          icon={IconMap["folder-open"] as any}
          iconColor="text-red-600 dark:text-red-400"
          bgColor="bg-red-500/20 dark:bg-red-500/30"
          onClick={() => {
            setStatusFilter("declined");
            setFilterValues((prev) => ({ ...prev, Status: "declined" }));
            setPagination({ pageIndex: 0, pageSize: 10 });
          }}
        />
        <StatCard
          title="Pending Invitations"
          value={invitationStats.pendingInvitations}
          icon={IconMap["folder-open"] as any}
          iconColor="text-yellow-600 dark:text-yellow-400"
          bgColor="bg-yellow-500/20 dark:bg-yellow-500/30"
          onClick={() => {
            setStatusFilter("invited");
            setFilterValues((prev) => ({ ...prev, Status: "invited" }));
            setPagination({ pageIndex: 0, pageSize: 10 });
          }}
        />
      </div>

      {/* Invitations Table */}

      <DataTable
        data={displayData}
        columns={columns}
        options={{
          manualPagination: true,
          setPagination: setPagination,
          pagination: pagination,
          totalCounts: totalCount,
          isLoading: isLoading,
        }}
        classNames={{
          container:
            "bg-white dark:bg-slate-950 rounded-xl px-3 border border-gray-300 dark:border-slate-600",
          // tCell: "text-center",
          // tHead: "text-center",
        }}
        header={() => (
          <div className="flex items-center w-full justify-between border-b border-[#E9E9EB] dark:border-slate-600 p-3 pt-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <h2
                    className="text-base font-semibold text-gray-700 dark:text-gray-300"
                    style={{ fontFamily: "Quicksand" }}
                  >
                    Invitations
                  </h2>
                </div>
              </div>

              <DropdownFilters
                filters={[
                  {
                    title: "Date",
                    showIcon: true,
                    options: [
                      {
                        hasOptions: true,
                        value: "date",
                        label: "Date Invited",
                        subOptions: [
                          {
                            title: "Date Invited",
                            value: "date_invited",
                          },
                        ],
                      },
                    ],
                  },
                  {
                    title: "Status",
                    showIcon: true,
                    options: [
                      {
                        label: "All",
                        value: "all",
                      },
                      {
                        label: "Confirmed",
                        value: "active",
                      },
                      {
                        label: "Declined",
                        value: "closed",
                      },
                      {
                        label: "Not Selected",
                        value: "awarded",
                      },
                      {
                        label: "Pending",
                        value: "draft",
                      },
                    ],
                  },
                  // {
                  //   title: "Category",
                  //   options: [
                  //     {
                  //       label: "All",
                  //       value: "all",
                  //     },
                  //   ],
                  // },
                ]}
                onFilterChange={handleFilterChange}
                selectedValues={filterValues}
              />
            </div>
          </div>
        )}
      />

      {/* Solicitation Details Sheet */}
      <SolicitationDetailsSheet
        open={isSheetOpen}
        disableButton
        originalData={
          selectedInvitation as unknown as any
        }
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            setSelectedInvitation(null);
            // Navigate back to invitations page without ID if we came from a direct link
            if (invitationId) {
              navigate("/dashboard/invitations", { replace: true });
            }
          }
        }}
        solicitation={
          selectedInvitation
            ? {
                id: selectedInvitation.id,
                solicitationName: selectedInvitation.solicitationName,
                status: selectedInvitation.status,
              }
            : undefined
        }
      />
    </div>
  );
};

export default InvitationsPage;
