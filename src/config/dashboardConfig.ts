import { UserRole } from "../types";
// import { format } from "date-fns";

// Dashboard configuration for different roles
export interface DashboardConfig {
  stats: {
    title: string;
    value: number;
    icon: string;
    color: string;
    bgColor: string;
    currency?: string;
  }[];
  rows: {
    type: "chart" | "activity" | "mixed";
    className?: string;
    properties: {
      cy?: string;
      cx?: string;
      id?: string;
      title?: string;
      selectors?: string[]
      type?: "pie" | "line" | "bar" | "donut" | "area" | "radar";
      data?: any[];
      visible?: boolean;
      filters?: string[];
      items?: any[];
      to?: string;
      innerRadius?: number;
      outerRadius?: number;
      className?: string;
      stacked?: boolean; // Whether to stack bars in a bar chart
      // Axis visibility and overrides
      showXAxis?: boolean; // Toggle X axis visibility
      showYAxis?: boolean; // Toggle Y axis visibility
      axisProps?: { x?: { [key: string]: any }; y?: { [key: string]: any } }; // Axis prop overrides
      layout?: "horizontal" | "vertical"; // Bar chart layout orientation
      showLegend?: boolean; // Whether to show legend
      centerText?: {
        value: string | number;
        label: string;
      };
      headerNote?: string;
      sidePanel?: { items: { label: string; value?: string | number; desc?: string; color?: string }[] };
      // Dynamic styling properties
      colors?: { [key: string]: string }; // Custom colors for data keys
      fillColors?: { [key: string]: string }; // Custom fill colors for area charts
      strokeWidth?: number; // Line/area stroke width
      dotRadius?: number; // Dot radius for line/area charts
      activeDotRadius?: number; // Active dot radius for line/area charts
      fillOpacity?: number; // Fill opacity for area charts
      barSize?: number; // Bar size for bar charts
      barClassName?: string; // Bar CSS class
      barRadius?: [number, number, number, number]; // Bar border radius [topLeft, topRight, bottomRight, bottomLeft]
      gridVertical?: boolean; // Show vertical grid lines
      // Stacking mode for Area/Bar charts (Recharts supported values)
      // See: https://recharts.org/en-US/api/BarChart#stackOffset
      stackOffset?: "none" | "expand" | "wiggle" | "silhouette";
      legendPosition?: {
        vertical?: "top" | "middle" | "bottom";
        horizontal?: "left" | "center" | "right";
      };
      legendLayout?: "horizontal" | "vertical";
      legendIconType?:
        | "line"
        | "rect"
        | "circle"
        | "cross"
        | "diamond"
        | "square"
        | "star"
        | "triangle"
        | "wye";
      lineType?:
        | "basis"
        | "basisClosed"
        | "basisOpen"
        | "linear"
        | "linearClosed"
        | "natural"
        | "monotoneX"
        | "monotoneY"
        | "monotone"
        | "step"
        | "stepBefore"
        | "stepAfter";
      strokeDasharray?: { [key: string]: string }; // Custom dash patterns for lines
      defaultFill?: string; // Default fill color for pie charts
      labelLine?: boolean; // Show label lines for pie charts
      startAngle?: number; // Start angle for pie charts
      endAngle?: number; // End angle for pie charts
    }[];
  }[];
}

// Evaluator Dashboard Configuration
const evaluatorConfig: DashboardConfig = {
  stats: [
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
  ],
  rows: [
    {
      type: "activity",
      properties: [
        {
          id: "my-actions",
          title: "My Actions",
          items: [],
        },
        {
          id: "evaluation-updates",
          title: "Evaluation Update",
          items: [],
        },
      ],
    },
  ],
};

// Vendor Dashboard Configuration
const vendorConfig: DashboardConfig = {
  stats: [
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
  ],
  rows: [
    {
      type: "activity",
      properties: [
        {
          id: "my-actions",
          title: "My Actions",
          items: [],
        },
        {
          id: "general-updates",
          title: "General Updates",
          items: [],
        },
      ],
    },
  ],
};

