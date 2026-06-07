import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError, UserRole } from "@/types";
import { DashboardDataTransformer } from "@/lib/dashboardDataTransformer";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";

// Dashboard data types based on API documentation
export interface SuperAdminDashboardCount {
  company: {
    activeCompanies: number;
    allCompanies: number;
    suspendedCompanies: number;
    totalAdmins: number;
    superAdmins: number;
    companyAdmins: number;
  };
  users: {
    super_admin: number;
    company_admin: number;
  };
}

export interface RoleDistribution {
  roleName: string;
  count: string;
}

export interface TimeStats {
  timeStats: TimeStat[];
}

export interface TimeStat {
  label: string;
  total: number;
  active: number;
  expiring: number;
}

export interface WeeklyActivities {
  solicitations: any[];
  evaluations: any[];
}

export interface SubDistribution {
  totalActive: number;
  distribution: Distribution[];
}

export interface Distribution {
  count: number;
  plan: string;
}

export interface SolicitationStatusData {
  total: number;
  // Percentage fields (fractional, summing to 100) — kept for back-compat.
  awarded: number;
  active: number;
  evaluating: number;
  closed: number;
  draft: number;
  percentage: number;
  // Integer count fields returned alongside the percentages — these are
  // what the dashboard pie consumes so the slices reflect real counts.
  activeSol?: number;
  closedSol?: number;
  awardedSol?: number;
}

export interface VendorsDistributionData {
  pending: { count: number; percentage: number };
  inactive: { count: number; percentage: number };
  active: { count: number; percentage: number };
  total: number;
}

// Evaluator Dashboard Data Types
export interface EvaluatorDashboardData {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  pending: number;
  completed: number;
  draft: number;
}

export interface EvaluatorMyActions {
  // Based on MyAction schema from API
  [key: string]: any;
}

export interface EvaluatorEvaluationActivity {
  // Based on EvaluationActivity schema from API
  [key: string]: any;
}

// Vendor Dashboard Data Types
export interface VendorMyActions {
  action: string;
  solicitationId: string;
  solicitation?: {
    _id: string;
    name: string;
    timezone?: string;
    vendors: {
      status: string;
    }[];
  };
  evaluation?: {
    _id: string;
    name: string;
    solicitation?: {
      _id: string;
      name: string;
    };
  };
  campaign?: {
    subject: string;
    subtitle?: string;
    message: string;
    recipientType: "all_users" | "selected_users" | "company_users" | "specific_users" | "vendors" | "evaluators" | "procurement_lead";
    users?: string[];
    bannerUrl?: string;
    campaignType: string;
    createdAt: string;
  };
  _id: string;
  statusText: string;
  createdAt: string;
}

export interface VendorGeneralUpdates {
  [key: string]: any;
}

export interface VendorDashboardStats {
  status: string;
  count: number;
}

export interface ModuleUsage {
  evaluationUsage: number;
  adendumUsage: number;
  solicitationUsage: number;
  vendorUage: number;
}

export interface CompanyStatus {
  month: string;
  active: number;
  suspended: number;
  pending: number;
}

export type ContractManagerTrendDirection = "up" | "down" | "none";

export type ContractManagerCountTrend = {
  value: number;
  change: number;
  trend: ContractManagerTrendDirection;
};

export type ContractManagerMoney = {
  value: number;
  currency: string;
};

export type ContractManagerMoneyTrend = {
  value: number;
  change: number;
  trend: ContractManagerTrendDirection;
};

export type ContractManagerCommittedVsActual = {
  committed: number;
  actual: number;
  percentage: number;
  trend: ContractManagerMoneyTrend;
};

export type ContractManagerSavingsRealized = {
  value: number;
  percentage: number;
  trend: ContractManagerMoneyTrend;
};

export type ContractManagerUpcomingRenewals = {
  count: number;
  days: number;
};

export type ContractManagerHighRiskContracts = {
  count: number;
};

export type ContractManagerHoldbacks = {
  value: number;
  trend: ContractManagerMoneyTrend;
};

export type ContractManagerDashboardCards = {
  allContracts: ContractManagerCountTrend;
  activeContracts: ContractManagerCountTrend;
  draftContracts: ContractManagerCountTrend;
  suspendedContracts: ContractManagerCountTrend;
  expiredContracts: ContractManagerCountTrend;
  terminatedContracts: ContractManagerCountTrend;
  totalContractValue: ContractManagerMoney;
  committedVsActual: ContractManagerCommittedVsActual;
  savingsRealized: ContractManagerSavingsRealized;
  upcomingRenewals: ContractManagerUpcomingRenewals;
  highRiskContracts: ContractManagerHighRiskContracts;
  holdbacks: ContractManagerHoldbacks;
};

export type ContractManagerDashboardActivityItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  requestedBy: string;
  contractTitle: string;
  createdAt: string;
  type: string;
};

