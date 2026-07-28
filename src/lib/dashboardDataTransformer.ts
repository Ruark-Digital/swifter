import {
  SuperAdminDashboardCount,
  RoleDistribution,
  // TimeStats,
  SubDistribution,
  // ModuleUsage,
  WeeklyActivities,
  EvaluatorDashboardData,
  EvaluatorMyActions,
  EvaluatorEvaluationActivity,
  VendorMyActions,
  VendorsDistributionData,
} from "@/hooks/useDashboardData";
import { DashboardConfig } from "@/config/dashboardConfig";
import { applyConsistentColors } from "./chartColorUtils";
import { formatDateTZ } from "./utils";

// Dynamic link generation utility
type UserRole = "procurement" | "evaluator" | "vendor";
type ActivityType = "general" | "myActions";

interface LinkMapping {
  [role: string]: {
    [activityType: string]: {
      [action: string]: string;
    };
  };
}

const ACTIVITY_LINK_MAPPINGS: LinkMapping = {
  procurement: {
    general: {
      published: "/dashboard/solicitation",
      addendum: "/dashboard/solicitation",
      question: "/dashboard/solicitation",
      vendor_accept: "/dashboard/solicitation",
      proposal_submitted: "/dashboard/solicitation",
      scored: "/dashboard/evaluation",
    },
    myActions: {
      create_evaluation: "/dashboard/evaluation",
      create_evaluation_group: "/dashboard/evaluation",
      release_group: "/dashboard/evaluation",
      // BE statusText for a released group reads "…has been released for
      // evaluation, please proceed with scoring" — no `release_group` token.
      // Match on the phrase so PL's My Actions row is linked, not plain text.
      "released for evaluation": "/dashboard/evaluation",
      "proceed with evaluation": "/dashboard/evaluation",
      "proceed with scoring": "/dashboard/evaluation",
      evaluation: "/dashboard/evaluation",
    },
  },
  evaluator: {
    general: {
      Scored: "/dashboard/evaluation",
      Created: "/dashboard/evaluation",
    },
    myActions: {
      "score solicitation": "/dashboard/evaluation",
    },
  },
  vendor: {
    general: {
      vendor_accept: "/dashboard/solicitation",
      vendor_decline: "/dashboard/solicitation",
      addendum_question: "/dashboard/solicitation",
    },
    myActions: {
      draft: "/dashboard/solicitation",
      invited: "/dashboard/invitations",
      no_response: "/dashboard/solicitation",
      submit_proposal: "/dashboard/solicitation",
    },
  },
};

/**
 * Generate dynamic link based on user role, activity type, and action
 * @param userRole - The user's role (procurement, evaluator, vendor)
 * @param activityType - Type of activity (general, myActions)
 * @param action - The specific action from statusText
 * @param data - Object containing id and name for the link
 * @returns The complete href or null if no mapping exists
 */
function generateDynamicLink(
  userRole: UserRole,
  activityType: ActivityType,
  action: string,
  data: { name: string; solId?: string; evaId?: string; evaGroupId?: string }
): string | null {
  const roleMapping = ACTIVITY_LINK_MAPPINGS[userRole];
  if (!roleMapping) return null;

  const activityMapping = roleMapping[activityType];
  if (!activityMapping) return null;

  const basePath = activityMapping[action];
  if (!basePath) return null;

  const isEvaluation = basePath.includes("/evaluation") ||
    action.toLowerCase().includes("evaluation");
  const targetId = isEvaluation ? data.evaId : data.solId;

  return targetId ? `${basePath}/${targetId}` : null;
}

/**
 * Apply dynamic status text replacement based on user role and activity action
 * @param statusText - The original status text
 * @param userRole - The user's role
 * @param activityType - Type of activity (general or myActions)
 * @param data - Object containing id and name
 * @returns Modified status text with dynamic links
 */
function applyDynamicStatusTextReplacement(
  statusText: string,
  userRole: UserRole,
  activityType: ActivityType,
  data: { name: string; solId?: string; evaId?: string; evaGroupId?: string }
): string {
  // Special rule for Procurement General Updates:
  // Only route to evaluation page if "evaluation" is mentioned in statusText; otherwise route to solicitation.
  if (userRole === "procurement" && activityType === "general") {
    const lower = statusText.toLowerCase();
    // Scoring events ("Vendor X was scored on Criterion Y by Reviewer Z")
    // are evaluation-scoped even though "evaluation" isn't in the phrase.
    const isScoringEvent = lower.includes("scored on") || lower.includes("was scored");
    const toEvaluation = lower.includes("evaluation") || isScoringEvent;
    const hasEvaluationTarget = Boolean(data.evaId);
    const base = toEvaluation && hasEvaluationTarget
      ? "/dashboard/evaluation"
      : "/dashboard/solicitation";
    const targetId = toEvaluation
      ? data.evaId ?? data.solId
      : data.solId ?? data.evaId;
    const href = targetId ? `${base}/${targetId}` : base;

    // For scoring events the BE payload doesn't populate sol/evaluation.name
    // with the vendor, so data.name resolves to "Unknown" and no anchor is
    // inserted. Fall back to the leading vendor phrase in statusText so the
    // Company Admin / PL general-updates row is at least linkable.
    let anchorTarget = data.name;
    if (
      isScoringEvent &&
      (!anchorTarget || !statusText.includes(anchorTarget))
    ) {
      const match = statusText.match(
        /^(.+?)\s+(?:was\s+)?scored(?:\s+on)?\b/i,
      );
      if (match) anchorTarget = match[1].trim();
    }

    if (!anchorTarget) return statusText;
    const escapedName = anchorTarget.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return statusText.replace(
      new RegExp(escapedName, "i"),
      (matchedName) =>
        `<a href="${href}" class="underline underline-offset-4 text-blue-600">${matchedName}</a>`,
    );
  }

  // Extract potential actions from statusText to match against mappings
  const roleMapping = ACTIVITY_LINK_MAPPINGS[userRole]?.[activityType];
  if (!roleMapping) {
    // Fallback to original behavior if no mapping exists
    return statusText.replace(
      data.name,
      `<a href="/dashboard/solicitation/${data.solId ?? ""}" class="underline underline-offset-4 text-blue-600">${data.name}</a>`
    );
  }

  // Find matching action in statusText (case-sensitive)
  for (const action of Object.keys(roleMapping)) {
    if (statusText.includes(action)) {
      const href = generateDynamicLink(userRole, activityType, action, data);

      if (href) {
        return statusText.replace(
          data.name,
          `<a href="${href}" class="underline underline-offset-4 text-blue-600">${data.name}</a>`
        );
      } else {
        return statusText;
      }
    }
  }

  if (userRole === "evaluator") {
    return statusText.replace(
      data.name,
      `<a href="/dashboard/evaluation/assigned/${data.evaId ?? ""}/${data.evaGroupId ?? ""}" class="underline underline-offset-4 text-blue-600">${data.name}</a>`
    );
  }

  // Fallback to original behavior if no action matches
  return statusText.replace(
    data.name,
    `<a href="/dashboard/solicitation/${data.solId ?? ""}" class="underline underline-offset-4 text-blue-600">${data.name}</a>`
  );
}

// Types for Recharts-compatible data formats
export interface PieChartData {
  [key: string]: string | number | undefined;
  name: string;
  value: number;
  percentage?: number;
}

export interface LineChartData {
  [key: string]: string | number;
}

export interface BarChartData {
  [key: string]: string | number;
}

export type RechartsData = PieChartData | LineChartData | BarChartData;

// Chart transformation utilities
export class ChartDataTransformer {
  /**
   * Convert month number to short month name
   */
  static getMonthName(monthNumber: number): string {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return monthNames[monthNumber - 1] || "Unknown";
  }