// Company Admin Dashboard Configuration
const companyAdminConfig: DashboardConfig = {
  stats: [
    {
      title: "All Solicitations",
      value: 0,
      icon: "folder-open",
      color: "text-gray-500",
      bgColor: "bg-gray-500/20",
    },
    {
      title: "Published Solicitations",
      value: 0,
      icon: "folder-open",
      color: "text-green-500",
      bgColor: "bg-green-500/20",
    },
    {
      title: "Under Evaluations",
      value: 0,
      icon: "folder-open",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/20",
    },
    {
      title: "Closed Solicitations",
      value: 0,
      icon: "folder-open",
      color: "text-red-500",
      bgColor: "bg-red-500/20",
    },

    {
      title: "All Evaluations",
      value: 0,
      icon: "file",
      color: "text-gray-500",
      bgColor: "bg-gray-500/20",
    },
    {
      title: "Active Evaluations",
      value: 0,
      icon: "file",
      color: "text-green-500",
      bgColor: "bg-green-500/20",
    },
    {
      title: "Pending Evaluations",
      value: 0,
      bgColor: "bg-red-500/20",
      icon: "file",
      color: "text-red-500",
    },
    {
      title: "Completed Evaluations",
      value: 0,
      bgColor: "bg-yellow-500/20",
      icon: "file",
      color: "text-yellow-500",
    },

    {
      title: "All Users",
      value: 0,
      icon: "users",
      color: "text-gray-500",
      bgColor: "bg-gray-500/20",
    },
    {
      title: "Admins",
      value: 0,
      icon: "user",
      color: "text-gray-500",
      bgColor: "bg-gray-500/20",
    },
    {
      title: "Procurement Leads",
      value: 0,
      bgColor: "bg-gray-500/20",
      icon: "user",
      color: "text-gray-500",
    },
    {
      title: "Evaluators",
      value: 0,
      bgColor: "bg-gray-500/20",
      icon: "user",
      color: "text-gray-500",
    },
  ],
  rows: [
    {
      type: "mixed",
      properties: [
        {
          id: "vendors-distribution",
          title: "Vendors Distribution",
          type: "donut",
          centerText: {
            value: 0,
            label: "Vendors",
          },
          innerRadius: 100,
          data: [],
          visible: true,
        },
        {
          title: "General Updates",
          items: [],
        },
      ],
    },
    {
      type: "chart",
      className: "lg:grid-cols-3",
      properties: [
        {
          id: "proposal-submission",
          title: "Proposal Submission",
          type: "area",
          className: "col-span-2",
          data: [],
          visible: true,
          showLegend: true,
          filters: ["12 months", "6 months", "3 months", "30 days", "7 days"],
        },
        {
          id: "vendors-intent-status",
          title: "Vendors Bid Intent Status",
          type: "donut",
          centerText: {
            value: 0,
            label: "Active Bids",
          },
          innerRadius: 100,
          data: [],
          visible: true,
        },
      ],
    },
    {
      type: "chart",
      properties: [
        {
          id: "solicitation-status",
          title: "Solicitation Status",
          type: "pie",
          outerRadius: 150,
          data: [],
          visible: true,
          filters: ["12 months", "6 months", "3 months", "30 days", "7 days"],
          legendIconType: "circle",
          legendPosition: { horizontal: "left" },
        },
        {
          id: "company-role-distribution",
          title: "Role Distribution",
          type: "bar",
          layout: "vertical",
          data: [],
          visible: true,
          filters: ["12 months", "3 months", "30 days", "7 days", "24 hours"],
          showLegend: false,
          colors: {
            value: "#2A4467",
          },
          barSize: 30,
          barRadius: [0, 4, 4, 0],
        }
      ],
    },
  ],
};

// Super Admin Dashboard Configuration
const superAdminConfig: DashboardConfig = {
  stats: [
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
  ],
  rows: [
    {
      type: "chart",
      className: "lg:grid-cols-3",
      properties: [
        {
          id: "weekly-activities",
          title: "Company Activity",
          type: "area",
          className: "col-span-2",
          data: [],
          visible: true,
          filters: ["12 months", "6 months", "3 months", "30 days", "7 days"],
        },
        {
          id: "sub-distribution",
          title: "Subscription Distribution",
          type: "donut",
          outerRadius: 150,
          centerText: {
            value: 0,
            label: "Active Subscriptions",
          },
          innerRadius: 100,
          data: [],
          visible: true,
          filters: ["12 months", "6 months", "3 months", "30 days", "7 days"],
        },
      ],
    },
    {
      type: "chart",
      className: "lg:grid-cols-2",
      properties: [
        {
          id: "company-status",
          title: "Company Status Overview",
          type: "bar",
          className: "col-span-2",
          filters: ["12 months", "6 months", "3 months", "30 days", "7 days"],
          data: [],
          stacked: true,
          visible: true,
          legendIconType: "circle",
        },
      ],
    },
    {
      type: "chart",
      properties: [
        {
          id: "portal-role-distribution",
          title: "Portal Role Distribution",
          type: "pie",
          outerRadius: 150,
          data: [],
          visible: true,
          filters: ["12 months", "6 months", "3 months", "30 days", "7 days"],
          legendIconType: "circle",
        },
        {
          id: "module-usage",
          title: "Module Usage",
          type: "bar",
          data: [],
          visible: true,
          stacked: true,
          showXAxis: true,
          showLegend: true,
          legendIconType: "circle",
          selectors: ["solicitation", "evaluation", "Vendor", "Addendum"],
          filters: ["12 months", "6 months", "3 months", "30 days", "7 days"],
          colors: {
            solicitation: "#3b82f6", // Blue
            evaluation: "#10b981",   // Green
            vendor: "#f59e0b",       // Amber
            Vendor: "#f59e0b",       // Amber (legacy key)
            addendum: "#ef4444",     // Red
            Addendum: "#ef4444",     // Red (legacy key)
          },
        },
      ],
    },
  ],
};

