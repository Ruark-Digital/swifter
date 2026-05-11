/**
 * Utility functions for solicitation status handling
 * Maps API status values to descriptive display text
 */

export type SolicitationStatus = "draft" | "published" | "closed" | "under evaluation" | "completed" | "awarded";

export interface StatusDisplayInfo {
  label: string;
  description: string;
  colorClass: string;
}

/**
 * Normalizes status from API (converts to lowercase and handles variations)
 */
export const normalizeStatus = (status: string): SolicitationStatus => {
  const normalized = status.toLowerCase().trim();
  
  // Handle API variations - map "active" and "evaluating" to correct statuses
  switch (normalized) {
    case "active":
      return "published";
    case "evaluating":
      return "under evaluation";
    default:
      return normalized as SolicitationStatus;
  }
};

/**
 * Maps normalized status to display information
 */
export const getStatusDisplayInfo = (status: string): StatusDisplayInfo => {
  const normalizedStatus = normalizeStatus(status);
  
  switch (normalizedStatus) {
    case "draft":
      return {
        label: "Draft",
        description: "Draft Solicitation is still being created or edited; not visible to vendors.",
        colorClass: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      };
    case "published":
      return {
        label: "Published",
        description: "The solicitation is live, vendors can submit, but evaluation has not been configured yet.",
        colorClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      };
    case "closed":
      return {
        label: "Closed",
        description: "Submission deadline has passed; proposals have been submitted, but evaluation groups have not been released by the Procurement Lead.",
        colorClass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      };
    case "under evaluation":
      return {
        label: "Under Evaluation",
        description: "Evaluation Groups and Proposals have been released and evaluation is in progress.",
        colorClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      };
    case "completed":
      return {
        label: "Completed",
        description: "Evaluation is completed (All Evaluators have graded their assigned proposals/groups).",
        colorClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      };
    case "awarded":
      return {
        label: "Awarded",
        description: "Status changes to awarded after the Procurement Lead has awarded the Solicitation to the winning proponent/vendor.",
        colorClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      };
    default:
      return {
        label: status,
        description: "",
        colorClass: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      };
  }
};

/**
 * Gets the display label for a status
 */
export const getStatusLabel = (status: string): string => {
  return getStatusDisplayInfo(status).label;
};

/**
 * Gets the color class for a status
 */
export const getStatusColorClass = (status: string): string => {
  return getStatusDisplayInfo(status).colorClass;
};

/**
 * Gets the description for a status
 */
export const getStatusDescription = (status: string): string => {
  return getStatusDisplayInfo(status).description;
};