  /**
   * Calculate percentage for pie/donut charts
   */
  static calculatePercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  /**
   * Transform flat key-value objects to array format
   */
  static transformKeyValueToArray(
    data: Record<string, any>,
    valueKey = "count"
  ): PieChartData[] {
    if (!data || typeof data !== "object") return [];

    return Object.entries(data).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: typeof value === "object" ? value[valueKey] || 0 : value || 0,
    }));
  }

  /**
   * Extract nested distribution arrays
   */
  static extractDistributionArray(
    data: any,
    distributionKey = "distribution"
  ): any[] {
    if (!data) return [];

    // Handle nested structure like { data: { distribution: [...] } }
    if (data.data && data.data[distributionKey]) {
      return data.data[distributionKey];
    }

    // Handle direct distribution array
    if (data[distributionKey] && Array.isArray(data[distributionKey])) {
      return data[distributionKey];
    }

    return [];
  }

  /**
   * Transform pie/donut chart data
   */
  static transformPieChart(rawData: any, chartId?: string): PieChartData[] {
    if (!rawData) {
      return this.getDefaultPieData(chartId);
    }

    // Handle different data structures based on chart type
    switch (chartId) {
      case "solicitation-status":
        return this.transformSolicitationStatusPie(rawData);
      case "vendors-distribution":
      case "vendors-bid-intent-status":
        return this.transformVendorsDistributionPie(rawData);
      case "sub-distribution":
        return this.transformSubscriptionDistributionPie(rawData);
      case "portal-role-distribution":
        return this.transformRoleDistributionPie(rawData);
      case "bid-intent":
        return this.transformBidIntentPie(rawData);
      default:
        return this.transformGenericPieData(rawData);
    }
  }

  /**
   * Transform line/area chart data
   */
  static transformLineChart(rawData: any, chartId?: string): LineChartData[] {
    // Handle new API format with labels and datasets (for solicitation-activities)
    if (
      rawData &&
      rawData.labels &&
      rawData.datasets &&
      Array.isArray(rawData.labels) &&
      Array.isArray(rawData.datasets)
    ) {
      const { labels, datasets } = rawData;

      return labels.map((label: string, index: number) => {
        const result: LineChartData = {
          month: label,
        };

        // Map each dataset to its corresponding value for this month
        datasets.forEach((dataset: any) => {
          if (dataset.name && dataset.values && Array.isArray(dataset.values)) {
            // Convert dataset names to lowercase for consistency
            const key = dataset.name.toLowerCase().replace(/\s+/g, "");
            result[key] = dataset.values[index] || 0;
          }
        });

        return result;
      });
    }

    // Handle legacy array format
    if (!rawData || !Array.isArray(rawData)) {
      return this.getDefaultLineData(chartId);
    }

    return rawData.map((item: any) => {
      const transformedItem: LineChartData = {};

      // Handle month conversion
      if (item.month && typeof item.month === "number") {
        transformedItem.month = this.getMonthName(item.month);
      } else if (item.month) {
        transformedItem.month = item.month;
      }

      // Handle date formatting
      if (item.year && item.month) {
        const monthName =
          typeof item.month === "number"
            ? this.getMonthName(item.month)
            : item.month;
        transformedItem.date = `${monthName} ${item.year}`;
      }

      // Copy all other properties
      Object.keys(item).forEach((key) => {
        if (key !== "month" && key !== "year") {
          transformedItem[key] = item[key] || 0;
        }
      });

      return transformedItem;
    });
  }

  /**
   * Transform bar chart data
   */
  static transformBarChart(rawData: any, chartId?: string): BarChartData[] {
    if (!rawData) {
      return this.getDefaultBarData(chartId);
    }

    // Handle stacked bar charts explicitly
    if (chartId === "company-status" || chartId === "total-evaluation") {
      return this.transformStackedBarData(rawData);
    }

    // Module usage can be stacked (labels/datasets) or simple counts
    if (chartId === "module-usage") {
      const isNewFormat =
        rawData &&
        (rawData as any).labels &&
        (rawData as any).datasets &&
        Array.isArray((rawData as any).labels) &&
        Array.isArray((rawData as any).datasets);

      if (isNewFormat) {
        return this.transformStackedBarData(rawData);
      }
      return this.transformVerticalBarData(rawData);
    }

    // Handle vertical bar charts (like role-distribution)
    if (chartId === "role-distribution") {
      return this.transformVerticalBarData(rawData);
    }

    // Handle array data
    if (Array.isArray(rawData)) {
      return rawData.map((item: any) => ({
        name: item.name || item.roleName || "Unknown",
        value: item.value || item.count || 0,
        ...item,
      }));
    }

    // Handle object data - transform to bar chart format
    const keyValueData = this.transformKeyValueToArray(rawData);
    return keyValueData.map((item) => ({
      name: item.name,
      value: item.value,
    })) as BarChartData[];
  }

  /**
   * Main transformation method - routes to appropriate chart transformer
   */
  static transformChart(
    chartId: string,
    rawApiData: any,
    chartType?: string
  ): RechartsData[] {
    try {
      // Determine chart type from chartId if not provided
      const inferredType = chartType || this.inferChartType(chartId);

      switch (inferredType) {
        case "pie":
        case "donut":
          return this.transformPieChart(rawApiData, chartId);
        case "line":
        case "area":
          return this.transformLineChart(rawApiData, chartId);
        case "bar":
          return this.transformBarChart(rawApiData, chartId);
        default:
          console.warn(`Unknown chart type for chartId: ${chartId}`);
          return [];
      }
    } catch (error) {
      console.error(`Error transforming chart data for ${chartId}:`, error);
      return this.getDefaultDataForChart(chartId);
    }
  }

  // Private helper methods
  private static inferChartType(chartId: string): string {
    if (
      chartId.includes("status") ||
      chartId.includes("distribution") ||
      chartId.includes("intent")
    ) {
      return chartId.includes("donut") ? "donut" : "pie";
    }
    if (chartId.includes("activities") || chartId.includes("submission")) {
      return chartId.includes("line") ? "line" : "area";
    }
    if (chartId === "solicitation-activities") {
      return "area";
    }
    if (chartId.includes("evaluation") || chartId.includes("usage")) {
      return "bar";
    }
    return "pie"; // default
  }

  private static transformSolicitationStatusPie(data: any): PieChartData[] {
    const defaultData = [
      { name: "Draft", value: 0 },
      { name: "Active", value: 0 },
      { name: "Under Evaluation", value: 0 },
      { name: "Closed", value: 0 },
      { name: "Awarded", value: 0 },
    ];

    if (!data) return applyConsistentColors(defaultData);

    // The /solicitations/analytics/status endpoint returns both percentages
    // (active/closed/awarded — fractional) and integer counts
    // (activeSol/closedSol/awardedSol). Prefer the integer counts so the
    // pie reflects raw solicitation counts, not decimal percentages.
    const chartData = [
      { name: "Draft", value: data.draft || 0 },
      { name: "Active", value: data.activeSol ?? data.active ?? 0 },
      {
        name: "Under Evaluation",
        value: data.evaluating || data.underEvaluating || 0,
      },
      { name: "Closed", value: data.closedSol ?? data.closed ?? 0 },
      { name: "Awarded", value: data.awardedSol ?? data.awarded ?? 0 },
    ];

    return applyConsistentColors(chartData);
  }

  private static transformVendorsDistributionPie(data: any): PieChartData[] {
    const defaultData = [
      { name: "Active", value: 0, percentage: 0 },
      { name: "Pending", value: 0, percentage: 0 },
      { name: "Inactive", value: 0, percentage: 0 },
    ];

    if (!data) return applyConsistentColors(defaultData);

    // Handle different API response structures
    if (data.active && typeof data.active === "object") {
      const chartData = [
        {
          name: "Active",
          value: data.active.count || 0,
          percentage: data.active.percentage || 0,
        },
        {
          name: "Pending",
          value: data.pending?.count || 0,
          percentage: data.pending?.percentage || 0,
        },
        {
          name: "Inactive",
          value: data.inactive?.count || 0,
          percentage: data.inactive?.percentage || 0,
        },
      ];
      return applyConsistentColors(chartData);
    }

    // Handle flat structure
    const total =
      (data.invited || 0) + (data.confirmed || 0) + (data.declined || 0);
    const chartData = [
      {
        name: "Invited",
        value: data.invited || 0,
        percentage: this.calculatePercentage(data.invited || 0, total),
      },
      {
        name: "Confirmed",
        value: data.confirmed || 0,
        percentage: this.calculatePercentage(data.confirmed || 0, total),
      },
      {
        name: "Declined",
        value: data.declined || 0,
        percentage: this.calculatePercentage(data.declined || 0, total),
      },
    ];

    return applyConsistentColors(chartData);
  }

  private static transformSubscriptionDistributionPie(
    data: any
  ): PieChartData[] {
    const distributionArray = this.extractDistributionArray(data);

    if (distributionArray.length === 0) {
      return applyConsistentColors([
        { name: "Basic", value: 0 },
        { name: "Pro", value: 0 },
        { name: "Enterprise", value: 0 },
      ]);
    }

    const chartData = distributionArray.map((item: any) => ({
      name: item.plan || item.name || "Unknown",
      value: item.count || item.value || 0,
    }));

    return applyConsistentColors(chartData);
  }

  private static transformRoleDistributionPie(data: any): PieChartData[] {
    if (!data || !Array.isArray(data)) {
      return applyConsistentColors([
        { name: "Admin", value: 0 },
        { name: "Procurement Lead", value: 0 },
        { name: "Vendor", value: 0 },
      ]);
    }

    const roleTitle = {
      procurement: "Procurement Lead",
      super_admin: "Super Admin",
      company_admin: "Company Admin",
      evaluator: "Evaluator",
      vendor: "Vendor",
    };

    const chartData = data.map((item: any) => ({
      name:
        roleTitle[item.roleName as keyof typeof roleTitle] ||
        item.roleName ||
        "Unknown Role",
      value: parseInt(item.count) || 0,
    }));

    return applyConsistentColors(chartData);
  }

  private static transformBidIntentPie(data: any): PieChartData[] {
    if (!data) {
      return applyConsistentColors([
        { name: "Invited", value: 0, percentage: 0 },
        { name: "Confirmed", value: 0, percentage: 0 },
        { name: "Declined", value: 0, percentage: 0 },
      ]);
    }

    const total = data.totalBid || 0;
    const chartData = [
      {
        name: "Invited",
        value: data.invited || 0,
        percentage: this.calculatePercentage(data.invited || 0, total),
      },
      {
        name: "Confirmed",
        value: data.confirmed || 0,
        percentage: this.calculatePercentage(data.confirmed || 0, total),
      },
      {
        name: "Declined",
        value: data.declined || 0,
        percentage: this.calculatePercentage(data.declined || 0, total),
      },
    ];

    return applyConsistentColors(chartData);
  }

  private static transformGenericPieData(data: any): PieChartData[] {
    if (Array.isArray(data)) {
      return applyConsistentColors(
        data.map((item: any) => ({
          name: item.name || item.label || "Unknown",
          value: item.value || item.count || 0,
          percentage: item.percentage,
        }))
      );
    }

    return applyConsistentColors(this.transformKeyValueToArray(data));
  }

  private static transformStackedBarData(data: any): BarChartData[] {
    // Handle new API format with labels and datasets (for total-evaluation)
    if (
      data &&
      data.labels &&
      data.datasets &&
      Array.isArray(data.labels) &&
      Array.isArray(data.datasets)
    ) {
      const { labels, datasets } = data;

      return labels.map((label: string, index: number) => {
        const result: BarChartData = {
          month: label,
        };

        // Map each dataset to its corresponding value for this month
        datasets.forEach((dataset: any) => {
          if (dataset.name && dataset.values && Array.isArray(dataset.values)) {
            // Convert dataset names to lowercase for consistency
            const key = dataset.name.toLowerCase().replace(/\s+/g, "");
            result[key] = dataset.values[index] || 0;
          }
        });

        return result;
      });
    }

    // Handle company status with timeStats
    if (data && data[0] && data[0].timeStats) {
      const timeStats = data[0].timeStats;
      return timeStats.map((item: any, index: number) => {
        const month = item.label || this.getMonthName((index % 12) + 1);
        const total = item.total || 0;
        const active = item.active || 0;
        const expiring = item.expiring || 0;
        const suspended = Math.max(0, total - active - expiring);

        return {
          month,
          active,
          suspended,
          pending: expiring,
        };
      });
    }

    // Handle array data with month/time information
    if (Array.isArray(data)) {
      return data.map((item: any) => {
        const result: BarChartData = {};

        if (item.month) {
          result.month =
            typeof item.month === "number"
              ? this.getMonthName(item.month)
              : item.month;
        }

        Object.keys(item).forEach((key) => {
          if (key !== "month") {
            result[key] = item[key] || 0;
          }
        });

        return result;
      });
    }

    return [];
  }

  private static transformVerticalBarData(data: any): BarChartData[] {
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        name: item.name || item.roleName || "Unknown",
        value: item.value || item.count || 0,
      }));
    }

    // Handle module usage type data
    if (data && typeof data === "object") {
      return [
        { name: "Solicitation", value: data.solicitationUsage || 0 },
        { name: "Evaluation", value: data.evaluationUsage || 0 },
        { name: "Vendor", value: data.vendorUage || 0 }, // Keep original typo from API
        { name: "Addendum", value: data.adendumUsage || 0 },
      ];
    }

    return [];
  }

  private static getDefaultPieData(chartId?: string): PieChartData[] {
    const defaults: Record<string, PieChartData[]> = {
      "solicitation-status": [
        { name: "Draft", value: 0 },
        { name: "Active", value: 0 },
        { name: "Under Evaluation", value: 0 },
        { name: "Closed", value: 0 },
      ],
      "vendors-distribution": [
        { name: "Active", value: 0 },
        { name: "Pending", value: 0 },
        { name: "Inactive", value: 0 },
      ],
      default: [
        { name: "Category A", value: 0 },
        { name: "Category B", value: 0 },
        { name: "Category C", value: 0 },
      ],
    };

    return applyConsistentColors(
      defaults[chartId || "default"] || defaults.default
    );
  }

  private static getDefaultLineData(chartId?: string): LineChartData[] {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    if (chartId === "proposal-submission") {
      return months.slice(0, 6).map((month) => ({
        month,
        submitted: 0,
        declined: 0,
        missedDeadline: 0,
      }));
    }

    return months.slice(0, 7).map((month) => ({
      month,
      activities: 0,
    }));
  }

  private static getDefaultBarData(chartId?: string): BarChartData[] {
    if (chartId === "company-status") {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return months.map((month) => ({
        month,
        active: 0,
        suspended: 0,
        pending: 0,
      }));
    }

    return [
      { name: "Category A", value: 0 },
      { name: "Category B", value: 0 },
      { name: "Category C", value: 0 },
    ];
  }

  private static getDefaultDataForChart(chartId: string): RechartsData[] {
    if (chartId.includes("status") || chartId.includes("distribution")) {
      return this.getDefaultPieData(chartId);
    }
    if (chartId.includes("activities") || chartId.includes("submission")) {
      return this.getDefaultLineData(chartId);
    }
    if (chartId.includes("evaluation") || chartId.includes("usage")) {
      return this.getDefaultBarData(chartId);
    }
    return this.getDefaultPieData(chartId);
  }
}

