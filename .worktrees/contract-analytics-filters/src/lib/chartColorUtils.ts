/**
 * Centralized color mapping for dashboard charts
 * Ensures consistent colors across all charts based on status types
 */

export interface StatusColorMap {
  [key: string]: string;
}

/**
 * Standard color palette for different status types
 * Green: Active/Success states
 * Yellow: Pending/Warning states  
 * Red: Error/Failed/Inactive states
 * Blue: Neutral/Info states
 * Purple: Special states (awarded, etc.)
 */
export const STATUS_COLORS: StatusColorMap = {
  // Active/Success states - Green
  'active': '#22c55e',
  'confirmed': '#22c55e', 
  'success': '#22c55e',
  'approved': '#22c55e',
  'completed': '#22c55e',
  'submitted': '#22c55e',
  
  // Pending/Warning states - Yellow
  'pending': '#eab308',
  'warning': '#eab308',
  'under evaluation': '#eab308',
  'evaluating': '#eab308',
  'invited': '#eab308',
  'draft': '#eab308',
  
  // Error/Failed/Inactive states - Red
  'error': '#ef4444',
  'failed': '#ef4444',
  'declined': '#ef4444',
  'inactive': '#ef4444',
  'closed': '#ef4444',
  'suspended': '#ef4444',
  'expired': '#ef4444',
  'late': '#ef4444',
  'misseddeadline': '#eab308', // Yellow for missed deadline to differentiate from declined
  'missed deadline': '#eab308', // Yellow for missed deadline to differentiate from declined
  
  // Neutral/Info states - Blue
  'total': '#3b82f6',
  'all': '#3b82f6',
  'info': '#3b82f6',
  'count': '#06b6d4', // Cyan for count to differentiate from declined
  
  // Special states - Purple
  'awarded': '#8b5cf6',
  'premium': '#8b5cf6',
};

/**
 * Get color for a status/name, with fallback to default colors
 * @param name - The status or item name
 * @param index - Fallback index for default color palette
 * @param customColor - Custom color if provided
 * @returns Hex color string
 */
export const getStatusColor = (
  name: string, 
  index: number = 0, 
  customColor?: string
): string => {
  if (customColor) return customColor;
  
  const normalizedName = name.toLowerCase().trim();
  
  // Check for exact match first
  if (STATUS_COLORS[normalizedName]) {
    return STATUS_COLORS[normalizedName];
  }
  
  // Check for partial matches
  for (const [key, color] of Object.entries(STATUS_COLORS)) {
    if (normalizedName.includes(key)) {
      return color;
    }
  }
  
  // Fallback to default color palette
  const defaultColors = [
    '#3b82f6', // blue
    '#22c55e', // green  
    '#eab308', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
  ];
  
  return defaultColors[index % defaultColors.length];
};

/**
 * Apply consistent colors to chart data array
 * @param data - Array of chart data items
 * @returns Data array with consistent colors applied
 */
export const applyConsistentColors = <T extends { name: string; color?: string }>(data: T[]): T[] => {
  return data.map((item, index) => ({
    ...item,
    color: getStatusColor(item.name, index, item.color)
  }));
};