export type ContractManagerDashboardResponse<T> = {
  message?: string;
  data?: T;
};

export type ContractAiInsight = {
  type: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  count: number;
  value?: number;
};

export type ContractManagerCycleTimeStage = {
  name: string;
  days: number;
  percentage: number;
};

export type ContractManagerCycleTime = {
  stages: ContractManagerCycleTimeStage[];
  bottleneck?: { stage: string; days: number; reason: string };
};

export type ContractManagerInvoiceStatus = {
  approved: number;
  pending: number;
  rejected: number;
};

export type ContractManagerCommittedVsActualSpend = {
  committed: number;
  actual: number;
  percentage: number;
};

export type ContractManagerValueByEntity = {
  name: string;
  value: number;
  contractCount: number;
};

export type ContractManagerRiskDistribution = {
  low: number;
  medium: number;
  high: number;
};

export type ContractManagerChangeOrderImpact = {
  totalCOs: number;
  valueIncrease: number;
  percentageIncrease: number;
  chartData: Array<{ date: string; original: number; revised: number }>;
};

export type ContractManagerComplianceStatus = {
  insuranceActive: { current: number; total: number; percentage: number };
  securitySubmission: { current: number; total: number; percentage: number };
  missedApprovals: number;
  ncrs: number;
  auditTrailCompleteness: number;
};

export type ContractManagerClauseIntelligence = {
  completionPercentage: number;
  mostNegotiatedClauses: Array<{ category: string; count: number }>;
  highRiskClauseTypes: Array<{
    category: string;
    contracts: number;
    severity: string;
  }>;
};

export type ContractManagerContractStatus = {
  active: number;
  pendingApproval: number;
  completed: number;
  terminated: number;
  suspended: number;
  draft: number;
};

export type ContractManagerVendorSummary = {
  layout: { title: string; columns: string[] };
  rows: Array<{
    vendor?: string;
    contracts?: number;
    riskScore?: number;
    claims?: number;
    changeOrders?: number;
    performance?: string;
  }>;
  summary?: unknown;
};

export type ContractManagerRenewals = {
  timeline: Array<{
    contractRef: string;
    contractTitle: string;
    contractCode: string;
    vendor: string;
    value: number;
    daysToExpiry: number;
    timelineStatus: string;
    label: string;
    stage: string;
  }>;
  actions?: unknown[];
  summary?: unknown;
};

/**
 * Custom hook for fetching dashboard data based on user role
 * Implements API integration for SuperAdmin and other roles
 */