/**
 * Transforms API data into dashboard configuration format
 * This ensures compatibility with existing UI components
 */
export class DashboardDataTransformer {
  /**
   * Transform chart data using the new unified transformer
   * @param chartId - Chart identifier
   * @param rawData - Raw API data
   * @param chartType - Optional chart type override
   * @returns Recharts-compatible data
   */
  static transformChartData(
    chartId: string,
    rawData: any,
    chartType?: string
  ): RechartsData[] {
    return ChartDataTransformer.transformChart(chartId, rawData, chartType);
  }

  /**
   * Transform SuperAdmin dashboard count data into stats cards
   */
  static transformSuperAdminStats(
    data: SuperAdminDashboardCount | undefined
  ): DashboardConfig["stats"] {
    const stats = data?.company;
    const userStats = data?.users;

    if (typeof stats === "undefined") {
      // Return default/loading state
      return [
        {
          title: "All Companies",
          value: 0,
          icon: "building-clock",
          color: "text-gray-800",
          bgColor: "bg-gray-500/20",
        },
        {
          title: "Active Companies",
          value: 0,
          icon: "building-clock",
          color: "text-green-800",
          bgColor: "bg-green-500/20",
        },
        {
          title: "Suspended Companies",
          value: 0,
          icon: "building-clock",
          color: "text-red-800",
          bgColor: "bg-red-500/30",
        },
        {
          title: "All Admins",
          value: 0,
          icon: "users",
          color: "text-gray-800",
          bgColor: "bg-gray-500/30",
        },
        {
          title: "Super Admins",
          value: 0,
          icon: "user",
          color: "text-gray-800",
          bgColor: "bg-gray-500/30",
        },
        {
          title: "Organisation Admins",
          value: 0,
          icon: "user",
          color: "text-gray-800",
          bgColor: "bg-gray-500/30",
        },
      ];
    }

    return [
      {
        title: "All Companies",
        value: stats.allCompanies,
        icon: "building-clock",
        color: "text-gray-800",
        bgColor: "bg-gray-500/20",
      },
      {
        title: "Active Companies",
        value: stats.activeCompanies || 0,
        icon: "building-clock",
        color: "text-green-800",
        bgColor: "bg-green-500/20",
      },
      {
        title: "Suspended Companies",
        value: stats.suspendedCompanies || 0,
        icon: "building-clock",
        color: "text-red-800",
        bgColor: "bg-red-500/30",
      },
      {
        title: "All Admins",
        value: (userStats?.super_admin ?? 0) + (userStats?.company_admin ?? 0),
        icon: "users",
        color: "text-gray-800",
        bgColor: "bg-gray-500/30",
      },
      {
        title: "Super Admins",
        value: userStats?.super_admin || 0,
        icon: "user",
        color: "text-gray-800",
        bgColor: "bg-gray-500/30",
      },
      {
        title: "Organisation Admins",
        value: userStats?.company_admin || 0,
        icon: "user",
        color: "text-gray-800",
        bgColor: "bg-gray-500/30",
      },
    ];
  }

