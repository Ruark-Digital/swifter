/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useMemo, useState } from "react";
// import { ExportReportSheet } from "@/components/layouts/ExportReportSheet";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useUser } from "@/store/authSlice";
import { DashboardDataTransformer } from "@/lib/dashboardDataTransformer";
import { ChartComponent } from "./components/ChartCard";
import { ActivityComponent } from "./components/ActivityCard";
import { CardStats } from "./components/StatsCard";
import { cn } from "@/lib/utils";
import { DashboardConfig, dashboardConfigs } from "@/config/dashboardConfig";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import { ContractsTabView } from "./ContractsTabView";
import { VendorContractsView } from "./VendorContractsView";
import { useLandingTabs, type LandingTabId } from "./useLandingTabs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEFAULT_CHART_FILTER = "12months";

const LOADING_ROLES = new Set([
  "super_admin",
  "company_admin",
  "evaluator",
  "vendor",
  "procurement",
]);

const STAT_ROUTE_MAPPINGS: Record<
  string,
  { route: string; filters?: Record<string, string> }
> = {
  "All Companies": { route: "/dashboard/companies" },
  "Active Companies": {
    route: "/dashboard/companies",
    filters: { status: "active" },
  },
  "Suspended Companies": {
    route: "/dashboard/companies",
    filters: { status: "suspended" },
  },
  "All Admins": { route: "/dashboard/admin-management" },
  "Super Admins": {
    route: "/dashboard/admin-management",
    filters: { role: "super_admin" },
  },
  "Organisation Admins": {
    route: "/dashboard/admin-management",
    filters: { role: "company_admin" },
  },
  "All Solicitations": { route: "/dashboard/solicitation" },
  "Active Solicitations": {
    route: "/dashboard/solicitation",
    filters: { status: "active" },
  },
  "Pending Evaluations": {
    route: "/dashboard/evaluation",
    filters: { status: "pending" },
  },
  Awarded: {
    route: "/dashboard/solicitation",
    filters: { status: "awarded" },
  },
  "All Evaluations": { route: "/dashboard/evaluation" },
  "Active Evaluations": {
    route: "/dashboard/evaluation",
    filters: { status: "active" },
  },
  "Completed Evaluations": {
    route: "/dashboard/evaluation",
    filters: { status: "completed" },
  },
  "All Invitations": { route: "/dashboard/invitations" },
  "Confirmed Invitations": {
    route: "/dashboard/invitations",
    filters: { status: "confirmed" },
  },
  "Declined Invitations": {
    route: "/dashboard/invitations",
    filters: { status: "declined" },
  },
  "Pending Invitations": {
    route: "/dashboard/invitations",
    filters: { status: "pending" },
  },
  "Total Solicitations": { route: "/dashboard/solicitation" },
  "Total Users": { route: "/dashboard/user-management" },
  "Active Users": {
    route: "/dashboard/user-management",
    filters: { status: "active" },
  },
  "Inactive Users": {
    route: "/dashboard/user-management",
    filters: { status: "inactive" },
  },
};