export const useDashboardData = (
  userRole: UserRole,
  chartFilters: Record<string, string> = {}
) => {
  const defaultFilter = "12months";
  const contractDashboardDefaultFilter = "ytd";

  // Helper function to get filter for a specific chart
  const getFilterForChart = (chartId: string) => {
    return chartFilters[chartId] || defaultFilter;
  };
  const isContractDashboardRole =
    userRole === "contract_manager" ||
    userRole === "approver" ||
    userRole === "procurement";
  const contractDashboardBasePath =
    userRole === "approver"
      ? "/contract/approver/contracts/dashboard"
      : "/contract/manager/contracts/dashboard";

  const getContractDashboardRange = (chartId: string) => {
    return chartFilters[chartId] || contractDashboardDefaultFilter;
  };

  const toContractDashboardRangeParam = (range: string) => {
    return range === "ytd" ? "YTD" : range;
  };

  // SuperAdmin dashboard count
  const { data: dashboardCount, isLoading: isLoadingCount } = useQuery<
    ApiResponse<SuperAdminDashboardCount>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey(["dashboard-count", userRole]),
    queryFn: async () => await getRequest({ url: "/companies/dashboard" }),
    enabled: userRole === "super_admin",
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Role distribution data
  const { data: roleDistribution, isLoading: isLoadingRoles } = useQuery<
    ApiResponse<RoleDistribution[]>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey([
      "role-distribution",
      userRole,
      getFilterForChart("role-distribution"),
    ]),
    queryFn: async () =>
      await getRequest({
        url: "/companies/dashboard/role-distribution",
        config: {
          params: { range: getFilterForChart("role-distribution") },
        },
      }),
    enabled: userRole === "super_admin",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Weekly activities data
  const { data: weeklyActivities, isLoading: isLoadingActivities } = useQuery<
    ApiResponse<WeeklyActivities>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey([
      "weekly-activities",
      userRole,
      getFilterForChart("weekly-activities"),
    ]),
    queryFn: async () =>
      await getRequest({
        url: "/companies/dashboard/weekly-activities",
        config: {
          params: { range: getFilterForChart("weekly-activities") },
        },
      }),
    enabled: userRole === "super_admin",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Subscription distribution data
  const { data: subDistribution, isLoading: isLoadingSubs } = useQuery<
    ApiResponse<SubDistribution>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey([
      "sub-distribution",
      userRole,
      getFilterForChart("sub-distribution"),
    ]),
    queryFn: async () =>
      await getRequest({
        url: "/companies/dashboard/sub-distribution",
        config: {
          params: { range: getFilterForChart("sub-distribution") },
        },
      }),
    enabled: userRole === "super_admin",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Company status data
  const { data: companyStatus, isLoading: isLoadingStatus } = useQuery<
    ApiResponse<{ timeStats: TimeStat[] }[]>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey(["company-status", userRole, getFilterForChart("company-status")]),
    queryFn: async () =>
      await getRequest({
        url: "/companies/dashboard/company-status",
        config: {
          params: { range: getFilterForChart("company-status") },
        },
      }),
    enabled: userRole === "super_admin",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Module usage data
  const { data: moduleUsage, isLoading: isLoadingModules } = useQuery<
    ApiResponse<ModuleUsage>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey(["module-usage", userRole, getFilterForChart("module-usage")]),
    queryFn: async () =>
      await getRequest({
        url: "/companies/dashboard/module-usage",
        config: {
          params: { range: getFilterForChart("module-usage") },
        },
      }),
    enabled: userRole === "super_admin",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Company Admin Analytics - Solicitation Status
  const { data: solicitationStatus, isLoading: isLoadingSolicitationStatus } =
    useQuery<ApiResponse<SolicitationStatusData>, ApiResponseError>({
      queryKey: useUserQueryKey([
        "solicitation-status",
        userRole,
        getFilterForChart("solicitation-status"),
      ]),
      queryFn: async () =>
        await getRequest({
          url: "/procurement/solicitations/analytics/status",
          config: {
            params: { range: getFilterForChart("solicitation-status") },
          },
        }),
      enabled: ["company_admin", "procurement"].includes(userRole),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });

  // Company Admin and Procurement Analytics - Bid Intent
  const { data: bidIntent, isLoading: isLoadingBidIntent } = useQuery<
    ApiResponse<any>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey(["bid-intent", userRole, getFilterForChart("bid-intent")]),
    queryFn: async () =>
      await getRequest({
        url: "/procurement/solicitations/analytics/bid-intent",
        config: {
          params: { range: getFilterForChart("bid-intent") },
        },
      }),
    enabled: ["company_admin", "procurement"].includes(userRole),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Company Admin Analytics - Vendors Distribution
  const { data: vendorsDistribution, isLoading: isLoadingVendorsDistribution } =
    useQuery<ApiResponse<VendorsDistributionData>, ApiResponseError>({
      queryKey: useUserQueryKey([
        "vendors-distribution",
        userRole,
        getFilterForChart("vendors-distribution"),
      ]),
      queryFn: async () =>
        await getRequest({
          url: "/procurement/solicitations/analytics/vendors-distribution",
          config: {
            params: { range: getFilterForChart("vendors-distribution") },
          },
        }),
      enabled: ["company_admin", "procurement"].includes(userRole),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });

  // Company Admin and Procurement Analytics - Proposal Submission
  const { data: proposalSubmission, isLoading: isLoadingProposalSubmission } =
    useQuery<ApiResponse<any>, ApiResponseError>({
      queryKey: useUserQueryKey([
        "proposal-submission",
        userRole,
        getFilterForChart("proposal-submission"),
      ]),
      queryFn: async () =>
        await getRequest({
          url: "/procurement/solicitations/analytics/proposal-submission",
          config: {
            params: { range: getFilterForChart("proposal-submission") },
          },
        }),
      enabled: ["company_admin", "procurement"].includes(userRole),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });



  // Company Admin - Role Distribution
  const {
    data: companyRoleDistribution,
    isLoading: isLoadingCompanyRoleDistribution,
  } = useQuery<ApiResponse<any>, ApiResponseError>({
    queryKey: useUserQueryKey([
      "company-role-distribution",
      userRole,
      getFilterForChart("company-role-distribution"),
    ]),
    queryFn: async () =>
      await getRequest({
        url: "/admins/dashboard/role-distribution",
        config: {
          params: { range: getFilterForChart("company-role-distribution") },
        },
      }),
    enabled: userRole === "company_admin",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Company Admin - General Updates
  const { data: generalUpdates, isLoading: isLoadingGeneralUpdates } = useQuery<
    ApiResponse<any>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey(["general-updates", userRole]),
    queryFn: async () =>
      await getRequest({ url: "/admins/dashboard/general-updates" }),
    enabled: userRole === "company_admin",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Evaluator Dashboard - Evaluation Status Summary
  const { data: evaluatorDashboard, isLoading: isLoadingEvaluatorDashboard } =
    useQuery<ApiResponse<EvaluatorDashboardData>, ApiResponseError>({
      queryKey: useUserQueryKey(["evaluator-dashboard", userRole]),
      queryFn: async () =>
        await getRequest({ url: "/procurement/evaluations/dashboard" }),
      enabled: userRole === "evaluator",
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });

  // Evaluator Dashboard - My Actions
  const { data: evaluatorMyActions, isLoading: isLoadingEvaluatorMyActions } =
    useQuery<ApiResponse<EvaluatorMyActions>, ApiResponseError>({
      queryKey: useUserQueryKey(["evaluator-my-actions", userRole]),
      queryFn: async () =>
        await getRequest({ url: "/evaluator/dashboard/my-actions" }),
      enabled: userRole === "evaluator",
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });

  // Evaluator Dashboard - Evaluation Updates
  const {
    data: evaluatorEvaluationUpdates,
    isLoading: isLoadingEvaluatorEvaluationUpdates,
  } = useQuery<ApiResponse<EvaluatorEvaluationActivity>, ApiResponseError>({
    queryKey: useUserQueryKey(["evaluator-evaluation-updates", userRole]),
    queryFn: async () =>
      await getRequest({ url: "/evaluator/dashboard/evalutions-update" }),
    enabled: userRole === "evaluator",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Vendor Dashboard - Solicitation Overview
  const { data: vendorDashboard, isLoading: isLoadingVendorDashboard } =
    useQuery<ApiResponse<VendorDashboardStats[]>, ApiResponseError>({
      queryKey: useUserQueryKey(["vendor-dashboard", userRole]),
      queryFn: async () =>
        await getRequest({ url: "/vendor/solicitations/invitation/dashboard" }),
      enabled: userRole === "vendor",
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });

  // Vendor Dashboard - My Actions
  const { data: vendorMyActions, isLoading: isLoadingVendorMyActions } =
    useQuery<ApiResponse<VendorMyActions[]>, ApiResponseError>({
      queryKey: useUserQueryKey(["vendor-my-actions", userRole]),
      queryFn: async () =>
        await getRequest({ url: "/vendor/solicitations/my-actions" }),
      enabled: userRole === "vendor",
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });

  // Vendor Dashboard - General Updates
  const {
    data: vendorGeneralUpdates,
    isLoading: isLoadingVendorGeneralUpdates,
  } = useQuery<ApiResponse<VendorGeneralUpdates>, ApiResponseError>({
    queryKey: useUserQueryKey(["vendor-general-updates", userRole]),
    queryFn: async () =>
      await getRequest({ url: "/vendor/solicitations/general-updates" }),
    enabled: userRole === "vendor",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // For other roles, we can add similar queries here
  // Example for procurement role (if needed):
  const { data: procurementDashboard, isLoading: isLoadingProcurement } =
    useQuery<ApiResponse<any>, ApiResponseError>({
    queryKey: useUserQueryKey(["procurement-dashboard", userRole]),
      queryFn: async () =>
        await getRequest({ url: "/procurement/solicitations/dashboard" }),
      enabled: userRole === "procurement",
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });

  // Procurement Analytics - Weekly Activities
  const {
    data: procurementWeeklyActivities,
    isLoading: isLoadingProcurementWeeklyActivities,
  } = useQuery<ApiResponse<any>, ApiResponseError>({
    queryKey: useUserQueryKey([
      "solicitation-activities",
      userRole,
      getFilterForChart("solicitation-activities"),
    ]),
    queryFn: async () =>
      await getRequest({
        url: "/procurement/solicitations/analytics/activities",
        config: {
          params: { range: getFilterForChart("solicitation-activities") },
        },
      }),
    enabled: userRole === "procurement",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Procurement Analytics - Total Evaluations
  const {
    data: procurementTotalEvaluations,
    isLoading: isLoadingProcurementTotalEvaluations,
  } = useQuery<ApiResponse<any>, ApiResponseError>({
    queryKey: useUserQueryKey([
      "procurement-total-evaluations",
      userRole,
      getFilterForChart("total-evaluation"),
    ]),
    queryFn: async () =>
      await getRequest({
        url: "/procurement/solicitations/analytics/total-evaluations",
        config: {
          params: { range: getFilterForChart("total-evaluation") },
        },
      }),
    enabled: userRole === "procurement",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Procurement My Actions
  const {
    data: procurementMyActions,
    isLoading: isLoadingProcurementMyActions,
  } = useQuery<ApiResponse<any>, ApiResponseError>({
    queryKey: useUserQueryKey(["procurement-my-actions", userRole]),
    queryFn: async () =>
      await getRequest({ url: "/procurement/solicitations/my-actions" }),
    enabled: userRole === "procurement",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Procurement General Updates
  const {
    data: procurementGeneralUpdates,
    isLoading: isLoadingProcurementGeneralUpdates,
  } = useQuery<ApiResponse<any>, ApiResponseError>({
    queryKey: useUserQueryKey(["procurement-general-updates", userRole]),
    queryFn: async () =>
      await getRequest({ url: "/procurement/solicitations/general-updates" }),
    enabled: userRole === "procurement",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerTotalCards,
    isLoading: isLoadingContractManagerTotalCards,
  } = useQuery<ContractManagerDashboardResponse<ContractManagerDashboardCards>, ApiResponseError>({
    queryKey: useUserQueryKey(["contract-manager-dashboard-cards-total", userRole]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/cards/total`,
        config: { params: { type: "Contract" } },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerDashboardCards>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerYtdCards,
    isLoading: isLoadingContractManagerYtdCards,
  } = useQuery<ContractManagerDashboardResponse<ContractManagerDashboardCards>, ApiResponseError>({
    queryKey: useUserQueryKey(["contract-manager-dashboard-cards-ytd", userRole]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/cards/ytd`,
        config: { params: { type: "Contract" } },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerDashboardCards>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerActionLogs,
    isLoading: isLoadingContractManagerActionLogs,
  } = useQuery<
    ContractManagerDashboardResponse<ContractManagerDashboardActivityItem[]>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey(["contract-manager-dashboard-action-logs", userRole]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/action-logs`,
        config: { params: { type: "Contract" } },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerDashboardActivityItem[]>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerGeneralUpdates,
    isLoading: isLoadingContractManagerGeneralUpdates,
  } = useQuery<
    ContractManagerDashboardResponse<ContractManagerDashboardActivityItem[]>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey(["contract-manager-dashboard-general-updates", userRole]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/general-updates`,
        config: { params: { type: "Contract" } },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerDashboardActivityItem[]>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerCycleTime,
    isLoading: isLoadingContractManagerCycleTime,
  } = useQuery<
    ContractManagerDashboardResponse<ContractManagerCycleTime>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey([
      "contract-manager-dashboard-cycle-time",
      userRole,
      getContractDashboardRange("cycle-time"),
    ]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/cycle-time`,
        config: {
          params: {
            range: toContractDashboardRangeParam(
              getContractDashboardRange("cycle-time"),
            ),
            type: "Contract",
          },
        },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerCycleTime>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerInvoiceStatus,
    isLoading: isLoadingContractManagerInvoiceStatus,
  } = useQuery<
    ContractManagerDashboardResponse<ContractManagerInvoiceStatus>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey([
      "contract-manager-dashboard-invoice-status",
      userRole,
      getContractDashboardRange("invoice-status"),
    ]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/invoice-status`,
        config: {
          params: {
            range: toContractDashboardRangeParam(
              getContractDashboardRange("invoice-status"),
            ),
            type: "Contract",
          },
        },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerInvoiceStatus>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerCommittedVsActualSpend,
    isLoading: isLoadingContractManagerCommittedVsActualSpend,
  } = useQuery<
    ContractManagerDashboardResponse<ContractManagerCommittedVsActualSpend>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey([
      "contract-manager-dashboard-committed-vs-actual",
      userRole,
      getContractDashboardRange("committed-vs-actual"),
    ]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/committed-vs-actual`,
        config: {
          params: {
            range: toContractDashboardRangeParam(
              getContractDashboardRange("committed-vs-actual"),
            ),
            type: "Contract",
          },
        },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerCommittedVsActualSpend>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerVendorContractValue,
    isLoading: isLoadingContractManagerVendorContractValue,
  } = useQuery<
    ContractManagerDashboardResponse<ContractManagerValueByEntity[]>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey([
      "contract-manager-dashboard-vendor-contract-value",
      userRole,
      getContractDashboardRange("vendor-contract-value"),
    ]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/vendor-contract-value`,
        config: {
          params: {
            range: toContractDashboardRangeParam(
              getContractDashboardRange("vendor-contract-value"),
            ),
            type: "Contract",
          },
        },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerValueByEntity[]>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerProjectContractValue,
    isLoading: isLoadingContractManagerProjectContractValue,
  } = useQuery<
    ContractManagerDashboardResponse<ContractManagerValueByEntity[]>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey([
      "contract-manager-dashboard-project-contract-value",
      userRole,
      getContractDashboardRange("project-contract-value"),
    ]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/project-contract-value`,
        config: {
          params: {
            range: toContractDashboardRangeParam(
              getContractDashboardRange("project-contract-value"),
            ),
            type: "Contract",
          },
        },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerValueByEntity[]>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerRiskDistribution,
    isLoading: isLoadingContractManagerRiskDistribution,
  } = useQuery<
    ContractManagerDashboardResponse<ContractManagerRiskDistribution>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey([
      "contract-manager-dashboard-risk-distribution",
      userRole,
      getContractDashboardRange("risk-distribution"),
    ]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/risk-distribution`,
        config: {
          params: {
            range: toContractDashboardRangeParam(
              getContractDashboardRange("risk-distribution"),
            ),
            type: "Contract",
          },
        },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerRiskDistribution>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerChangeOrderImpact,
    isLoading: isLoadingContractManagerChangeOrderImpact,
  } = useQuery<
    ContractManagerDashboardResponse<ContractManagerChangeOrderImpact>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey(["contract-manager-dashboard-change-order-impact", userRole]),
    queryFn: async () => {
      const res = await getRequest({
        // swagger spelling drift: manager uses `change-order-impact`,
        // approver uses `changes-order-impact` (plural)
        url: `${contractDashboardBasePath}/${userRole === "approver" ? "changes-order-impact" : "change-order-impact"}`,
        config: { params: { range: "YTD", type: "Contract" } },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerChangeOrderImpact>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerCategoryValue,
    isLoading: isLoadingContractManagerCategoryValue,
  } = useQuery<
    ContractManagerDashboardResponse<ContractManagerValueByEntity[]>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey(["contract-manager-dashboard-category-value", userRole]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/category-value`,
        config: { params: { range: "YTD", type: "Contract" } },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerValueByEntity[]>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerComplianceStatus,
    isLoading: isLoadingContractManagerComplianceStatus,
  } = useQuery<
    ContractManagerDashboardResponse<ContractManagerComplianceStatus>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey(["contract-manager-dashboard-compliance-status", userRole]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/compliance-status`,
        config: { params: { range: "YTD", type: "Contract" } },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerComplianceStatus>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerClauseIntelligence,
    isLoading: isLoadingContractManagerClauseIntelligence,
  } = useQuery<
    ContractManagerDashboardResponse<ContractManagerClauseIntelligence>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey(["contract-manager-dashboard-clause-intelligence", userRole]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/clause-intelligence`,
        config: { params: { type: "Contract" } },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerClauseIntelligence>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerContractStatus,
    isLoading: isLoadingContractManagerContractStatus,
  } = useQuery<
    ContractManagerDashboardResponse<ContractManagerContractStatus>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey(["contract-manager-dashboard-contract-status", userRole]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/contract-status`,
        config: { params: { range: "YTD", type: "Contract" } },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerContractStatus>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // AI Insights & Alerts (manager-only endpoint; approver base path has no equivalent).
  const {
    data: contractManagerAiInsights,
    isLoading: isLoadingContractManagerAiInsights,
  } = useQuery<
    ContractManagerDashboardResponse<ContractAiInsight[]>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey(["contract-manager-dashboard-ai-insights", userRole]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/ai-insights`,
        config: { params: { type: "Contract" } },
      });
      return res.data as ContractManagerDashboardResponse<ContractAiInsight[]>;
    },
    enabled: userRole === "contract_manager",
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerVendorSummary,
    isLoading: isLoadingContractManagerVendorSummary,
  } = useQuery<
    ContractManagerDashboardResponse<ContractManagerVendorSummary>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey(["contract-manager-dashboard-vendor-summary", userRole]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/vendor-summary`,
        config: { params: { type: "Contract" } },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerVendorSummary>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: contractManagerRenewals,
    isLoading: isLoadingContractManagerRenewals,
  } = useQuery<
    ContractManagerDashboardResponse<ContractManagerRenewals>,
    ApiResponseError
  >({
    queryKey: useUserQueryKey(["contract-manager-dashboard-renewals", userRole]),
    queryFn: async () => {
      const res = await getRequest({
        url: `${contractDashboardBasePath}/renewals`,
        config: { params: { type: "Contract" } },
      });
      return res.data as ContractManagerDashboardResponse<ContractManagerRenewals>;
    },
    enabled: isContractDashboardRole,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Function to get chart-specific data
  const getChartData = (chartId?: string) => {
    if (!chartId) return [];
    // const filter = getFilterForChart(chartId);

    // Map chart IDs to their corresponding data with proper transformation
    switch (chartId) {
      case "portal-role-distribution":
        return DashboardDataTransformer.transformRoleDistribution(
          roleDistribution?.data?.data
        );
      case "weekly-activities":
        return DashboardDataTransformer.transformWeeklyActivities(
          weeklyActivities?.data?.data
        );
      case "sub-distribution":
        return DashboardDataTransformer.transformSubDistribution(
          subDistribution?.data?.data
        );
      case "company-status": {
        const companyStatusData = companyStatus?.data?.data;
        if (Array.isArray(companyStatusData) && companyStatusData.length > 0) {
          if (companyStatusData[0]?.timeStats) {
            return DashboardDataTransformer.transformCompanyStatus(
              companyStatusData[0]
            );
          }
          return DashboardDataTransformer.transformCompanyStatus(companyStatusData);
        }
        return DashboardDataTransformer.transformCompanyStatus(undefined);
      }
      case "module-usage": {
        const moduleUsageData = moduleUsage?.data?.data;
        return DashboardDataTransformer.transformModuleUsage(moduleUsageData);
      }
      case "solicitation-status": {
        const solicitationStatusData = solicitationStatus?.data?.data;
        return DashboardDataTransformer.transformSolicitationStatusChart(
          solicitationStatusData
        );
      }
      case "vendors-bid-intent-status":
        return DashboardDataTransformer.transformBidIntentChart(
          bidIntent?.data?.data
        );
      case "vendors-intent-status":
        return DashboardDataTransformer.transformBidIntentChart(
          bidIntent?.data?.data
        );
      case "vendors-distribution":
        return DashboardDataTransformer.transformVendorsDistribution(
          vendorsDistribution?.data?.data
        );
      case "proposal-submission":
        return DashboardDataTransformer.transformProposalSubmission(
          proposalSubmission?.data?.data
        );
      case "role-distribution":
        return DashboardDataTransformer.transformRoleDistribution(
          companyRoleDistribution?.data?.data
        );
      case "company-role-distribution":
        return DashboardDataTransformer.transformRoleDistribution(
          companyRoleDistribution?.data?.data
        );
      case "procurement-solicitation-status":
        return DashboardDataTransformer.transformChartData(
          "solicitation-status",
          solicitationStatus?.data?.data
        );
      case "procurement-bid-intent":
        return DashboardDataTransformer.transformChartData(
          "bid-intent",
          bidIntent?.data?.data
        );
      case "procurement-vendors-distribution":
        return DashboardDataTransformer.transformChartData(
          "vendors-distribution",
          vendorsDistribution?.data?.data
        );

      case "procurement-proposal-submission":
        return DashboardDataTransformer.transformChartData(
          "proposal-submission",
          proposalSubmission?.data?.data,
          "line"
        );
      case "solicitation-activities":
        return DashboardDataTransformer.transformChartData(
          "solicitation-activities",
          procurementWeeklyActivities?.data?.data,
          "area"
        );
      case "total-evaluation": {
        const resp = procurementTotalEvaluations?.data?.data;
        return DashboardDataTransformer.transformChartData(
          "total-evaluation",
          resp,
          "bar"
        );
      }
      default:
        return [];
    }
  };

  const isLoading =
    isLoadingCount ||
    isLoadingRoles ||
    isLoadingActivities ||
    isLoadingSubs ||
    isLoadingStatus ||
    isLoadingModules ||
    isLoadingProcurement ||
    isLoadingSolicitationStatus ||
    isLoadingBidIntent ||
    isLoadingVendorsDistribution ||
    isLoadingProposalSubmission ||
    isLoadingCompanyRoleDistribution ||
    isLoadingGeneralUpdates ||
    isLoadingEvaluatorDashboard ||
    isLoadingEvaluatorMyActions ||
    isLoadingEvaluatorEvaluationUpdates ||
    isLoadingVendorDashboard ||
    isLoadingVendorMyActions ||
    isLoadingVendorGeneralUpdates ||
    isLoadingProcurementMyActions ||
    isLoadingProcurementGeneralUpdates ||
    // isLoadingProcurementSolicitationStatus ||
    // isLoadingProcurementBidIntent ||
    // isLoadingProcurementVendorsDistribution ||
    isLoadingProcurementWeeklyActivities ||
    isLoadingProcurementTotalEvaluations ||
    isLoadingContractManagerTotalCards ||
    isLoadingContractManagerYtdCards ||
    isLoadingContractManagerActionLogs ||
    isLoadingContractManagerGeneralUpdates ||
    isLoadingContractManagerCycleTime ||
    isLoadingContractManagerInvoiceStatus ||
    isLoadingContractManagerCommittedVsActualSpend ||
    isLoadingContractManagerVendorContractValue ||
    isLoadingContractManagerProjectContractValue ||
    isLoadingContractManagerRiskDistribution ||
    isLoadingContractManagerChangeOrderImpact ||
    isLoadingContractManagerCategoryValue ||
    isLoadingContractManagerComplianceStatus ||
    isLoadingContractManagerClauseIntelligence ||
    isLoadingContractManagerContractStatus ||
    isLoadingContractManagerAiInsights ||
    isLoadingContractManagerVendorSummary ||
    isLoadingContractManagerRenewals;

  // Initial-paint gate: block the dashboard only until the role's PRIMARY
  // stats query resolves — NOT until every chart/activity query finishes.
  // The stat cards (above the fold) all derive from this single query per
  // role; charts and activity panels render their own card shells and stream
  // in afterward. This is what turns a multi-second blank spinner (the slowest
  // of ~6-17 parallel calls) into an instant first paint.
  const isInitialLoading =
    (userRole === "super_admin" && isLoadingCount) ||
    (userRole === "company_admin" && isLoadingSolicitationStatus) ||
    (userRole === "procurement" && isLoadingProcurement) ||
    (userRole === "evaluator" && isLoadingEvaluatorDashboard) ||
    (userRole === "vendor" && isLoadingVendorDashboard);

  return {
    // SuperAdmin data
    dashboardCount: dashboardCount?.data?.data,
    roleDistribution: roleDistribution?.data?.data,
    weeklyActivities: weeklyActivities?.data?.data,
    subDistribution: subDistribution?.data?.data,
    companyStatus: companyStatus?.data?.data,
    moduleUsage: moduleUsage?.data?.data,

    // Company Admin data
    solicitationStatus: solicitationStatus?.data?.data,
    bidIntent: bidIntent?.data?.data,
    vendorsDistribution: vendorsDistribution?.data?.data,
    proposalSubmission: proposalSubmission?.data?.data,

    companyRoleDistribution: companyRoleDistribution?.data?.data,
    generalUpdates: generalUpdates?.data?.data,

    // Other roles data
    procurementDashboard: procurementDashboard?.data?.data,
    procurementMyActions: procurementMyActions?.data?.data,
    procurementGeneralUpdates: procurementGeneralUpdates?.data?.data,

    // Procurement Analytics data
    procurementSolicitationStatus: solicitationStatus?.data?.data,
    procurementBidIntent: bidIntent?.data?.data,
    procurementVendorsDistribution: vendorsDistribution?.data?.data,
    procurementProposalSubmission: proposalSubmission?.data?.data,
    procurementWeeklyActivities: procurementWeeklyActivities?.data?.data,
    procurementTotalEvaluations: procurementTotalEvaluations?.data?.data,

    // Evaluator data
    evaluatorDashboard: evaluatorDashboard?.data?.data,
    evaluatorMyActions: evaluatorMyActions?.data?.data,
    evaluatorEvaluationUpdates: evaluatorEvaluationUpdates?.data?.data,

    // Vendor data
    vendorDashboard: vendorDashboard?.data?.data,
    vendorMyActions: vendorMyActions?.data?.data,
    vendorGeneralUpdates: vendorGeneralUpdates?.data?.data,

    contractManagerTotalCards: contractManagerTotalCards?.data,
    contractManagerYtdCards: contractManagerYtdCards?.data,
    contractManagerActionLogs: contractManagerActionLogs?.data,
    contractManagerGeneralUpdates: contractManagerGeneralUpdates?.data,
    contractManagerCycleTime: contractManagerCycleTime?.data,
    contractManagerInvoiceStatus: contractManagerInvoiceStatus?.data,
    contractManagerCommittedVsActualSpend: contractManagerCommittedVsActualSpend?.data,
    contractManagerVendorContractValue: contractManagerVendorContractValue?.data,
    contractManagerProjectContractValue: contractManagerProjectContractValue?.data,
    contractManagerRiskDistribution: contractManagerRiskDistribution?.data,
    contractManagerChangeOrderImpact: contractManagerChangeOrderImpact?.data,
    contractManagerCategoryValue: contractManagerCategoryValue?.data,
    contractManagerComplianceStatus: contractManagerComplianceStatus?.data,
    contractManagerClauseIntelligence: contractManagerClauseIntelligence?.data,
    contractManagerContractStatus: contractManagerContractStatus?.data,
    contractManagerAiInsights: contractManagerAiInsights?.data,
    contractManagerVendorSummary: contractManagerVendorSummary?.data,
    contractManagerRenewals: contractManagerRenewals?.data,

    // Chart data function
    getChartData,

    // Loading states
    isLoading,
    isInitialLoading,
    isLoadingCount,
    isLoadingRoles,
    isLoadingActivities,
    isLoadingSubs,
    isLoadingStatus,
    isLoadingModules,
    isLoadingProcurement,
    isLoadingSolicitationStatus,
    isLoadingBidIntent,
    isLoadingVendorsDistribution,
    isLoadingProposalSubmission,

    isLoadingCompanyRoleDistribution,
    isLoadingGeneralUpdates,
    isLoadingEvaluatorDashboard,
    isLoadingEvaluatorMyActions,
    isLoadingEvaluatorEvaluationUpdates,
    isLoadingVendorDashboard,
    isLoadingVendorMyActions,
    isLoadingVendorGeneralUpdates,
    isLoadingProcurementMyActions,
    isLoadingProcurementGeneralUpdates,
    isLoadingContractManagerTotalCards,
    isLoadingContractManagerYtdCards,
    isLoadingContractManagerActionLogs,
    isLoadingContractManagerGeneralUpdates,
    isLoadingContractManagerCycleTime,
    isLoadingContractManagerInvoiceStatus,
    isLoadingContractManagerCommittedVsActualSpend,
    isLoadingContractManagerVendorContractValue,
    isLoadingContractManagerProjectContractValue,
    isLoadingContractManagerRiskDistribution,
    isLoadingContractManagerChangeOrderImpact,
    isLoadingContractManagerCategoryValue,
    isLoadingContractManagerComplianceStatus,
    isLoadingContractManagerClauseIntelligence,
    isLoadingContractManagerContractStatus,
    isLoadingContractManagerVendorSummary,
    isLoadingContractManagerRenewals,
  };
};