  /**
   * Transform weekly activities data for area chart
   */
  static transformWeeklyActivities(data: WeeklyActivities | undefined) {
    if (!data || (!data.solicitations && !data.evaluations)) {
      // Return default data structure
      return Array.from({ length: 7 }, (_, i) => ({
        day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
        activities: 0,
      }));
    }

    // Transform API data to chart format
    // Combine solicitations and evaluations data
    const totalActivities =
      (data.solicitations?.length || 0) + (data.evaluations?.length || 0);

    // For now, distribute activities across the week
    // This can be enhanced based on actual date data from the API
    return Array.from({ length: 7 }, (_, i) => ({
      day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
      activities:
        Math.floor(totalActivities / 7) + (i < totalActivities % 7 ? 1 : 0),
    }));
  }

  /**
   * Transform subscription distribution data for donut chart
   */
  static transformSubDistribution(data: SubDistribution | undefined) {
    if (
      !data ||
      !data.distribution ||
      !Array.isArray(data.distribution) ||
      data.distribution.length === 0
    ) {
      return applyConsistentColors([
        { name: "Basic", value: 0, percentage: 0 },
        { name: "Pro", value: 0, percentage: 0 },
        { name: "Enterprise", value: 0, percentage: 0 },
      ]);
    }

    const total = data.distribution.reduce(
      (sum, item) => sum + (item.count || 0),
      0,
    );

    const percentages = this.apportionPercentages(
      data.distribution.map((item) => item.count || 0),
      total,
    );

    const chartData = data.distribution.map((item, index) => ({
      name: item.plan,
      value: item.count,
      percentage: percentages[index],
    }));

    return applyConsistentColors(chartData);
  }

  /**
   * Split 100% across the given counts using largest-remainder apportionment.
   * Rounding each share independently lets the slices drift off 100 (three equal
   * thirds render as 33+33+33=99); this always sums to exactly 100.
   */
  private static apportionPercentages(counts: number[], total: number) {
    if (total <= 0) return counts.map(() => 0);

    const exact = counts.map((count) => (count / total) * 100);
    const percentages = exact.map(Math.floor);
    let remaining = 100 - percentages.reduce((sum, value) => sum + value, 0);

    const byLargestRemainder = exact
      .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
      .sort((a, b) => b.remainder - a.remainder);

    for (const { index } of byLargestRemainder) {
      if (remaining <= 0) break;
      percentages[index] += 1;
      remaining -= 1;
    }

    return percentages;
  }

  /**
   * Transform company status data for bar chart
   */
  static transformCompanyStatus(data: any) {
    // Handle both old and new API structures
    let timeStats;

    // Check if data has the old nested structure with timeStats
    if (data?.timeStats && Array.isArray(data.timeStats)) {
      timeStats = data.timeStats;
    }
    // Check if data is the new direct array structure
    else if (Array.isArray(data)) {
      timeStats = data;
    }
    // Handle case where data is wrapped in a data property
    else if (data?.data && Array.isArray(data.data)) {
      timeStats = data.data;
    }
    // Fallback for undefined or invalid data
    else {
      timeStats = null;
    }

    if (!timeStats || !Array.isArray(timeStats) || timeStats.length === 0) {
      return Array.from({ length: 12 }, (_, i) => ({
        month: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ][i],
        active: 0,
        suspended: 0,
        pending: 0,
      }));
    }