const CM_YTD_STATS = [
  {
    title: "All Contracts",
    value: 0,
    icon: "file",
    color: "text-gray-700",
    bgColor: "bg-gray-500/10",
  },
  {
    title: "Active Contracts",
    value: 0,
    icon: "check-circle",
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Suspended",
    value: 0,
    icon: "x-circle",
    color: "text-red-600",
    bgColor: "bg-red-500/10",
  },
  {
    title: "Expired",
    value: 0,
    icon: "x-circle",
    color: "text-red-600",
    bgColor: "bg-red-500/10",
  },
  {
    title: "Terminated",
    value: 0,
    icon: "x-circle",
    color: "text-red-600",
    bgColor: "bg-red-500/10",
  },
  {
    title: "Total Contract Value",
    value: 0,
    icon: "creditCard",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Committed vs Actual",
    value: 0,
    icon: "creditCard",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Savings Realized",
    value: 0,
    icon: "award",
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  {
    title: "High Risk Contracts",
    value: 0,
    icon: "file",
    color: "text-red-600",
    bgColor: "bg-red-500/10",
  },
];

// Maps the total-contract stat template onto live contract card values.
// Shared by the contract_manager branch and the procurement Contracts tab so
// both render identical contract stats.
const buildContractTotalStats = (template: any[], cards: any) =>
  template.map((stat) => {
    const value =
      stat.title === "All Contracts"
        ? cards?.allContracts?.value ?? 0
        : stat.title === "Active Contracts"
          ? cards?.activeContracts?.value ?? 0
          : stat.title === "Draft Contracts"
            ? cards?.draftContracts?.value ?? 0
            : stat.title === "Suspended"
              ? cards?.suspendedContracts?.value ?? 0
              : stat.title === "Expired"
                ? cards?.expiredContracts?.value ?? 0
                : stat.title === "Terminated"
                  ? cards?.terminatedContracts?.value ?? 0
                  : stat.title === "Total Contract Value"
                    ? cards?.totalContractValue?.value ?? 0
                    : stat.title === "Committed vs Actual Value"
                      ? Math.round(cards?.committedVsActual?.percentage ?? 0)
                      : stat.title === "Savings Realized"
                        ? cards?.savingsRealized?.value ?? 0
                        : stat.title === "Upcoming Renewals"
                          ? cards?.upcomingRenewals?.count ?? 0
                          : stat.title === "High Risk Contracts"
                            ? cards?.highRiskContracts?.count ?? 0
                            : stat.title === "Holdbacks"
                              ? cards?.holdbacks?.value ?? 0
                              : stat.value;
    const isMoneyStat =
      stat.title === "Total Contract Value" ||
      stat.title === "Savings Realized" ||
      stat.title === "Holdbacks";
    return {
      ...stat,
      value,
      ...(isMoneyStat
        ? { currency: cards?.totalContractValue?.currency }
        : {}),
    };
  });

// Main Role-Based Dashboard Component
export const RoleBasedDashboard: React.FC = () => {
  const { dashboardConfig, userRole } = useUserRole();
  const user = useUser();
  const modules = user?.module;
  // Individual chart filters instead of global filter
  const [chartFilters, setChartFilters] = useState<Record<string, string>>({});
  const [cmTopTab, setCmTopTab] = useState<"overview" | "analytics">("overview");
  const [cmSubTab, setCmSubTab] = useState<"total-contracts" | "ytd-contracts">(
    "total-contracts"
  );
  const navigate = useNavigate();

  const landingTabs = useLandingTabs(userRole, modules);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as LandingTabId | null;
  const defaultLandingTab = landingTabs[0]?.id;
  const activeLandingTab: LandingTabId | undefined =
    tabFromUrl && landingTabs.some((t) => t.id === tabFromUrl)
      ? tabFromUrl
      : defaultLandingTab;

  const setActiveLandingTab = (id: LandingTabId) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", id);
    setSearchParams(next, { replace: true });
  };

  // Fetch dashboard data based on user role (without global filter)
  const {
    dashboardCount,
    roleDistribution,
    weeklyActivities,
    subDistribution,
    companyStatus,
    moduleUsage,
    solicitationStatus,
    bidIntent,
    vendorsDistribution,
    proposalSubmission,
    companyRoleDistribution,
    generalUpdates,
    procurementDashboard,
    procurementMyActions,
    procurementGeneralUpdates,
    procurementSolicitationStatus,
    procurementBidIntent,
    procurementVendorsDistribution,
    procurementProposalSubmission,
    procurementWeeklyActivities,
    procurementTotalEvaluations,

    evaluatorDashboard,
    evaluatorMyActions,
    evaluatorEvaluationUpdates,
    vendorDashboard,
    vendorMyActions,
    vendorGeneralUpdates,
    contractManagerTotalCards,
    contractManagerYtdCards,
    contractManagerActionLogs,
    contractManagerGeneralUpdates,
    contractManagerCycleTime,
    contractManagerInvoiceStatus,
    contractManagerCommittedVsActualSpend,
    contractManagerVendorContractValue,
    contractManagerProjectContractValue,
    contractManagerRiskDistribution,
    contractManagerChangeOrderImpact,
    contractManagerCategoryValue,
    contractManagerComplianceStatus,
    contractManagerClauseIntelligence,
    contractManagerContractStatus,
    contractManagerVendorSummary,
    contractManagerRenewals,
    contractManagerAiInsights,
    isLoadingContractManagerAiInsights,
    isInitialLoading,
    // Individual chart data fetchers
    getChartData,
  } = useDashboardData(userRole, chartFilters);

  const cmYtdStats = useMemo(() => {
    const ytd = contractManagerYtdCards;
    return CM_YTD_STATS.map((stat) => {
      const value =
        stat.title === "All Contracts"
          ? ytd?.allContracts?.value ?? 0
          : stat.title === "Active Contracts"
            ? ytd?.activeContracts?.value ?? 0
            : stat.title === "Suspended"
              ? ytd?.suspendedContracts?.value ?? 0
              : stat.title === "Expired"
                ? ytd?.expiredContracts?.value ?? 0
                : stat.title === "Terminated"
                  ? ytd?.terminatedContracts?.value ?? 0
                  : stat.title === "Total Contract Value"
                    ? ytd?.totalContractValue?.value ?? 0
                    : stat.title === "Committed vs Actual"
                      ? Math.round(ytd?.committedVsActual?.percentage ?? 0)
                      : stat.title === "Savings Realized"
                        ? ytd?.savingsRealized?.value ?? 0
                        : stat.title === "High Risk Contracts"
                          ? ytd?.highRiskContracts?.count ?? 0
                          : 0;

      const isMoneyStat =
        stat.title === "Total Contract Value" ||
        stat.title === "Savings Realized" ||
        stat.title === "Holdbacks";
      return {
        ...stat,
        value,
        ...(isMoneyStat
          ? { currency: ytd?.totalContractValue?.currency }
          : {}),
      };
    });
  }, [contractManagerYtdCards]);

  // Total-contract stats for roles whose base config isn't contract-shaped
  // (e.g. procurement's Contracts landing tab) — sourced from the canonical
  // contract_manager stat template.
  const cmTotalStats = useMemo(
    () =>
      buildContractTotalStats(
        dashboardConfigs.contract_manager.stats,
        contractManagerTotalCards,
      ),
    [contractManagerTotalCards],
  );

  const cmCycleTimeValues = useMemo(() => {
    const stages = contractManagerCycleTime?.stages ?? [];
    const getDays = (names: string[]) => {
      const stage = stages.find((s) =>
        names.some((n) => s?.name?.toLowerCase?.() === n.toLowerCase())
      );
      return stage?.days ?? 0;
    };

    return {
      draft: getDays(["drafting", "draft"]),
      review: getDays(["review"]),
      approval: getDays(["approval"]),
      execution: getDays(["execution", "executed"]),
    };
  }, [contractManagerCycleTime]);

  // Transform API data into dashboard configuration format
  const enhancedDashboardConfig: DashboardConfig = useMemo(() => {
    if (userRole === "super_admin") {
      // Transform SuperAdmin data
      const transformedStats =
        DashboardDataTransformer.transformSuperAdminStats(dashboardCount);
      DashboardDataTransformer.transformWeeklyActivities(weeklyActivities);
      const transformedSubData =
        DashboardDataTransformer.transformSubDistribution(subDistribution);
      const transformedStatusData = getChartData("company-status");
      const transformedModuleData =
        DashboardDataTransformer.transformModuleUsage(moduleUsage);
      const transformedRoleData =
        DashboardDataTransformer.transformRoleDistribution(roleDistribution);

      return {
        ...dashboardConfig,
        stats: transformedStats,
        rows: dashboardConfig.rows.map((row) => {
          if (row.type === "chart") {
            return {
              ...row,
              properties: row.properties.map((chart) => {
                switch (chart.id) {
                  case "sub-distribution":
                    return {
                      ...chart,
                      data: transformedSubData,
                      centerText: {
                        value:
                          subDistribution?.totalActive?.toString?.() ?? "0",
                        label: "Active Subscriptions",
                      },
                    };
                  case "company-status":
                    return {
                      ...chart,
                      data: transformedStatusData,
                    };
                  case "module-usage":
                    return {
                      ...chart,
                      data: transformedModuleData,
                    };
                  case "portal-role-distribution":
                    return {
                      ...chart,
                      data: transformedRoleData,
                    };
                  default:
                    return chart;
                }
              }),
            };
          }
          return row;
        }),
      };
    }

    if (userRole === "company_admin") {
      // Transform Company Admin data
      const transformedSolicitationStatus =
        DashboardDataTransformer.transformSolicitationStatus(
          solicitationStatus
        );
      const transformedBidIntent =
        DashboardDataTransformer.transformBidIntent(bidIntent);
      const transformedVendorsDistribution =
        DashboardDataTransformer.transformVendorsDistribution(
          vendorsDistribution
        );
      const transformedProposalSubmission =
        DashboardDataTransformer.transformProposalSubmission(
          proposalSubmission
        );
      const transformedCompanyRoleDistribution =
        DashboardDataTransformer.transformCompanyRoleDistribution(
          companyRoleDistribution
        );
      const transformedCompanyAdminGeneralUpdates =
        DashboardDataTransformer.transformCompanyAdminGeneralUpdates(
          generalUpdates
        );

      return {
        ...dashboardConfig,
        stats: transformedSolicitationStatus,
        rows: dashboardConfig.rows.map((row) => {
          if (row.type === "mixed") {
            return {
              ...row,
              properties: row.properties.map((property) => {
                if (property.id === "vendors-distribution") {
                  return {
                    ...property,
                    centerText: {
                      label: property?.centerText?.label ?? "Vendors",
                      value: vendorsDistribution?.total ?? 0,
                    },
                    data: transformedVendorsDistribution,
                  };
                }
                if (property.title === "General Updates") {
                  return {
                    ...property,
                    items: transformedCompanyAdminGeneralUpdates,
                  };
                }
                return property;
              }),
            };
          }
          if (row.type === "chart") {
            return {
              ...row,
              properties: row.properties.map((chart) => {
                switch (chart.id) {
                  case "bid-intent":
                    return {
                      ...chart,
                      data: transformedBidIntent,
                    };
                  case "proposal-submission":
                    return {
                      ...chart,
                      data: transformedProposalSubmission,
                    };
                  case "company-role-distribution":
                    return {
                      ...chart,
                      data: transformedCompanyRoleDistribution,
                    };
                  default:
                    return chart;
                }
              }),
            };
          }
          return row;
        }),
      };
    }

    if (userRole === "evaluator") {
      // Transform Evaluator data
      const transformedEvaluatorMyActions =
        DashboardDataTransformer.transformEvaluatorMyActions(
          evaluatorMyActions
        );
      const transformedEvaluatorEvaluationUpdates =
        DashboardDataTransformer.transformEvaluatorEvaluationUpdates(
          evaluatorEvaluationUpdates
        );

      return {
        ...dashboardConfig,
        stats:
          DashboardDataTransformer.transformEvaluatorStats(evaluatorDashboard),
        rows: dashboardConfig.rows.map((row) => {
          if (row.type === "activity") {
            return {
              ...row,
              properties: row.properties.map((activity) => {
                if (activity.id === "my-actions") {
                  return {
                    ...activity,
                    items: transformedEvaluatorMyActions,
                  };
                }
                if (activity.id === "evaluation-updates") {
                  return {
                    ...activity,
                    items: transformedEvaluatorEvaluationUpdates,
                  };
                }
                return activity;
              }),
            };
          }
          return row;
        }),
      };
    }

    if (userRole === "vendor") {
      // Transform Vendor data
      const transformedVendorMyActions =
        DashboardDataTransformer.transformVendorMyActions(vendorMyActions);
      const transformedVendorGeneralUpdates =
        DashboardDataTransformer.transformVendorGeneralUpdates(
          vendorGeneralUpdates
        );

      return {
        ...dashboardConfig,
        stats: DashboardDataTransformer.transformVendorStats(vendorDashboard),
        rows: dashboardConfig.rows.map((row) => {
          if (row.type === "activity") {
            return {
              ...row,
              properties: row.properties.map((activity) => {
                if (activity.id === "my-actions") {
                  return {
                    ...activity,
                    items: transformedVendorMyActions,
                  };
                }
                if (activity.id === "general-updates") {
                  return {
                    ...activity,
                    items: transformedVendorGeneralUpdates,
                  };
                }
                return activity;
              }),
            };
          }
          return row;
        }),
      };
    }

    if (userRole === "procurement") {
      // Transform Procurement data
      const transformedProcurementStats =
        DashboardDataTransformer.transformProcurementStats(
          procurementDashboard
        );
      const transformedSolicitationStatus =
        DashboardDataTransformer.transformChartData(
          "solicitation-status",
          procurementSolicitationStatus
        );
      const transformedBidIntent = DashboardDataTransformer.transformChartData(
        "bid-intent",
        procurementBidIntent
      );
      const transformedVendorsDistribution =
        DashboardDataTransformer.transformChartData(
          "vendors-distribution",
          procurementVendorsDistribution
        );
      const transformedProposalSubmission =
        DashboardDataTransformer.transformChartData(
          "proposal-submission",
          procurementProposalSubmission,
          "line"
        );

      const transformedTotalEvaluations =
        DashboardDataTransformer.transformChartData(
          "total-evaluation",
          procurementTotalEvaluations,
          "bar"
        );
      const transformedSolicitationActivities =
        DashboardDataTransformer.transformChartData(
          "solicitation-activities",
          procurementWeeklyActivities,
          "area"
        );
      const transformedProcurementMyActions =
        DashboardDataTransformer.transformProcurementMyActions(
          procurementMyActions
        );
      const transformedProcurementGeneralUpdates =
        DashboardDataTransformer.transformProcurementGeneralUpdates(
          procurementGeneralUpdates
        );

      const payload = {
        ...dashboardConfig,
        stats: transformedProcurementStats,
        rows: dashboardConfig.rows.map((row) => {
          if (row.type === "activity") {
            return {
              ...row,
              properties: row.properties.map((activity) => {
                if (activity.id === "my-actions") {
                  return {
                    ...activity,
                    items: transformedProcurementMyActions,
                  };
                }
                if (activity.id === "general-updates") {
                  return {
                    ...activity,
                    items: transformedProcurementGeneralUpdates,
                  };
                }
                return activity;
              }),
            };
          }

          if (row.type === "chart") {
            return {
              ...row,
              properties: row.properties.map((chart) => {
                switch (chart.id) {
                  case "solicitation-status":
                    return {
                      ...chart,
                      data: transformedSolicitationStatus,
                    };
                  case "solicitation-activities":
                    return {
                      ...chart,
                      data: transformedSolicitationActivities,
                    };
                  case "vendors-bid-intent-status":
                    return {
                      ...chart,
                      centerText: {
                        label: "Active Bids",
                        value:
                          procurementBidIntent?.activeBid.toString() || "0",
                      },
                      data: transformedBidIntent,
                    };
                  case "vendors-distribution":
                    return {
                      ...chart,
                      centerText: {
                        label: "Vendors",
                        value:
                          procurementVendorsDistribution?.total.toString() ||
                          "0",
                      },
                      data: transformedVendorsDistribution,
                    };
                  case "proposal-submission":
                    return {
                      ...chart,
                      data: transformedProposalSubmission,
                    };
                  case "weekly-activities":
                    return {
                      ...chart,
                      data: transformedSolicitationActivities,
                    };
                  case "total-evaluation":
                    return {
                      ...chart,
                      data: transformedTotalEvaluations,
                    };
                  default:
                    return chart;
                }
              }),
            };
          }

          return row;
        }),
      };

      return payload;
    }

    if (userRole === "contract_manager" || userRole === "approver") {
      const transformedStats = buildContractTotalStats(
        dashboardConfig.stats,
        contractManagerTotalCards,
      );

      const transformedMyActions =
        DashboardDataTransformer.transformContractManagerDashboardActivity(
          contractManagerActionLogs
        );
      const transformedGeneralUpdates =
        DashboardDataTransformer.transformContractManagerDashboardActivity(
          contractManagerGeneralUpdates
        );

      return {
        ...dashboardConfig,
        stats: transformedStats,
        rows: dashboardConfig.rows.map((row) => {
          if (row.type === "activity") {
            return {
              ...row,
              properties: row.properties.map((activity) => {
                if (activity.id === "my-actions") {
                  return { ...activity, items: transformedMyActions };
                }
                if (activity.id === "general-updates") {
                  return { ...activity, items: transformedGeneralUpdates };
                }
                return activity;
              }),
            };
          }
          return row;
        }),
      };
    }

    // For other roles, return the original config
    // This can be extended to handle other role-specific data transformations
    return dashboardConfig;
  }, [
    dashboardConfig,
    userRole,
    dashboardCount,
    roleDistribution,
    weeklyActivities,
    subDistribution,
    companyStatus,
    moduleUsage,
    solicitationStatus,
    bidIntent,
    vendorsDistribution,
    proposalSubmission,
    companyRoleDistribution,
    generalUpdates,
    procurementDashboard,
    procurementMyActions,
    procurementGeneralUpdates,
    procurementSolicitationStatus,
    procurementBidIntent,
    procurementVendorsDistribution,
    procurementProposalSubmission,
    procurementWeeklyActivities,
    procurementTotalEvaluations,
    evaluatorDashboard,
    evaluatorMyActions,
    evaluatorEvaluationUpdates,
    vendorDashboard,
    vendorMyActions,
    vendorGeneralUpdates,
    contractManagerTotalCards,
    contractManagerActionLogs,
    contractManagerGeneralUpdates,
  ]);

  // Handle individual chart filter changes
  const handleFilterChange = useCallback((chartId?: string, filter?: string) => {
    if (!chartId || !filter) return;
    setChartFilters((prev) => ({
      ...prev,
      [chartId]: filter.replace(/\s+/g, ""),
    }));
  }, []);

  const getChartFilter = useCallback(
    (chartId?: string) => {
      if (!chartId) return DEFAULT_CHART_FILTER;
      return chartFilters[chartId] || DEFAULT_CHART_FILTER;
    },
    [chartFilters]
  );

  const handleStatCardClick = useCallback(
    (title: string) => {
      const mapping = STAT_ROUTE_MAPPINGS[title];
      if (mapping) {
        const { route, filters } = mapping;

        if (filters && Object.keys(filters).length > 0) {
          const searchParams = new URLSearchParams();
          Object.entries(filters).forEach(([key, value]) => {
            searchParams.set(key, value);
          });

          navigate(`${route}?${searchParams.toString()}`);
        } else {
          navigate(route);
        }
      }
    },
    [navigate]
  );

  const isContractAnalyticsRole =
    userRole === "contract_manager" || userRole === "approver";
  // project_manager handled separately below
  const canShowMyActions = modules?.myActions === true;
  const canShowGeneralUpdates = modules?.generalUpdatesNotifications === true;

  // Procurement's Contracts tab reuses the solicitation config's activity row
  // shells (My Actions / General Updates) but must render CONTRACT activity data
  // — not the solicitation data those rows carry — and must NOT render its
  // solicitation charts (Solicitation Status, Solicitations Vs Evaluations, etc.).
  const procurementContractsRows = useMemo(() => {
    const contractMyActions =
      DashboardDataTransformer.transformContractManagerDashboardActivity(
        contractManagerActionLogs
      );
    const contractGeneralUpdates =
      DashboardDataTransformer.transformContractManagerDashboardActivity(
        contractManagerGeneralUpdates
      );
    return enhancedDashboardConfig.rows
      .filter((row) => row.type === "activity")
      .map((row) => ({
        ...row,
        properties: row.properties.map((activity) => {
          if (activity.id === "my-actions") {
            return { ...activity, items: contractMyActions };
          }
          if (activity.id === "general-updates") {
            return { ...activity, items: contractGeneralUpdates };
          }
          return activity;
        }),
      }));
  }, [
    enhancedDashboardConfig.rows,
    contractManagerActionLogs,
    contractManagerGeneralUpdates,
  ]);

  if (isInitialLoading && LOADING_ROLES.has(userRole)) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>

        {/* Outer landing-tab strip — only shown when multiple tabs exist */}
        {landingTabs.length > 1 && activeLandingTab && (
          <Tabs
            value={activeLandingTab}
            onValueChange={(v) => setActiveLandingTab(v as LandingTabId)}
          >
            <TabsList className="bg-slate-100 rounded-full p-1.5 gap-3 h-12">
              {landingTabs.map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm",
                    "data-[state=active]:bg-[#2A4467] data-[state=active]:text-white",
                    "text-gray-600",
                  )}
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* project_manager: Contracts view — only when contractManagement is on */}
      {userRole === "project_manager" && activeLandingTab === "contracts" && (
        <VendorContractsView enabled />
      )}

      {/* contract_manager / approver: full analytics tabs (unchanged) */}
      {isContractAnalyticsRole && (
        <ContractsTabView
          topTab={cmTopTab}
          setTopTab={setCmTopTab}
          subTab={cmSubTab}
          setSubTab={setCmSubTab}
          stats={enhancedDashboardConfig.stats}
          rows={enhancedDashboardConfig.rows}
          cmYtdStats={cmYtdStats}
          cmCycleTimeValues={cmCycleTimeValues}
          chartFilters={chartFilters}
          contractManagerTotalCards={contractManagerTotalCards}
          contractManagerYtdCards={contractManagerYtdCards}
          contractManagerActionLogs={contractManagerActionLogs}
          contractManagerGeneralUpdates={contractManagerGeneralUpdates}
          contractManagerCycleTime={contractManagerCycleTime}
          contractManagerInvoiceStatus={contractManagerInvoiceStatus}
          contractManagerCommittedVsActualSpend={contractManagerCommittedVsActualSpend}
          contractManagerVendorContractValue={contractManagerVendorContractValue}
          contractManagerProjectContractValue={contractManagerProjectContractValue}
          contractManagerRiskDistribution={contractManagerRiskDistribution}
          contractManagerChangeOrderImpact={contractManagerChangeOrderImpact}
          contractManagerCategoryValue={contractManagerCategoryValue}
          contractManagerComplianceStatus={contractManagerComplianceStatus}
          contractManagerClauseIntelligence={contractManagerClauseIntelligence}
          contractManagerContractStatus={contractManagerContractStatus}
          contractManagerVendorSummary={contractManagerVendorSummary}
          contractManagerRenewals={contractManagerRenewals}
          contractManagerAiInsights={contractManagerAiInsights}
          isLoadingContractManagerAiInsights={isLoadingContractManagerAiInsights}
          canShowMyActions={canShowMyActions}
          canShowGeneralUpdates={canShowGeneralUpdates}
          onFilterChange={handleFilterChange}
          getChartFilter={getChartFilter}
          getChartData={getChartData}
          onStatCardClick={handleStatCardClick}
        />
      )}

      {/* procurement Contracts tab */}
      {userRole === "procurement" && activeLandingTab === "contracts" && (
        <ContractsTabView
          topTab={cmTopTab}
          setTopTab={setCmTopTab}
          subTab={cmSubTab}
          setSubTab={setCmSubTab}
          stats={cmTotalStats}
          rows={procurementContractsRows}
          cmYtdStats={cmYtdStats}
          cmCycleTimeValues={cmCycleTimeValues}
          chartFilters={chartFilters}
          contractManagerTotalCards={contractManagerTotalCards}
          contractManagerYtdCards={contractManagerYtdCards}
          contractManagerActionLogs={contractManagerActionLogs}
          contractManagerGeneralUpdates={contractManagerGeneralUpdates}
          contractManagerCycleTime={contractManagerCycleTime}
          contractManagerInvoiceStatus={contractManagerInvoiceStatus}
          contractManagerCommittedVsActualSpend={contractManagerCommittedVsActualSpend}
          contractManagerVendorContractValue={contractManagerVendorContractValue}
          contractManagerProjectContractValue={contractManagerProjectContractValue}
          contractManagerRiskDistribution={contractManagerRiskDistribution}
          contractManagerChangeOrderImpact={contractManagerChangeOrderImpact}
          contractManagerCategoryValue={contractManagerCategoryValue}
          contractManagerComplianceStatus={contractManagerComplianceStatus}
          contractManagerClauseIntelligence={contractManagerClauseIntelligence}
          contractManagerContractStatus={contractManagerContractStatus}
          contractManagerVendorSummary={contractManagerVendorSummary}
          contractManagerRenewals={contractManagerRenewals}
          contractManagerAiInsights={contractManagerAiInsights}
          isLoadingContractManagerAiInsights={isLoadingContractManagerAiInsights}
          canShowMyActions={canShowMyActions}
          canShowGeneralUpdates={canShowGeneralUpdates}
          onFilterChange={handleFilterChange}
          getChartFilter={getChartFilter}
          getChartData={getChartData}
          onStatCardClick={handleStatCardClick}
        />
      )}

      {/* vendor Contracts tab */}
      {userRole === "vendor" && activeLandingTab === "contracts" && (
        <VendorContractsView enabled />
      )}

      {/* company_admin: Contracts tab */}
      {userRole === "company_admin" && activeLandingTab === "contracts" && (
        <ContractsTabView
          topTab={cmTopTab}
          setTopTab={setCmTopTab}
          subTab={cmSubTab}
          setSubTab={setCmSubTab}
          stats={enhancedDashboardConfig.stats}
          rows={enhancedDashboardConfig.rows}
          cmYtdStats={cmYtdStats}
          cmCycleTimeValues={cmCycleTimeValues}
          chartFilters={chartFilters}
          contractManagerTotalCards={contractManagerTotalCards}
          contractManagerYtdCards={contractManagerYtdCards}
          contractManagerActionLogs={contractManagerActionLogs}
          contractManagerGeneralUpdates={contractManagerGeneralUpdates}
          contractManagerCycleTime={contractManagerCycleTime}
          contractManagerInvoiceStatus={contractManagerInvoiceStatus}
          contractManagerCommittedVsActualSpend={contractManagerCommittedVsActualSpend}
          contractManagerVendorContractValue={contractManagerVendorContractValue}
          contractManagerProjectContractValue={contractManagerProjectContractValue}
          contractManagerRiskDistribution={contractManagerRiskDistribution}
          contractManagerChangeOrderImpact={contractManagerChangeOrderImpact}
          contractManagerCategoryValue={contractManagerCategoryValue}
          contractManagerComplianceStatus={contractManagerComplianceStatus}
          contractManagerClauseIntelligence={contractManagerClauseIntelligence}
          contractManagerContractStatus={contractManagerContractStatus}
          contractManagerVendorSummary={contractManagerVendorSummary}
          contractManagerRenewals={contractManagerRenewals}
          contractManagerAiInsights={contractManagerAiInsights}
          isLoadingContractManagerAiInsights={isLoadingContractManagerAiInsights}
          canShowMyActions={canShowMyActions}
          canShowGeneralUpdates={canShowGeneralUpdates}
          onFilterChange={handleFilterChange}
          getChartFilter={getChartFilter}
          getChartData={getChartData}
          onStatCardClick={handleStatCardClick}
        />
      )}

      {/* Stats Cards — shown for all non-analytics roles on their primary tab */}
      {!isContractAnalyticsRole &&
        userRole !== "project_manager" &&
        !(userRole === "company_admin" && activeLandingTab === "contracts") &&
        !(userRole === "procurement" && activeLandingTab === "contracts") &&
        !(userRole === "vendor" && activeLandingTab === "contracts") && (
        <div
          className={cn(`grid grid-cols-1 md:grid-cols-2 gap-6`, {
            "lg:grid-cols-2": enhancedDashboardConfig.stats.length === 8,
            "lg:grid-cols-3": enhancedDashboardConfig.stats.length === 6,
            "lg:grid-cols-4":
              enhancedDashboardConfig.stats.length === 4 ||
              enhancedDashboardConfig.stats.length > 8,
          })}
        >
          {enhancedDashboardConfig.stats?.map?.((stat, index) => (
            <CardStats
              key={`${stat.title}-${index}`}
              {...stat}
              onClick={() => handleStatCardClick(stat.title)}
            />
          ))}
        </div>
      )}
      

      {/* Activities and Charts Section */}
      {!isContractAnalyticsRole &&
        userRole !== "project_manager" &&
        !(userRole === "company_admin" && activeLandingTab === "contracts") &&
        !(userRole === "procurement" && activeLandingTab === "contracts") &&
        !(userRole === "vendor" && activeLandingTab === "contracts") &&
        enhancedDashboardConfig.rows?.map?.((item, rowIndex) => {
        if (item.type === "activity") {
          const gatedActivities = item.properties.filter((activity) => {
            if (activity.id === "my-actions" && !canShowMyActions) {
              return false;
            }
            if (
              activity.id === "general-updates" &&
              !canShowGeneralUpdates
            ) {
              return false;
            }
            return true;
          });
          return (
            <div
              key={`activity-row-${rowIndex}`}
              className={cn(
                "grid grid-cols-1 lg:grid-cols-2 gap-6",
                item.className
              )}
            >
              {gatedActivities.map((activity, index) => (
                <ActivityComponent key={index} activity={activity} />
              ))}
            </div>
          );
        } else if (item.type === "chart") {
          return (
            <div
              key={`chart-row-${rowIndex}`}
              className={cn(
                "grid grid-cols-1 lg:grid-cols-2 gap-6",
                item.className
              )}
            >
              {item.properties?.map?.((chart) => (
                <ChartComponent
                  key={chart.id}
                  chart={chart}
                  selected={getChartFilter(chart.id)}
                  onFilterChange={(filter) =>
                    handleFilterChange(chart.id, filter)
                  }
                  chartData={getChartData ? getChartData(chart.id) : chart.data}
                />
              ))}
            </div>
          );
        } else if (item.type === "mixed") {
          return (
            <div
              key={`mixed-row-${rowIndex}`}
              className={cn(
                "grid grid-cols-1 lg:grid-cols-2 gap-6",
                item.className
              )}
            >
              {item.properties
                ?.filter?.((component) => {
                  if (
                    component.items &&
                    component.title === "General Updates" &&
                    !canShowGeneralUpdates
                  ) {
                    return false;
                  }
                  if (
                    component.items &&
                    component.id === "my-actions" &&
                    !canShowMyActions
                  ) {
                    return false;
                  }
                  return true;
                })
                ?.map?.((component, index) => {
                  // Check if component has activity-specific properties
                  if (component.items) {
                    return (
                      <ActivityComponent
                        key={`activity-${index}`}
                        activity={component}
                      />
                    );
                  } else {
                    // Assume it's a chart component
                    return (
                      <ChartComponent
                        key={`chart-${component.id || index}`}
                        chart={component}
                        selected={getChartFilter(
                          component.id || `chart-${index}`
                        )}
                        onFilterChange={(filter) =>
                          handleFilterChange(
                            component.id || `chart-${index}`,
                            filter
                          )
                        }
                        chartData={
                          getChartData
                            ? getChartData(component.id || `chart-${index}`)
                            : component.data
                        }
                      />
                    );
                  }
                })}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default RoleBasedDashboard;
