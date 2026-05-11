import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { IconMap } from "@/components/layouts/RoleBasedDashboard/components/StatsCard";

interface StatCardProps {
  title: string;
  count: number;
  icon: any;
  onClick?: () => void;
  iconColor?: string;
  iconBgColor?: string;
  isActive?: boolean;
}

interface UserStatsProps {
  onFilterChange?: (
    filterType: "status" | "role" | "all",
    filterValue: string
  ) => void;
  activeFilter?: { type: "status" | "role" | "all"; value: string } | null;
}

interface UserDashboardData {
  allUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  inactiveUsers: number;
  admins: number;
  procurementLeads: number;
  evaluators: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  count,
  icon: Icon,
  onClick,
  iconColor,
  iconBgColor,
  isActive,
}) => {
  return (
    <Card
      className={`p-6 transition-all duration-200  ${
        onClick
          ? "cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 hover:scale-[1.08]"
          : ""
      } `}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium mb-1 ${"text-gray-600"}`}>
              {title}
            </p>
            <p
              className={`text-2xl font-bold ${
                isActive
                  ? "text-blue-900 dark:text-blue-100"
                  : "text-gray-900 dark:text-gray-200"
              }`}
            >
              {count}
            </p>
          </div>
          <div className={`p-3 rounded-full ${iconBgColor}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const UserStats: React.FC<UserStatsProps> = ({
  onFilterChange,
  activeFilter,
}) => {
  // Fetch user dashboard stats from API
  const {
    data: dashboardData,
    error,
  } = useQuery<ApiResponse<UserDashboardData>, ApiResponseError>({
    queryKey: ["user-dashboard-stats"],
    queryFn: async () => {
      return await getRequest({ url: "/users/dashboard" });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const handleCardClick = (title: string) => {
    if (!onFilterChange) return;

    switch (title) {
      case "All Users":
        onFilterChange("all", "");
        break;
      case "Active Users":
        onFilterChange("status", "active");
        break;
      case "Suspended Users":
        onFilterChange("status", "suspended");
        break;
      case "Inactive Users":
        onFilterChange("status", "inactive");
        break;
      case "Admins":
        onFilterChange("role", "company_admin");
        break;
      case "Procurement Leads":
        onFilterChange("role", "procurement");
        break;
      case "Evaluators":
        onFilterChange("role", "evaluator");
        break;
      default:
        break;
    }
  };

  const isCardActive = (title: string) => {
    if (!activeFilter) return false;

    switch (title) {
      case "All Users":
        return activeFilter.type === "all";
      case "Active Users":
        return (
          activeFilter.type === "status" && activeFilter.value === "active"
        );
      case "Suspended Users":
        return (
          activeFilter.type === "status" && activeFilter.value === "suspended"
        );
      case "Inactive Users":
        return (
          activeFilter.type === "status" && activeFilter.value === "inactive"
        );
      case "Admins":
        return activeFilter.type === "role" && activeFilter.value === "admin";
      case "Procurement Leads":
        return (
          activeFilter.type === "role" &&
          activeFilter.value === "procurement_lead"
        );
      case "Evaluators":
        return (
          activeFilter.type === "role" && activeFilter.value === "evaluator"
        );
      default:
        return false;
    }
  };

  const stats = dashboardData?.data?.data
    ? [
        {
          title: "All Users",
          count: dashboardData.data.data.allUsers,
          icon: IconMap?.users as any,
          iconColor: "text-gray-600",
          iconBgColor: "bg-gray-100",
          onClick: () => handleCardClick("All Users"),
          isActive: isCardActive("All Users"),
        },
        {
          title: "Active Users",
          count: dashboardData.data.data.activeUsers,
          icon: IconMap?.users as any,
          iconColor: "text-green-600",
          iconBgColor: "bg-green-100",
          onClick: () => handleCardClick("Active Users"),
          isActive: isCardActive("Active Users"),
        },
        {
          title: "Suspended Users",
          count: dashboardData.data.data.suspendedUsers,
          icon: IconMap?.users as any,
          iconColor: "text-red-600",
          iconBgColor: "bg-red-100",
          onClick: () => handleCardClick("Suspended Users"),
          isActive: isCardActive("Suspended Users"),
        },
        {
          title: "Inactive Users",
          count: dashboardData.data.data.inactiveUsers,
          icon: IconMap?.users as any,
          iconColor: "text-gray-600",
          iconBgColor: "bg-gray-100",
          onClick: () => handleCardClick("Inactive Users"),
          isActive: isCardActive("Inactive Users"),
        },
        {
          title: "Admins",
          count: dashboardData.data.data.admins,
          icon: IconMap?.users as any,
          iconColor: "text-gray-600",
          iconBgColor: "bg-gray-100",
          onClick: () => handleCardClick("Admins"),
          isActive: isCardActive("Admins"),
        },
        {
          title: "Procurement Leads",
          count: dashboardData.data.data.procurementLeads,
          icon: IconMap?.users as any,
          iconColor: "text-gray-600",
          iconBgColor: "bg-gray-100",
          onClick: () => handleCardClick("Procurement Leads"),
          isActive: isCardActive("Procurement Leads"),
        },
        {
          title: "Evaluators",
          count: dashboardData.data.data.evaluators,
          icon: IconMap?.users as any,
          iconColor: "text-gray-600",
          iconBgColor: "bg-gray-100",
          onClick: () => handleCardClick("Evaluators"),
          isActive: isCardActive("Evaluators"),
        },
      ]
    : [
        {
          title: "All Users",
          count: 0,
          icon: IconMap?.users as any,
          iconColor: "text-gray-600",
          iconBgColor: "bg-gray-100",
          onClick: () => handleCardClick("All Users"),
          isActive: isCardActive("All Users"),
        },
        {
          title: "Active Users",
          count: 0,
          icon: IconMap?.users as any,
          iconColor: "text-gray-600",
          iconBgColor: "bg-gray-100",
          onClick: () => handleCardClick("Active Users"),
          isActive: isCardActive("Active Users"),
        },
        {
          title: "Suspended Users",
          count: 0,
          icon: IconMap?.users as any,
          iconColor: "text-gray-600",
          iconBgColor: "bg-gray-100",
          onClick: () => handleCardClick("Suspended Users"),
          isActive: isCardActive("Suspended Users"),
        },
        {
          title: "Inactive Users",
          count: 0,
          icon: IconMap?.users as any,
          iconColor: "text-gray-600",
          iconBgColor: "bg-gray-100",
          onClick: () => handleCardClick("Inactive Users"),
          isActive: isCardActive("Inactive Users"),
        },
        {
          title: "Admins",
          count: 0,
          icon: IconMap?.users as any,
          iconColor: "text-gray-600",
          iconBgColor: "bg-gray-100",
          onClick: () => handleCardClick("Admins"),
          isActive: isCardActive("Admins"),
        },
        {
          title: "Procurement Leads",
          count: 0,
          icon: IconMap?.users as any,
          iconColor: "text-gray-600",
          iconBgColor: "bg-gray-100",
          onClick: () => handleCardClick("Procurement Leads"),
          isActive: isCardActive("Procurement Leads"),
        },
        {
          title: "Evaluators",
          count: 0,
          icon: IconMap?.users as any,
          iconColor: "text-gray-600",
          iconBgColor: "bg-gray-100",
          onClick: () => handleCardClick("Evaluators"),
          isActive: isCardActive("Evaluators"),
        },
      ];


  if (error) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">
            Failed to load user statistics. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          count={stat.count}
          icon={stat.icon}
          iconColor={stat.iconColor}
          iconBgColor={stat.iconBgColor}
          onClick={stat.onClick}
          isActive={stat.isActive}
        />
      ))}
    </div>
  );
};

export default UserStats;
