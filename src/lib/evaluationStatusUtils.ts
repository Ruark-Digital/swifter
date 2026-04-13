/**
 * Utility functions for evaluation status handling
 * Maps API status values to descriptive display text
 */

export type EvaluationStatus = "draft" | "pending" | "active" | "completed"| "release" |"withhold";

export interface EvaluationStatusDisplayInfo {
  label: string;
  description: string;
  colorClass: string;
}

/**
 * Normalizes evaluation status from API (converts to lowercase)
 */
export const normalizeEvaluationStatus = (status: string): EvaluationStatus => {
  return status.toLowerCase().trim() as EvaluationStatus;
};

/**
 * Maps normalized evaluation status to display information
 */
export const getEvaluationStatusDisplayInfo = (status: string): EvaluationStatusDisplayInfo => {
  const normalizedStatus = normalizeEvaluationStatus(status);
  
  switch (normalizedStatus) {
    case "draft":
      return {
        label: "Draft",
        description: "Not published.",
        colorClass: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700"
      };
    case "pending":
      return {
        label: "Pending",
        description: "Not started by evaluators.",
        colorClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700"
      };
    case "active":
      return {
        label: "Active",
        description: "At least one group has started scoring.",
        colorClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-700"
      };
    case "release":
      return {
        label: "Released",
        description: "At least one group has started scoring.",
        colorClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-700"
      };
    case "withhold":
      return {
        label: "Withheld",
        description: "At least one group has started scoring.",
        colorClass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-700"
      };
    case "completed":
      return {
        label: "Completed",
        description: "All scoring is done.",
        colorClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-700"
      };
    default:
      return {
        label: status,
        description: "",
        colorClass: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700"
      };
  }
};

/**
 * Gets the display label for an evaluation status
 */
export const getEvaluationStatusLabel = (status: string): string => {
  return getEvaluationStatusDisplayInfo(status).label;
};

/**
 * Gets the color class for an evaluation status
 */
export const getEvaluationStatusColorClass = (status: string): string => {
  return getEvaluationStatusDisplayInfo(status).colorClass;
};

/**
 * Gets the description for an evaluation status
 */
export const getEvaluationStatusDescription = (status: string): string => {
  return getEvaluationStatusDisplayInfo(status).description;
};