    return timeStats.map((item: any, index: number) => {
      // Use the label from API or fallback to month names
      const month =
        item.label ||
        [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ][index % 12];

      // Calculate suspended and pending from actual API data
      const total = item.total || 0;
      const active = item.active || 0;
      const expiring = item.expiring || 0;
      const suspended = item.suspended || 0;

      // Calculate suspended as total minus active minus expiring if not provided
      const calculatedSuspended =
        suspended || Math.max(0, total - active - expiring);

      return {
        month,
        active,
        suspended: calculatedSuspended,
        pending: expiring, // Use expiring as pending since they represent similar concepts
      };
    });
  }

  /**
   * Transform role distribution data for pie chart
   */
  static transformRoleDistribution(data: RoleDistribution[] | undefined) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return applyConsistentColors([
        { name: "Admin", value: 0 },
        { name: "Procurement Lead", value: 0 },
        { name: "Vendor", value: 0 },
        { name: "Project Manager", value: 0 },
        { name: "View Only", value: 0 },
        { name: "Contract Manager", value: 0 },
        { name: "Approver", value: 0 },
      ]);
    }

    const roleTitle = {
      procurement: "Procurement Lead",
      super_admin: "Super Admin",
      company_admin: "Company Admin",
      evaluator: "Evaluator",
      vendor: "Vendor",
      project_manager: "Project Manager",
      view_only: "View Only",
      contract_manager: "Contract Manager",
      approver: "Approver",
    };

    const chartData = data.map((item) => ({
      name:
        roleTitle[item.roleName as keyof typeof roleTitle] || "Unknown Role",
      value: parseInt(item.count) || 0,
    }));

    return applyConsistentColors(chartData);
  }

  /**
   * Calculate total active subscriptions for center text
   */
  static calculateTotalSubscriptions(
    data: SubDistribution | undefined
  ): number {
    if (!data) return 0;
    return data.totalActive || 0;
  }

  /**
   * Transform Module Usage data
   * Supports both legacy single-object counts and new labels/datasets format.
   */
  static transformModuleUsage(data: any) {
    // New stacked bar format with labels + datasets
    if (
      data &&
      (data as any).labels &&
      (data as any).datasets &&
      Array.isArray((data as any).labels) &&
      Array.isArray((data as any).datasets)
    ) {
      // Delegate to unified bar transformer for 'module-usage'
      return ChartDataTransformer.transformBarChart(data, "module-usage");
    }

    // Legacy format: single object with usage counts
    if (!data || typeof data !== "object") {
      return [
        { solicitation: 0 },
        { evaluation: 0 },
        { Vendor: 0 },
        { Addendum: 0 },
      ];
    }

    return [
      { solicitation: data.solicitationUsage || 0 },
      { evaluation: data.evaluationUsage || 0 },
      { Vendor: data.vendorUage || 0 },
      { Addendum: data.adendumUsage || 0 },
    ];
  }

  /**
   * Transform Company Admin solicitation status data into stats cards
   */
  static transformSolicitationStatus(data: any): DashboardConfig["stats"] {
    if (!data) {
      return [
        {
          title: "Total Solicitations",
          value: 0,
          icon: "file-text",
          color: "text-blue-800",
          bgColor: "bg-blue-500/20",
        },
        {
          title: "Active Solicitations",
          value: 0,
          icon: "activity",
          color: "text-green-800",
          bgColor: "bg-green-500/20",
        },
        {
          title: "Awarded Solicitations",
          value: 0,
          icon: "award",
          color: "text-yellow-800",
          bgColor: "bg-yellow-500/20",
        },
        {
          title: "Closed Solicitations",
          value: 0,
          icon: "x-circle",
          color: "text-red-800",
          bgColor: "bg-red-500/20",
        },
      ];
    }

    // The endpoint returns decimal percentages for active/closed/awarded
    // alongside integer counts in activeSol/closedSol/awardedSol. The
    // stats cards must show integer counts, not percentages — prefer the
    // *Sol fields and fall back to a floored decimal if they're missing.
    return [
      {
        title: "Total Solicitations",
        value: Math.trunc(data.total || 0),
        icon: "file-text",
        color: "text-blue-800",
        bgColor: "bg-blue-500/20",
      },
      {
        title: "Active Solicitations",
        value: Math.trunc(data.activeSol ?? data.active ?? 0),
        icon: "activity",
        color: "text-green-800",
        bgColor: "bg-green-500/20",
      },
      {
        title: "Awarded Solicitations",
        value: Math.trunc(data.awardedSol ?? data.awarded ?? 0),
        icon: "award",
        color: "text-yellow-800",
        bgColor: "bg-yellow-500/20",
      },
      {
        title: "Closed Solicitations",
        value: Math.trunc(data.closedSol ?? data.closed ?? 0),
        icon: "x-circle",
        color: "text-red-800",
        bgColor: "bg-red-500/20",
      },
    ];
  }

  /**
   * Transform Company Admin bid intent data
   */
  static transformBidIntent(data: any) {
    if (!data) {
      return applyConsistentColors([
        { name: "Invited", value: 0, percentage: 0 },
        { name: "Confirmed", value: 0, percentage: 0 },
        { name: "Declined", value: 0, percentage: 0 },
      ]);
    }

    const total =
      (data.invited || 0) + (data.confirmed || 0) + (data.declined || 0);

    const chartData = [
      {
        name: "Invited",
        value: data.invited || 0,
        percentage: total > 0 ? Math.round((data.invited / total) * 100) : 0,
      },
      {
        name: "Confirmed",
        value: data.confirmed || 0,
        percentage: total > 0 ? Math.round((data.confirmed / total) * 100) : 0,
      },
      {
        name: "Declined",
        value: data.declined || 0,
        percentage: total > 0 ? Math.round((data.declined / total) * 100) : 0,
      },
    ];

    return applyConsistentColors(chartData);
  }

  /**
   * Transform Company Admin vendors distribution data
   */
  static transformVendorsDistribution(data: any) {
    if (!data) {
      return applyConsistentColors([
        { name: "Active", value: 0, percentage: 0 },
        { name: "Pending", value: 0, percentage: 0 },
        { name: "Inactive", value: 0, percentage: 0 },
      ]);
    }

    const chartData = [
      {
        name: "Active",
        value: data.active?.percentage || 0,
        percentage: data?.active?.percentage ?? 0,
      },
      {
        name: "Pending",
        value: data.pending?.percentage || 0,
        percentage: data?.pending?.percentage ?? 0,
      },
      {
        name: "Inactive",
        value: data.inactive?.percentage || 0,
        percentage: data?.inactive?.percentage ?? 0,
      },
    ];

    return applyConsistentColors(chartData);
  }

  /**
   * Transform Company Admin proposal submission data
   */
  static transformProposalSubmission(data: any) {
    // Handle new API format with labels and datasets
    if (data && data.labels && data.datasets) {
      const { labels, datasets } = data;

      return labels.map((label: string, index: number) => {
        const result: any = {
          date: label,
        };

        // Map each dataset to the corresponding property
        datasets.forEach((dataset: any) => {
          const value = dataset.values[index] || 0;

          switch (dataset.name.toLowerCase()) {
            case "submitted":
              result.submitted = value;
              break;
            case "missed deadline":
              result.missedDeadline = value;
              break;
            case "declined":
              result.declined = value;
              break;
            default:
              // Handle any other dataset names by converting to camelCase
              result[dataset.name.toLowerCase().replace(/\s+/g, "")] = value;
          }
        });

        // Calculate total count for backward compatibility
        result.count =
          (result.submitted || 0) +
          (result.missedDeadline || 0) +
          (result.declined || 0);

        return result;
      });
    }

    // Handle legacy array format
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((item: any) => {
      // Create month-year label for x-axis
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthLabel = monthNames[item.month - 1] || "Unknown";
      const dateLabel = `${monthLabel} ${item.year}`;

      return {
        date: dateLabel,
        submitted: item.submitted || 0,
        missedDeadline: item.missedDeadline || 0,
        declined: item.declined || 0,
        // Keep backward compatibility
        count:
          (item.submitted || 0) +
          (item.missedDeadline || 0) +
          (item.declined || 0),
        ...item,
      };
    });
  }

  /**
   * Transform Procurement dashboard stats
   */
  static transformProcurementStats(data: any): DashboardConfig["stats"] {
    if (!data) {
      return [
        {
          title: "All Solicitations",
          value: 0,
          icon: "file-text",
          color: "text-blue-800",
          bgColor: "bg-blue-500/20",
        },
        {
          title: "Active Solicitations",
          value: 0,
          icon: "activity",
          color: "text-green-800",
          bgColor: "bg-green-500/20",
        },
        {
          title: "Pending Evaluations",
          value: 0,
          icon: "clock",
          color: "text-yellow-800",
          bgColor: "bg-yellow-500/20",
        },
        {
          title: "Awarded",
          value: 0,
          icon: "award",
          color: "text-purple-800",
          bgColor: "bg-purple-500/20",
        },
      ];
    }

    return [
      {
        title: "All Solicitations",
        value: data.total || 0,
        icon: "file-text",
        color: "text-blue-800",
        bgColor: "bg-blue-500/20",
      },
      {
        title: "Active Solicitations",
        value: data.active || 0,
        icon: "activity",
        color: "text-green-800",
        bgColor: "bg-green-500/20",
      },
      {
        title: "Pending Evaluations",
        value: data.pending || 0,
        icon: "clock",
        color: "text-yellow-800",
        bgColor: "bg-yellow-500/20",
      },
      {
        title: "Awarded",
        value: data.awarded || 0,
        icon: "award",
        color: "text-purple-800",
        bgColor: "bg-purple-500/20",
      },
    ];
  }

  /**
   * Transform Company Admin role distribution data
   */
  static transformCompanyRoleDistribution(data: any) {
    if (!data || !Array.isArray(data)) {
      return [
        { name: "Admin", value: 0, percentage: 0 },
        { name: "Procurement Lead", value: 0, percentage: 0 },
        { name: "Evaluators", value: 0, percentage: 0 },
        { name: "Vendors", value: 0, percentage: 0 },
      ];
    }

    const total = data.reduce(
      (sum: number, item: any) => sum + (item.count || 0),
      0
    );

    // Role name mapping for display
    const roleNameMap: { [key: string]: string } = {
      vendor: "Vendors",
      procurement: "Procurement Lead",
      evaluator: "Evaluators",
      company_admin: "Admin",
    };

    return data.map((item: any) => ({
      name: roleNameMap[item.roleName] || item.roleName || "Unknown",
      value: item.count || 0,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }));
  }

  /**
   * Transform Procurement Solicitation Status data for pie chart
   */
  static transformProcurementSolicitationStatus(data: any) {
    if (!data) {
      return applyConsistentColors([
        { name: "Active", value: 0 },
        { name: "Under Evaluation", value: 0 },
        { name: "Closed", value: 0 },
        { name: "Draft", value: 0 },
        { name: "Awarded", value: 0 },
      ]);
    }

    const chartData = [
      { name: "Active", value: data.active || 0 },
      { name: "Under Evaluation", value: data.evaluating || 0 },
      { name: "Closed", value: data.closed || 0 },
      { name: "Draft", value: data.draft || 0 },
      { name: "Awarded", value: data.awarded || 0 },
    ];

    return applyConsistentColors(chartData);
  }

  /**
   * Transform Procurement Bid Intent data for donut chart
   */
  static transformProcurementBidIntent(data: any) {
    if (!data) {
      return applyConsistentColors([
        { name: "Confirmed", value: 0, percentage: 0 },
        { name: "Declined", value: 0, percentage: 0 },
        { name: "Invited", value: 0, percentage: 0 },
      ]);
    }

    const total =
      (data.confirmed || 0) + (data.declined || 0) + (data.invited || 0);

    const chartData = [
      {
        name: "Confirmed",
        value: data.confirmed || 0,
        percentage: total > 0 ? Math.round((data.confirmed / total) * 100) : 0,
      },
      {
        name: "Declined",
        value: data.declined || 0,
        percentage: total > 0 ? Math.round((data.declined / total) * 100) : 0,
      },
      {
        name: "Invited",
        value: data.invited || 0,
        percentage: total > 0 ? Math.round((data.invited / total) * 100) : 0,
      },
    ];

    return applyConsistentColors(chartData);
  }

  /**
   * Transform Procurement Vendors Distribution data for donut chart
   */
  static transformProcurementVendorsDistribution(
    data?: VendorsDistributionData
  ) {
    if (!data) {
      return applyConsistentColors([
        { name: "Active", value: 0, percentage: 0 },
        { name: "Inactive", value: 0, percentage: 0 },
        { name: "Pending", value: 0, percentage: 0 },
      ]);
    }

    const chartData = [
      {
        name: "Active",
        value: data.active.count || 0,
        percentage: data.active.percentage || 0,
      },
      {
        name: "Inactive",
        value: data.inactive.count || 0,
        percentage: data.inactive.percentage || 0,
      },
      {
        name: "Pending",
        value: data.pending.count || 0,
        percentage: data.pending.percentage || 0,
      },
    ];

    return applyConsistentColors(chartData);
  }

  /**
   * Transform Procurement Weekly Activities data for area chart
   */
  static transformProcurementWeeklyActivities(data: any) {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Build a month-aware label from various possible API shapes
    const resolveLabel = (item: any): string => {
      if (item == null) return "Unknown";
      const raw = item.label;
      if (typeof raw === "number") {
        const idx = Math.max(1, Math.min(12, raw));
        return monthNames[idx - 1];
      }
      if (typeof raw === "string") {
        // If label is numeric string (e.g., "1".."12") map to month
        if (/^\d+$/.test(raw)) {
          const idx = Math.max(1, Math.min(12, parseInt(raw, 10)));
          return monthNames[idx - 1];
        }
        return raw;
      }
      if (item.month) {
        const idx = Math.max(1, Math.min(12, Number(item.month)));
        const m = monthNames[idx - 1] || "Unknown";
        return item.year ? `${m} ${item.year}` : m;
      }
      return "Unknown";
    };

    if (!data || !data.solicitations || !data.evaluations) {
      // Default to 12-month view with zeroed values
      return Array.from({ length: 12 }, (_, i) => ({
        month: monthNames[i],
        solicitations: 0,
        evaluations: 0,
      }));
    }

    // Create lookup maps keyed by resolved month labels
    const solicitationsMap = new Map<string, number>();
    const evaluationsMap = new Map<string, number>();
    const labelSet = new Set<string>();

    data.solicitations.forEach((item: any) => {
      const k = resolveLabel(item);
      labelSet.add(k);
      solicitationsMap.set(k, item.value || 0);
    });

    data.evaluations.forEach((item: any) => {
      const k = resolveLabel(item);
      labelSet.add(k);
      evaluationsMap.set(k, item.value || 0);
    });

    // Sort labels in calendar order when possible
    const labels = Array.from(labelSet);
    labels.sort((a, b) => {
      const am = a.split(" ")[0];
      const bm = b.split(" ")[0];
      const ai = monthNames.indexOf(am);
      const bi = monthNames.indexOf(bm);
      if (ai !== -1 && bi !== -1) return ai - bi;
      return a.localeCompare(b);
    });

    return labels.map((lbl) => ({
      month: lbl,
      solicitations: solicitationsMap.get(lbl) || 0,
      evaluations: evaluationsMap.get(lbl) || 0,
    }));
  }

  /**
   * Transform Procurement Proposal Submission data for line chart
   */
  static transformProcurementProposalSubmission(data: any) {
    if (!data || !Array.isArray(data)) {
      // Default to 12-month view with zeroed values
      return Array.from({ length: 12 }, (_, i) => ({
        month: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ][i],
        submitted: 0,
        missedDeadline: 0,
        declined: 0,
      }));
    }

    return data.map((item: any) => {
      // Create month-year label for x-axis
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthLabel = monthNames[item.month - 1] || "Unknown";
      const dateLabel = `${monthLabel} ${item.year}`;

      return {
        month: dateLabel,
        submitted: item.submitted || 0,
        missedDeadline: item.missedDeadline || 0,
        declined: item.declined || 0,
        // Keep backward compatibility
        submissions: item.submitted || 0,
        evaluations: item.missedDeadline || 0,
      };
    });
  }

  /**
   * Transform Solicitation Activities data for area chart with monthly x-axis
   */

  /**
   * Transform Procurement Total Evaluations data for bar chart
   */
  static transformProcurementTotalEvaluations(data: any) {
    // Handle new API format with labels and datasets
    if (data && data.labels && data.datasets) {
      const { labels, datasets } = data;

      // Find datasets by name
      const onTimeDataset = datasets.find((d: any) => d.name === "On Time");
      const lateDataset = datasets.find((d: any) => d.name === "Late");
      const pendingDataset = datasets.find((d: any) => d.name === "Pending");
      const completedDataset = datasets.find(
        (d: any) => d.name === "Completed"
      );

      return labels.map((label: string, index: number) => ({
        month: label,
        onTime: onTimeDataset?.values[index] || 0,
        late: lateDataset?.values[index] || 0,
        pending: pendingDataset?.values[index] || 0,
        completed: completedDataset?.values[index] || 0,
      }));
    }

    // Handle legacy array format
    if (!data || !Array.isArray(data)) {
      return Array.from({ length: 12 }, (_, i) => ({
        month: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ][i],
        onTime: 0,
        late: 0,
        pending: 0,
        completed: 0,
      }));
    }

    return data.map((item: any) => ({
      month: item.label || item.month || "Unknown",
      onTime: item.onTime || 0,
      late: item.late || 0,
      pending: item.pending || 0,
      completed: item.completed || 0,
    }));
  }

  /**
   * Transform Evaluator dashboard data into stats cards
   */
  static transformEvaluatorStats(
    data: EvaluatorDashboardData | undefined
  ): DashboardConfig["stats"] {
    if (!data) {
      // Return default/loading state
      return [
        {
          title: "All Evaluations",
          value: 0,
          icon: "file",
          color: "text-gray-500",
          bgColor: "bg-gray-500/10",
        },
        {
          title: "Active Evaluations",
          value: 0,
          icon: "file",
          color: "text-green-500",
          bgColor: "bg-green-500/10",
        },
        {
          title: "Pending Evaluations",
          value: 0,
          icon: "file",
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
        },
        {
          title: "Completed Evaluations",
          value: 0,
          icon: "file",
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
        },
      ];
    }

    return [
      {
        title: "All Evaluations",
        value: data.total || 0,
        icon: "file",
        color: "text-gray-500",
        bgColor: "bg-gray-500/10",
      },
      {
        title: "Active Evaluations",
        value: data.active || 0,
        icon: "file",
        color: "text-green-500",
        bgColor: "bg-green-500/10",
      },
      {
        title: "Pending Evaluations",
        value: data.pending || 0,
        icon: "file",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
      },
      {
        title: "Completed Evaluations",
        value: data.completed || 0,
        icon: "file",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
      },
    ];
  }

  /**
   * Transform Evaluator My Actions data for activity component
   */
  static transformEvaluatorMyActions(data: EvaluatorMyActions | undefined) {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    // const getFormattedText = (
    //   statusText: string,
    //   data: { id: string; name: string }
    // ) => {
    //   const actions = applyDynamicStatusTextReplacement(
    //     statusText,
    //     "evaluator",
    //     "myActions",
    //     data
    //   );

    //   return actions;
    // };
    // console.log(action);
    return data.map((action: any, index: number) => ({
      id: action?.evaluation._id || `action-${index}`,
      title: action?.evaluation.solicitation?.name,
      text: applyDynamicStatusTextReplacement(
        action.statusText,
        "evaluator",
        "general",
        {
          name: action?.evaluation?.solicitation?.name,
          solId: action?.evaluation?.solicitation?._id,
          evaId: action?.evaluation?._id,
          evaGroupId: action?.evaluationGroup?._id,
        }
      ),
      type: action.type || "unknown",
      date: action.createdAt
        ? formatDateTZ(action.createdAt, "MMM d, yyyy h:mm a 'GMT'xxx", action.solicitation?.timezone || "")
        : undefined,
    }));
  }

  /**
   * Transform Evaluator Evaluation Updates data for activity component
   */
  static transformEvaluatorEvaluationUpdates(
    data: EvaluatorEvaluationActivity | undefined
  ) {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    return data.map((update: any, index: number) => ({
      id: update?.evaluation?._id || `update-${index}`,
      title: update?.evaluation?.solicitation?.name ?? "Unknown",
      text: applyDynamicStatusTextReplacement(
        update.statusText,
        "evaluator",
        "general",
        {
          name: update?.evaluation?.solicitation?.name,
          solId: update?.evaluation?.solicitation?._id,
          evaId: update?.evaluation?._id,
          evaGroupId: update?.evaluationGroup?._id,
        }
      ),
      type: update.type || "evaluation",
      date: update.createdAt
        ? formatDateTZ(
            update.date || update.updatedAt || update.createdAt,
            "MMM d, yyyy h:mm a "
          ) +" " + update.evaluation?.timezone || ""
        : undefined,
    }));
  }

  /**
   * Transform Vendor dashboard data into stats cards
   */
  static transformVendorStats(data: any | undefined): DashboardConfig["stats"] {
    if (!data) {
      // Return default/loading state
      return [
        {
          title: "All Invitations",
          value: 0,
          icon: "folder-open",
          color: "text-gray-500",
          bgColor: "bg-gray-500/20",
        },
        {
          title: "Confirmed Invitations",
          value: 0,
          icon: "folder-open",
          color: "text-green-600",
          bgColor: "bg-green-500/20",
        },
        {
          title: "Declined Invitations",
          value: 0,
          icon: "folder-open",
          color: "text-red-500",
          bgColor: "bg-red-500/20",
        },
        {
          title: "Pending Invitations",
          value: 0,
          icon: "folder-open",
          color: "!text-yellow-500",
          bgColor: "bg-yellow-500/20",
        },
      ];
    }

    // Support both legacy vendor dashboard format and invitation dashboard format
    let confirmed = 0;
    let declined = 0;
    let pending = 0;
    let all = 0;

    if (Array.isArray(data)) {
      // Legacy array format: [{ status: string, count: number }, ...]
      const map = (data as any[]).reduce(
        (acc: Record<string, number>, item: any) => {
          const key = String(item?.status || "").toLowerCase();
          acc[key] = (item?.count as number) || 0;
          return acc;
        },
        {}
      );
      confirmed = map["confirmed"] || map["active"] || 0;
      declined = map["declined"] || 0;
      pending = map["invited"] || map["pending"] || map["no_response"] || 0;
      all = Object.values(map).reduce((sum, v) => sum + (v || 0), 0);
    } else if (data && typeof data === "object") {
      // Invitation dashboard format: { confirmed, declined, invited }
      const obj = data as Record<string, number>;
      confirmed = obj["confirmed"] || obj["active"] || 0;
      declined = obj["declined"] || 0;
      pending = obj["invited"] || obj["pending"] || 0;
      all =
        (obj["confirmed"] || 0) +
        (obj["declined"] || 0) +
        (obj["invited"] || 0);
      // Fallback to legacy object keys if present
      if (
        !all &&
        (obj["all"] || obj["draft"] || obj["active"] || obj["pending"])
      ) {
        all = obj["all"] || 0;
        confirmed = obj["active"] || confirmed;
        declined = obj["declined"] || declined;
        pending = obj["pending"] || pending;
      }
    }

    return [
      {
        title: "All Invitations",
        value: all || 0,
        icon: "folder-open",
        color: "text-gray-500",
        bgColor: "bg-gray-500/20",
      },
      {
        title: "Confirmed Invitations",
        value: confirmed || 0,
        icon: "folder-open",
        color: "text-green-600",
        bgColor: "bg-green-500/20",
      },
      {
        title: "Declined Invitations",
        value: declined || 0,
        icon: "folder-open",
        color: "text-red-500",
        bgColor: "bg-red-500/20",
      },
      {
        title: "Pending Invitations",
        value: pending || 0,
        icon: "folder-open",
        color: "!text-yellow-500",
        bgColor: "bg-yellow-500/20",
      },
    ];
  }

  /**
   * Transform Vendor My Actions data for activity component
   * Based on VendorAction schema: array of objects with action and solicitation properties
   */
  static transformVendorMyActions(data: VendorMyActions[] | undefined) {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    const getFormattedText = (
      statusText: string,
      data: { name: string; solId?: string; evaId?: string }
    ) => {
      return applyDynamicStatusTextReplacement(
        statusText,
        "vendor",
        "myActions",
        data
      );
    };

    return data.map((action, index) => {
      return {
        id: action._id || `vendor-action-${index}`,
        text: getFormattedText(action.statusText, {
          name:
            action?.solicitation?.name ?? action?.evaluation?.name ?? "Unknown",
          solId: action?.solicitation?._id,
          evaId: action?.evaluation?._id,
        }),
        date: action.createdAt
          ? formatDateTZ(action.createdAt, "MMM d, yyyy h:mm a", action.solicitation?.timezone || "")
          : null,
        title: action?.solicitation?.name ?? "Unknown Solicitation",
      };
    });
  }

  /**
   * Transform Vendor General Updates data for activity component
   */
  static transformVendorGeneralUpdates(data: any | undefined) {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((update: any, index: number) => {
      const isCampaign =
        update?.action === "campaign" ||
        update?.campaignType ||
        (!!update?.subject && !!update?.message) ||
        !!update?.campaign;

      if (isCampaign) {
        const campaign = {
          subject: update?.subject ?? update?.campaign?.subject ?? "",
          subtitle: update?.subtitle ?? update?.campaign?.subtitle,
          message: update?.message ?? update?.campaign?.message ?? "",
          recipientType:
            update?.recipientType ??
            update?.campaign?.recipientType ??
            "all_users",
          users:
            update?.users ?? update?.userIds ?? update?.campaign?.users ?? [],
          bannerUrl: update?.bannerUrl ?? update?.campaign?.bannerUrl,
          campaignType: update?.campaignType ?? update?.type ?? "campaign",
          createdAt:
            update?.createdAt ?? update?.date ?? new Date().toISOString(),
          timezone: update?.solicitation?.timezone ?? "",
        };

        return {
          id: update?._id || update?.id || `vendor-update-${index}`,
          action: "campaign",
          campaign,
          title: campaign.subject || "Campaign",
          text:
            update?.statusText ||
            (campaign.subtitle
              ? `<strong>${campaign.subject}</strong> — ${campaign.subtitle}`
              : `<strong>${campaign.subject}</strong>`),
          time:
            update?.time ||
            (campaign.createdAt
              ? `${formatDateTZ(
                  campaign.createdAt,
                  "MMM d, yyyy",
                  campaign?.timezone
                )} • ${formatDateTZ(campaign.createdAt, "h:mm a", campaign?.timezone || "")}`
              : `${formatDateTZ(new Date(), "MMM d, yyyy")} • ${formatDateTZ(
                  new Date(),
                  "h:mm a",
                  campaign?.timezone || ""
                )}`),
        };
      }

      return {
        id: update.id || `vendor-update-${index}`,
        text: applyDynamicStatusTextReplacement(
          update.statusText,
          "vendor",
          "general",
          {
            name: update?.solicitation?.name ?? "Unknown",
            solId: update?.solicitation?._id,
          }
        ),
        title: update?.solicitation?.name ?? "Unknown",
        time: update?.createdAt
          ? `${formatDateTZ(update.createdAt, "MMM d, yyyy h:mm a", update?.solicitation?.timezone || "")} ${
              update.timezone || update?.solicitation?.timezone || "UTC"
            }`
          : undefined,
      };
    });
  }

  /**
   * Transform Procurement My Actions data for activity component
   */
  static transformProcurementMyActions(data: any[] | undefined) {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    console.log({ data })
    return data.map((action: any, index: number) => {
      const solicitation = action?.solicitation ?? action?.evaluation?.solicitation;

      return {
      id: solicitation?._id || `action-${index}`,
      text: applyDynamicStatusTextReplacement(
        action.statusText,
        "procurement",
        "myActions",
        {
          name: solicitation?.name,
          solId: solicitation?._id,
          evaId: action?.evaluation?._id,
          evaGroupId: action?.evaluationGroup?._id,
        }
      ),
      type: action?.replace?.("_", " ") || "",
      title: solicitation?.name ?? "Unknown",
      date: 
        solicitation?.createdAt
          ? formatDateTZ(
              solicitation?.createdAt,
              "MMM d, yyyy h:mm a 'GMT'xxx",
              solicitation?.timezone
            )
          : null,
      status: action.status || "active",
      };
    });
  }

  /**
   * Transform Procurement General Updates data for activity component
   */
  static transformProcurementGeneralUpdates(data: any[] | undefined) {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((update: any, index: number) => {
      const isCampaign =
        update?.action === "campaign" ||
        update?.campaignType ||
        (!!update?.subject && !!update?.message) ||
        !!update?.campaign;

      if (isCampaign) {
        const campaign = {
          subject: update?.subject ?? update?.campaign?.subject ?? "",
          subtitle: update?.subtitle ?? update?.campaign?.subtitle,
          message: update?.message ?? update?.campaign?.message ?? "",
          recipientType:
            update?.recipientType ??
            update?.campaign?.recipientType ??
            "all_users",
          users:
            update?.users ?? update?.userIds ?? update?.campaign?.users ?? [],
          bannerUrl: update?.bannerUrl ?? update?.campaign?.bannerUrl,
          campaignType: update?.campaignType ?? update?.type ?? "campaign",
          createdAt:
            update?.updatedAt ??
            update?.createdAt ??
            update?.date ??
            new Date().toISOString(),
          timezone: update?.solicitation?.timezone || "",
        };

        return {
          id: update?._id || update?.id || `update-${index}`,
          action: "campaign",
          title: campaign.subject || "Campaign",
          text:
            update?.statusText ||
            (campaign.subtitle
              ? `<strong>${campaign.subject}</strong> — ${campaign.subtitle}`
              : `<strong>${campaign.subject}</strong>`),
          date: campaign.createdAt
            ? `${formatDateTZ(campaign.createdAt, "MMM d, yyyy h:mm a", campaign.timezone || "")} `
            : formatDateTZ(new Date(), "MMM d, yyyy h:mm a 'GMT'xxx", campaign.timezone || ""),
          status: update?.status || "active",
          campaign,
        };
      }

      const sol = update?.solicitation ?? null;
      const evaluation = update?.solicitation?.evaluation ?? null;

      const title = sol?.name ?? evaluation?.name ?? "Unknown";
      const entityName = sol?.name ?? evaluation?.name ?? "Unknown";

      return {
        id: update._id || update.id || ``,
        title,
        text: applyDynamicStatusTextReplacement(
          update?.statusText ?? "",
          "procurement",
          "general",
          {
            name: entityName,
            solId: sol?._id,
            evaId: evaluation?._id,
          }
        ),
        date: update?.createdAt
          ? `${formatDateTZ(update.createdAt, "MMM d, yyyy h:mm a")} ${
              update.solicitation.timezone || ""
            }`
          : undefined,
        status: update?.status || "active",
      };
    });
  }

  static transformContractManagerDashboardActivity(data: any[] | undefined) {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Map a My-Action entry's detailType/type to the contract detail tab it belongs to,
    // so the link lands on the relevant tab instead of the contract overview.
    const DETAIL_TYPE_TO_TAB: Record<string, string> = {
      Deliverable: "deliverables",
      ContractInvoice: "invoice",
      ContractKPI: "kpi",
      ContractInsurance: "compliance",
      ContractChange: "change",
      ContractRfi: "rfi",
      ContractNcr: "ncr-log",
      ContractNCR: "ncr-log",
      ContractClaim: "claims",
      ContractAmendment: "amendments",
      ContractLem: "lem",
      ContractHoldBack: "payment-summary",
      ContractSaving: "payment-summary",
    };

    return data.map((item: any, index: number) => {
      const statusText: string = item?.statusText ?? "";
      const actionText: string = item?.actionText ?? "";
      const contractRef = item?.contractRef ?? "";
      const contractDef = String(item?.contractDef ?? item?.type ?? "Contract");
      const isMSA = /msa/i.test(contractDef);
      const detailBase = isMSA ? "/dashboard/msa" : "/dashboard/contract-management";
      const dateValue = item?.date ?? item?.createdAt;
      // Deep-link to the specific tab (contract detail only; the MSA page tabs differ).
      const deepLinkTab = !isMSA
        ? DETAIL_TYPE_TO_TAB[String(item?.detailType ?? item?.type ?? "")]
        : undefined;
      const contractUrl = contractRef
        ? `${detailBase}/${contractRef}${deepLinkTab ? `?tab=${deepLinkTab}` : ""}`
        : "";
      const linkClass = "underline underline-offset-4 text-blue-600";

      // Action-log shape (260528): { actionText, statusText, action, detailRef, detailType, ... }.
      // Keep the action label plain to match General Updates, and wrap the
      // descriptive body in the contract deep link.
      if (actionText) {
        const body = contractUrl && statusText
          ? `<a href="${contractUrl}" class="${linkClass}">${statusText}</a>`
          : statusText;
        return {
          id: item?.id ?? `cm-${index}`,
          title: statusText || "Action",
          text: body ? `${actionText} — ${body}` : actionText,
          date: dateValue ? formatDateTZ(dateValue, "MMM d, yyyy h:mm a") : undefined,
          status: item?.status ?? undefined,
          type: item?.type ?? undefined,
        };
      }

      // General-update shape (260528): { statusText, date, contractRef, contractDef, type, status, id }.
      // statusText contains the contract title in quotes — wrap that span in an <a>.
      if (statusText) {
        const quotedTitleMatch = statusText.match(/"([^"]+)"/);
        const contractTitle = quotedTitleMatch?.[1] ?? "";
        const linkedText = contractUrl && quotedTitleMatch
          ? statusText.replace(
              quotedTitleMatch[0],
              `"<a href="${contractUrl}" class="${linkClass}">${contractTitle}</a>"`,
            )
          : statusText;

        return {
          id: item?.id ?? `cm-${index}`,
          title: contractTitle || "Contract",
          text: linkedText,
          date: dateValue ? formatDateTZ(dateValue, "MMM d, yyyy h:mm a") : undefined,
          status: item?.status ?? undefined,
          type: item?.type ?? undefined,
        };
      }

      // Legacy shape fallback: { title, description, contractTitle, requestedBy, createdAt, ... }
      const title = item?.title ?? "";
      const description = item?.description ?? "";
      const contractTitle = item?.contractTitle ?? "";
      const requestedBy = item?.requestedBy ?? "";
      const linkedContractTitle =
        contractRef && contractTitle
          ? `<a href="${detailBase}/${contractRef}" class="underline underline-offset-4 text-blue-600">${contractTitle}</a>`
          : contractTitle;
      // Plain text (no bold) to match the General Updates styling — QA #225.
      const plainTitle = title || "Update";
      const suffixParts = [description, linkedContractTitle, requestedBy].filter(Boolean);
      const suffix = suffixParts.length > 0 ? ` — ${suffixParts.join(" • ")}` : "";

      return {
        id: item?.id ?? `cm-${index}`,
        title: contractTitle || title || "Contract",
        text: `${plainTitle}${suffix}`,
        date: dateValue ? formatDateTZ(dateValue, "MMM d, yyyy h:mm a") : undefined,
        status: item?.status ?? undefined,
        type: item?.type ?? undefined,
      };
    });
  }

  /**
   * Transform Company Admin General Updates data for activity component
   * Based on VendorUpdate schema: array of objects with action, createdAt, and solicitation properties
   */
  static transformCompanyAdminGeneralUpdates(data: any[] | undefined) {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((update: any, index: number) => {
      const isCampaign =
        update?.action === "campaign" ||
        update?.campaignType ||
        (!!update?.subject && !!update?.message) ||
        !!update?.campaign;

      if (isCampaign) {
        const campaign = {
          subject: update?.subject ?? update?.campaign?.subject ?? "",
          subtitle: update?.subtitle ?? update?.campaign?.subtitle,
          message: update?.message ?? update?.campaign?.message ?? "",
          recipientType:
            update?.recipientType ??
            update?.campaign?.recipientType ??
            "all_users",
          users:
            update?.users ?? update?.userIds ?? update?.campaign?.users ?? [],
          bannerUrl: update?.bannerUrl ?? update?.campaign?.bannerUrl,
          campaignType: update?.campaignType ?? update?.type ?? "campaign",
          createdAt:
            update?.updatedAt ??
            update?.createdAt ??
            update?.date ??
            new Date().toISOString(),
          timezone: update?.solicitation?.timezone || "",
        };

        return {
          id: update._id || update.id || `admin-update-${index}`,
          action: "campaign",
          title: campaign.subject || "Campaign",
          text:
            update?.statusText ||
            (campaign.subtitle
              ? `<strong>${campaign.subject}</strong> — ${campaign.subtitle}`
              : `<strong>${campaign.subject}</strong>`),
          date: campaign.createdAt
            ? `${formatDateTZ(campaign.createdAt, "MMM d, yyyy h:mm a", campaign.timezone || "")} `
            : formatDateTZ(new Date(), "MMM d, yyyy h:mm a 'GMT'xxx", campaign.timezone || ""),
          status: update?.status || "active",
          campaign,
        };
      }

      const sol = update?.solicitation ?? null;
      const evaluation = update?.evaluation ?? null;

      const title = sol?.name ?? evaluation?.name ?? "Unknown";
      const entityName = sol?.name ?? evaluation?.name ?? "Unknown";

      return {
        id: update._id || update.id || `admin-update-${index}`,
        title,
        text: applyDynamicStatusTextReplacement(
          update?.statusText ?? "",
          "procurement",
          "general",
          {
            name: entityName,
            solId: sol?._id,
            evaId: evaluation?._id,
          }
        ),
        date:
          update?.updatedAt || update?.date || update?.createdAt
            ? `${formatDateTZ(
                update.updatedAt || update.date || update.createdAt,
                "MMM d, yyyy h:mm a"
              )} ${update.solicitation?.timezone || ""}`
            : formatDateTZ(new Date(), "MMM d, yyyy h:mm a 'GMT'xxx", update.solicitation?.timezone || ""),
        status: update?.status || "active",
      };
    });
  }

  /**
   * Transform Solicitation Status data for chart
   */
  static transformSolicitationStatusChart(data: any) {
    if (!data) {
      return applyConsistentColors([
        { name: "Active", value: 0 },
        { name: "Draft", value: 0 },
        { name: "Closed", value: 0 },
        { name: "Awarded", value: 0 },
      ]);
    }

    const chartData = [
      { name: "Active", value: data.active || 0 },
      { name: "Draft", value: data.draft || 0 },
      { name: "Closed", value: data.closed || 0 },
      { name: "Awarded", value: data.awarded || 0 },
    ];

    return applyConsistentColors(chartData);
  }

  /**
   * Transform Bid Intent data for chart
   */
  static transformBidIntentChart(data: any) {
    if (!data) {
      return applyConsistentColors([
        { name: "Confirmed", value: 0 },
        { name: "Declined", value: 0 },
        { name: "Invited", value: 0 },
      ]);
    }

    const total =
      (data.confirmed || 0) + (data.declined || 0) + (data.invited || 0);

    const chartData = [
      {
        name: "Confirmed",
        value: data.confirmed || 0,
        percentage: total > 0 ? Math.round((data.confirmed / total) * 100) : 0,
      },
      {
        name: "Declined",
        value: data.declined || 0,
        percentage: total > 0 ? Math.round((data.declined / total) * 100) : 0,
      },
      {
        name: "Invited",
        value: data.invited || 0,
        percentage: total > 0 ? Math.round((data.invited / total) * 100) : 0,
      },
    ];

    return applyConsistentColors(chartData);
  }

  /**
   * Transform Total Evaluations data for chart
   */
  static transformTotalEvaluations(data: any) {
    if (!data || !Array.isArray(data)) {
      return Array.from({ length: 12 }, (_, i) => ({
        month: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ][i],
        evaluations: 0,
        completed: 0,
        pending: 0,
      }));
    }

    return data.map((item: any) => ({
      month: item.label || item.month || "Unknown",
      evaluations: item.total || item.evaluations || 0,
      completed: item.completed || 0,
      pending: item.pending || 0,
    }));
  }
}