// Procurement Dashboard Configuration
const procurementConfig: DashboardConfig = {
  stats: [
    {
      title: "All Solicitations",
      value: 0,
      icon: "folder",
      color: "bg-blue-500/30",
      bgColor: "bg-blue-500",
    },
    {
      title: "Active Solicitations",
      value: 0,
      icon: "folder-open",
      color: "bg-green-500/30",
      bgColor: "bg-green-500",
    },
    {
      title: "Pending Evaluations",
      value: 0,
      icon: "clock",
      color: "bg-yellow-500/30",
      bgColor: "bg-yellow-500",
    },
    {
      title: "Awarded",
      value: 0,
      icon: "award",
      color: "bg-blue-500/30",
      bgColor: "bg-blue-500",
    },
  ],
  rows: [
    {
      type: "activity",
      properties: [
        {
          id: "my-actions",
          title: "My Actions",
          items: [],
        },
        {
          id: "general-updates",
          title: "General Updates",
          items: [],
        },
      ],
    },
    {
      type: "chart",
      className: "lg:grid-cols-3",
      properties: [
        {
          id: "solicitation-status",
          title: "Solicitation Status",
          type: "pie",
          outerRadius: 150,
          data: [],
          visible: true,
          filters: ["12 months", "6 months", "3 months", "30 days", "7 days"],
        },
        {
          id: "solicitation-activities",
          title: "Solicitations Vs Evaluations",
          type: "area",
          className: "col-span-2",
          data: [],
          visible: true,
          filters: ["12 months", "6 months", "3 months", "30 days", "7 days"],
        },
      ],
    },
    {
      type: "chart",
      className: "lg:grid-cols-3 ",
      properties: [
        {
          id: "proposal-submission",
          title: "Proposal Submission",
          type: "line",
          className: "col-span-2",
          filters: ["12 months", "6 months", "3 months", "30 days", "7 days"],
          data: [],
          visible: true,
        },

        {
          id: "vendors-bid-intent-status",
          title: "Vendors Bid Intent Status",
          type: "donut",
          innerRadius: 100,
          outerRadius: 90,
          data: [],
          centerText: {
            value: 0,
            label: "Active Bids",
          },
          visible: true,
        },
      ],
    },
    {
      type: "chart",
      className: "lg:grid-cols-3 ",
      properties: [
        {
          id: "vendors-distribution",
          title: "Vendors Distribution",
          type: "donut",
          data: [],
          innerRadius: 100,

          centerText: {
            value: 0,
            label: "Vendors",
          },
          visible: true,
        },
        {
          id: "total-evaluation",
          title: "Total Evaluation",
          type: "bar",
          className: "col-span-2",
          filters: ["12 months", "6 months", "3 months", "30 days", "7 days"],
          data: [],
          stacked: true,
          showYAxis: false,
          visible: true,
        },
      ],
    },
  ],
};

// Contract Manager Dashboard Configuration (Empty State)
const contractManagerConfig: DashboardConfig = {
  stats: [
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
      title: "Draft Contracts",
      value: 0,
      icon: "folder-open",
      color: "text-yellow-600",
      bgColor: "bg-yellow-500/10",
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
      title: "Committed vs Actual Value",
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
      title: "Upcoming Renewals",
      value: 0,
      icon: "clock",
      color: "text-gray-700",
      bgColor: "bg-gray-500/10",
    },
    {
      title: "High Risk Contracts",
      value: 0,
      icon: "file",
      color: "text-red-600",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Holdbacks",
      value: 0,
      icon: "creditCard",
      color: "text-gray-700",
      bgColor: "bg-gray-500/10",
    },
  ],
  rows: [
    {
      type: "activity",
      properties: [
        {
          id: "my-actions",
          title: "My Actions",
          items: [],
        },
        {
          id: "general-updates",
          title: "General Updates",
          items: [],
        },
      ],
    },
  ],
};

const approverConfig: DashboardConfig = contractManagerConfig;
const viewOnlyConfig: DashboardConfig = contractManagerConfig;

// Export dashboard configurations
export const dashboardConfigs: Record<UserRole, DashboardConfig> = {
  evaluator: evaluatorConfig,
  vendor: vendorConfig,
  project_manager: contractManagerConfig,
  approver: approverConfig,
  view_only: viewOnlyConfig,
  company_admin: companyAdminConfig,
  super_admin: superAdminConfig,
  procurement: procurementConfig,
  contract_manager: contractManagerConfig,
};

// Helper function to get dashboard config by role
export const getDashboardConfig = (role: UserRole): DashboardConfig => {
  return dashboardConfigs[role] || procurementConfig;
};
