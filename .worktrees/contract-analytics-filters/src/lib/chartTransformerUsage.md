# Chart Data Transformer Usage Guide

This guide demonstrates how to use the new unified `ChartDataTransformer` and `DashboardDataTransformer.transformChartData()` methods to convert raw API responses into Recharts-compatible formats.

## Quick Start

```typescript
import { ChartDataTransformer, DashboardDataTransformer } from '@/lib/dashboardDataTransformer';

// Method 1: Direct usage
const chartData = ChartDataTransformer.transformChart('solicitation-status', rawApiData);

// Method 2: Through DashboardDataTransformer (recommended for consistency)
const chartData = DashboardDataTransformer.transformChartData('solicitation-status', rawApiData);
```

## Supported Chart Types

### Pie & Donut Charts

**Chart IDs:** `solicitation-status`, `vendors-distribution`, `sub-distribution`, `portal-role-distribution`, `bid-intent`

**Input Examples:**
```typescript
// Solicitation Status
const rawData = { draft: 2, active: 4, evaluating: 1, closed: 3, awarded: 1 };

// Vendors Distribution
const rawData = {
  active: { count: 5, percentage: 50 },
  pending: { count: 3, percentage: 30 },
  inactive: { count: 2, percentage: 20 }
};

// Subscription Distribution
const rawData = {
  data: {
    distribution: [
      { plan: "Basic", count: 10 },
      { plan: "Pro", count: 5 },
      { plan: "Enterprise", count: 2 }
    ]
  }
};
```

**Output Format:**
```typescript
[
  { name: "Draft", value: 2 },
  { name: "Active", value: 4 },
  { name: "Under Evaluation", value: 1 },
  { name: "Closed", value: 3 },
  { name: "Awarded", value: 1 }
]
```

### Line & Area Charts

**Chart IDs:** `weekly-activities`, `proposal-submission`

**Input Example:**
```typescript
const rawData = [
  { month: 7, year: 2024, submitted: 4, declined: 2, missedDeadline: 1 },
  { month: 8, year: 2024, submitted: 1, declined: 0, missedDeadline: 3 }
];
```

**Output Format:**
```typescript
[
  { month: "Jul", date: "Jul 2024", submitted: 4, declined: 2, missedDeadline: 1 },
  { month: "Aug", date: "Aug 2024", submitted: 1, declined: 0, missedDeadline: 3 }
]
```

### Bar Charts

**Chart IDs:** `company-status`, `total-evaluation`, `role-distribution`, `module-usage`

**Input Examples:**
```typescript
// Stacked Bar (Company Status)
const rawData = [{
  timeStats: [
    { label: "Jul", total: 10, active: 7, expiring: 2 },
    { label: "Aug", total: 12, active: 9, expiring: 1 }
  ]
}];

// Vertical Bar (Module Usage)
const rawData = {
  solicitationUsage: 15,
  evaluationUsage: 8,
  vendorUage: 12, // Note: API typo preserved
  adendumUsage: 5
};
```

**Output Formats:**
```typescript
// Stacked Bar
[
  { month: "Jul", active: 7, suspended: 1, pending: 2 },
  { month: "Aug", active: 9, suspended: 2, pending: 1 }
]

// Vertical Bar
[
  { name: "Solicitation", value: 15 },
  { name: "Evaluation", value: 8 },
  { name: "Vendor", value: 12 },
  { name: "Addendum", value: 5 }
]
```

## Advanced Usage

### Custom Chart Type Override

```typescript
// Force a specific chart type transformation
const chartData = ChartDataTransformer.transformChart(
  'custom-chart-id',
  rawData,
  'pie' // Override inferred type
);
```

### Error Handling

The transformer includes built-in error handling and will return default data structures for empty or malformed inputs:

```typescript
// These all return safe default data
ChartDataTransformer.transformChart('solicitation-status', null);
ChartDataTransformer.transformChart('solicitation-status', undefined);
ChartDataTransformer.transformChart('solicitation-status', {});
```

### Utility Functions

The transformer also exports utility functions for custom transformations:

```typescript
// Convert month numbers to names
const monthName = ChartDataTransformer.getMonthName(7); // "Jul"

// Calculate percentages
const percentage = ChartDataTransformer.calculatePercentage(25, 100); // 25

// Transform key-value objects
const arrayData = ChartDataTransformer.transformKeyValueToArray({
  active: { count: 5 },
  inactive: { count: 3 }
}); // [{ name: "Active", value: 5 }, { name: "Inactive", value: 3 }]

// Extract nested distribution arrays
const distribution = ChartDataTransformer.extractDistributionArray({
  data: { distribution: [{ plan: "Basic", count: 10 }] }
}); // [{ plan: "Basic", count: 10 }]
```

## Integration with Dashboard Components

To use the transformer in your dashboard components:

```typescript
import { DashboardDataTransformer } from '@/lib/dashboardDataTransformer';

const MyChartComponent = ({ chartId, rawData }) => {
  const chartData = DashboardDataTransformer.transformChartData(chartId, rawData);
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" />
      </PieChart>
    </ResponsiveContainer>
  );
};
```

## Migration from Existing Code

If you're currently using role-specific transformation methods, you can gradually migrate:

```typescript
// Old way (still supported)
const oldData = DashboardDataTransformer.transformSolicitationStatus(rawData);

// New way (recommended)
const newData = DashboardDataTransformer.transformChartData('solicitation-status', rawData);
```

The new transformer provides consistent output formats and better error handling while maintaining compatibility with existing chart components.
