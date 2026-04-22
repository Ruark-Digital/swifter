import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { DashboardConfig } from "@/config/dashboardConfig";
import { cn } from "@/lib/utils";
import { getStatusColor } from "@/lib/chartColorUtils";
import { RoundedStackedBar, getSegmentPosition } from "@/components/ui/RoundedStackedBar";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type AxisOption = {
  [key: string]: any;
  dataKey?: string | ((data: any[]) => string);
};

type AxisConfig = {
  vertical: { x: AxisOption; y: AxisOption };
  horizontal: { x: AxisOption; y: AxisOption };
};

// axisConfig.ts (or inline if you prefer)
// helpers/chartConfig.ts
// Helper function to determine label key for axes
const getLabelKey = (data: any[]): string => {
  if (!data || data.length === 0) return "name";

  const keys = Object.keys(data[0] || {});
  if (!keys.length) return "name";

  // Prefer common label keys when present
  const preferred = ["name", "month", "label", "category", "date"];
  const found = preferred.find((k) => keys.includes(k));
  if (found) return found;

  // Fallback to the first key (assumed label)
  return keys[0];
};

export const axisConfig: AxisConfig = {
  vertical: {
    x: {
      type: "number" as const,
      axisLine: false,
      tickLine: false,
      tick: { fill: "currentColor" },
      stroke: "currentColor",
      className: "text-gray-500 dark:text-gray-400",
    },
    y: {
      type: "category" as const,
      dataKey: (data: any[]) => getLabelKey(data),
      axisLine: false,
      tickLine: false,
      tick: { fill: "currentColor", fontSize: 12 },
      stroke: "currentColor",
      className: "text-gray-500 dark:text-gray-400",
      width: 110,
    },
  },
  horizontal: {
    x: {
      type: "category" as const,
      dataKey: (data: any[]) => getLabelKey(data),
      tick: { fill: "currentColor", fontSize: 12 },
      stroke: "currentColor",
      className: "text-gray-500 dark:text-gray-400",
      axisLine: true,
      tickLine: true,
      tickMargin: 8,
      interval: 0,
      minTickGap: 5,
      angle: -45,
      textAnchor: "end",
      height: 60,
    },
    y: {
      tick: { fill: "currentColor", fontSize: 12 },
      stroke: "currentColor",
      className: "text-gray-500 dark:text-gray-400",
      axisLine: true,
      tickLine: true,
      allowDecimals: false,
    },
  },
};

export const chartMargins = {
  bar: (layout: string) => ({
    top: 10,
    right: 15,
    left: layout === "horizontal" ? 10 : 20,
    bottom: layout === "horizontal" ? 10 : 25,
  }),
  line: { top: 10, right: 20, left: 10, bottom: 20 },
  area: { top: 10, right: 20, left: 10, bottom: 20 },
};

export const renderAxes = (
  layout: "horizontal" | "vertical",
  data: any[],
  options?: {
    showX?: boolean;
    showY?: boolean;
    axisProps?: { x?: Record<string, any>; y?: Record<string, any> };
  }
) => {
  const config = axisConfig[layout];

  const xPropsBase =
    typeof config.x.dataKey === "function"
      ? { ...config.x, dataKey: config.x.dataKey(data) }
      : config.x;

  const yPropsBase =
    typeof config.y.dataKey === "function"
      ? { ...config.y, dataKey: config.y.dataKey(data) }
      : config.y;

  const xProps = { ...xPropsBase, ...(options?.axisProps?.x || {}) };
  const yProps = { ...yPropsBase, ...(options?.axisProps?.y || {}) };

  const showX = options?.showX !== false;
  const showY = options?.showY !== false;

  const nodes: React.ReactNode[] = [];
  if (showX) nodes.push(<XAxis key="x" {...xProps} />);
  if (showY) nodes.push(<YAxis key="y" {...yProps} />);
  return nodes;
};

interface ChartComponentProps {
  chart: DashboardConfig["rows"][0]["properties"][0];
  selected?: string;
  onFilterChange?: (filter: string) => void;
  chartData?: any; // Dynamic chart data based on individual filter
}

export const ChartComponent: React.FC<ChartComponentProps> = ({
  chart,
  selected,
  onFilterChange,
  chartData,
}) => {
  // Use dynamic chartData if provided, otherwise fallback to chart.data
  let data = chartData || chart.data;

  // Transform single key-value data for bar charts
  if (chart.type === "bar" && data && data.length > 0) {
    const isSingleKeyData = data.every(
      (item: any) => Object.keys(item).length === 1
    );

    if (isSingleKeyData) {
      // For single key-value data, consolidate all keys into a single object
      const consolidatedData: any = { name: "Module Usage" };

      data.forEach((item: any) => {
        const key = Object.keys(item)[0];
        const value = item[key];
        consolidatedData[key] = value;
      });

      // Return as single-item array for bar chart
      data = [consolidatedData];
    }
  }

  const chartConfig = {
    value: {
      label: "Value",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  if (!chart.visible) return null;

  const renderChart = () => {
    const layout = (chart.layout || "horizontal") as "horizontal" | "vertical";

    switch (chart.type) {
      case "pie":
        return (
          <ChartContainer className="h-full w-full" config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%" minHeight={400}>
              <PieChart>
                <Pie
                  data={data}
                  cx={chart.cx || "50%"}
                  cy={chart.cy || "50%"}
                  labelLine={chart.labelLine !== false}
                  outerRadius={chart.outerRadius || 80}
                  fill={chart.defaultFill || "#8884d8"}
                  dataKey="value"
                  startAngle={chart.startAngle || 0}
                  endAngle={chart.endAngle || 360}
                >
                  {data?.map((entry: any, index: number) => {
                    // Use consistent status-based colors
                    const color = getStatusColor(
                      entry.name,
                      index,
                      entry.color || chart.colors?.[entry.name]
                    );

                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Legend
                  layout={chart.legendLayout || "horizontal"}
                  verticalAlign={chart.legendPosition?.vertical || "bottom"}
                  align={chart.legendPosition?.horizontal || "center"}
                  iconType={chart.legendIconType || "rect"}
                  iconSize={10}
                  formatter={(_, __, index) => {
                    const item = data?.[index];
                    return (
                      <span className="ml-0.5 mr-2 items-center inline-block">
                        <span className="mr-2 text-gray-900 dark:text-gray-100">
                          {item.name}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {typeof (item.percentage ?? item.value) === "number"
                            ? Number(item.percentage ?? item.value).toFixed(0)
                            : 0}%
                        </span>
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case "donut":
        return (
          <ChartContainer className="h-full w-full" config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%" minHeight={400}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={chart?.innerRadius ?? 60}
                  outerRadius="95%"
                  dataKey="value"
                  label={false}
                >
                  {data?.map((entry: any, index: number) => {
                    const color = getStatusColor(
                      entry.name,
                      index,
                      entry.color
                    );
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                {chart.centerText && (
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-gray-900 dark:fill-gray-100"
                  >
                    <tspan
                      x="50%"
                      dy="-0.5em"
                      fontSize="24"
                      fontWeight="bold"
                      className="fill-gray-900 dark:fill-gray-100"
                    >
                      {chart.centerText.value}
                    </tspan>
                    <tspan
                      x="50%"
                      dy="1.5em"
                      fontSize="12"
                      className="fill-gray-500 dark:fill-gray-400 max-w-sm"
                    >
                      {chart.centerText.label}
                    </tspan>
                  </text>
                )}
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={10}
                  className="mb-2"
                  formatter={(_, __, index) => {
                    const item = data?.[index];
                    return (
                      <span className="ml-0.5 mr-2 items-center inline-block">
                        <span className="mr-2 text-gray-900 dark:text-gray-100 font-light">
                          {item.name}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 font-bold">
                          {typeof item.value === "number" ? item.value.toFixed(0) : 0}%
                        </span>
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case "line":
        return (
          <ChartContainer className="h-full w-full" config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <LineChart data={data} margin={chartMargins.line}>
                {renderAxes("horizontal", data, {
                  showX: chart.showXAxis !== false,
                  showY: chart.showYAxis !== false,
                  axisProps: chart.axisProps,
                })}
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                />
                {chart.showLegend !== false && (
                  <Legend
                    verticalAlign={chart.legendPosition?.vertical || "bottom"}
                    align={chart.legendPosition?.horizontal || "center"}
                    iconType={chart.legendIconType || "circle"}
                    iconSize={10}
                    wrapperStyle={{ paddingTop: "8px" }}
                  />
                )}
                <ChartTooltip content={<ChartTooltipContent />} />
                {Object.keys(data?.[0] || {})
                  .slice(1)
                  .map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={getStatusColor(key, index, chart.colors?.[key])}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case "area":
        return (
          <ChartContainer className="h-full w-full" config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <AreaChart
                data={data}
                margin={chartMargins.area}
                stackOffset={chart.stackOffset}
              >
                {renderAxes("horizontal", data, {
                  showX: chart.showXAxis !== false,
                  showY: chart.showYAxis !== false,
                  axisProps: chart.axisProps,
                })}
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                  vertical={false}
                />

                <ChartTooltip content={<ChartTooltipContent />} />

                {chart.showLegend !== false && (
                  <Legend
                    verticalAlign={chart.legendPosition?.vertical || "bottom"}
                    align={chart.legendPosition?.horizontal || "center"}
                    iconType={chart.legendIconType || "circle"}
                    iconSize={10}
                    wrapperStyle={{ paddingTop: "8px" }}
                  />
                )}

                {Object.keys(data?.[0] || {})
                  .slice(1)
                  .map((key, index) => {
                    // Default stroke/fill sets
                    const defaultColors = [
                      { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.1)" }, // Blue
                      { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.1)" }, // Green
                      { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.1)" }, // Amber
                      { stroke: "#ef4444", fill: "rgba(239, 68, 68, 0.1)" }, // Red
                      { stroke: "#8b5cf6", fill: "rgba(139, 92, 246, 0.1)" }, // Purple
                      { stroke: "#06b6d4", fill: "rgba(6, 182, 212, 0.1)" }, // Cyan
                    ];

                    const colorIndex = index % defaultColors.length;

                    const stroke =
                      chart.colors?.[key] || defaultColors[colorIndex].stroke;

                    const fill =
                      chart.fillColors?.[key] || defaultColors[colorIndex].fill;

                    return (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={stroke}
                        strokeWidth={chart.strokeWidth || 2}
                        dot={{ r: chart.dotRadius || 0 }}
                        activeDot={{ r: chart.activeDotRadius || 6 }}
                        fill={fill}
                        fillOpacity={chart.fillOpacity || 0.5}
                      />
                    );
                  })}
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case "bar":
        return (
          <ChartContainer className="h-full w-full" config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout={layout}
                margin={chartMargins.bar(layout)}
                stackOffset={chart.stackOffset}
              >
                {renderAxes(layout, data, {
                  showX: chart.showXAxis !== false,
                  showY: chart.showYAxis !== false,
                  axisProps: chart.axisProps,
                })}
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                  vertical={layout === "horizontal"}
                  horizontal={layout !== "horizontal"}
                />
                {chart.showLegend !== false && (
                  <Legend
                    verticalAlign={chart.legendPosition?.vertical || "bottom"}
                    align={chart.legendPosition?.horizontal || "center"}
                    iconType={chart.legendIconType || "rect"}
                    iconSize={10}
                  />
                )}

                <ChartTooltip content={<ChartTooltipContent />} />

                {(() => {
                  // Helper function to determine data keys for bars
                  const getDataKeys = (data: any[]) => {
                    if (!data || data.length === 0) return [];

                    const firstItem = data[0];
                    const allKeys = Object.keys(firstItem);

                    // Check if this data was transformed from single key-value objects
                    // (it will have a 'name' property and multiple other keys)
                    const hasNameProperty = allKeys.includes("name");

                    if (hasNameProperty && allKeys.length > 1) {
                      // For consolidated single key-value data, exclude 'name' property
                      return allKeys.filter((key) => key !== "name");
                    } else {
                      // For multi-key data, assume first key is label, rest are data
                      return allKeys.slice(1);
                    }
                  };

                  const dataKeys = getDataKeys(data);

                  return dataKeys.map((key, index) => {
                    const color = getStatusColor(
                      key,
                      index,
                      chart.colors?.[key]
                    );

                    // Use custom rounded component for stacked charts
                    if (chart.stacked && layout === "horizontal") {
                      return (
                        <Bar
                          key={key}
                          dataKey={key}
                          className={chart.barClassName || "rounded-md"}
                          barSize={
                            chart.barSize || (layout === "horizontal" ? 20 : 30)
                          }
                          fill={color}
                          stackId="stack"
                          shape={(props: any) => {
                            const { isTop, isBottom } = getSegmentPosition(
                              dataKeys,
                              key,
                              data,
                              props.payload ? data.indexOf(props.payload) : 0
                            );
                            return (
                              <RoundedStackedBar
                                {...props}
                                isTopSegment={isTop}
                                isBottomSegment={isBottom}
                                cornerRadius={8}
                              />
                            );
                          }}
                        />
                      );
                    }

                    // Default bar rendering for non-stacked or vertical charts
                    return (
                      <Bar
                        key={key}
                        dataKey={key}
                        className={chart.barClassName || "rounded-md"}
                        barSize={
                          chart.barSize || (layout === "horizontal" ? 20 : 30)
                        }
                        fill={color}
                        stackId={chart.stacked ? "stack" : undefined}
                        radius={
                          (chart.barRadius as [
                            number,
                            number,
                            number,
                            number
                          ]) ||
                          (layout === "horizontal"
                            ? [0, 4, 4, 0]
                            : [4, 4, 0, 0])
                        }
                      />
                    );
                  });
                })()}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case "radar":
        return (
          <ChartContainer className="h-full w-full" config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
              <RadarChart data={data}>
                <PolarGrid className="stroke-gray-200 dark:stroke-gray-700" />
                <PolarAngleAxis
                  dataKey={(data && data[0] && Object.keys(data[0])[0]) || "label"}
                  tick={{ fill: "currentColor", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, Math.max(10, ...data.map((d: any) => d.value || 0))]}
                  tick={{ fill: "currentColor" }}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="rgba(59, 130, 246, 0.2)"
                  fillOpacity={0.6}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={10}
                />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <Card className={cn("transition-colors", chart.className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{chart.title}</CardTitle>
        {chart.filters && chart.filters.length > 0 && (
          <div className="flex space-x-2 text-sm overflow-auto py-2">
            {chart.filters?.map((item) => {
              const isActive =
                selected?.replace(/\s+/g, "") === item.replace(/\s+/g, "");
              return (
                <Button
                  variant={isActive ? "default" : "ghost"}
                  key={item}
                  className={cn("transition-all duration-200 font-medium")}
                  onClick={() => onFilterChange?.(item)}
                >
                  {item}
                </Button>
              );
            })}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {chart.id === "committed-vs-actual-spend" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
            <div className="h-[22rem] w-full">{renderChart()}</div>
            <div className="h-[22rem] w-full">
              <div className="space-y-3">
                {chart?.sidePanel?.items?.map((it, idx) => (
                  <div key={idx} className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-800">{it.label}</p>
                      {it.desc && (
                        <p className="text-xs text-gray-500">{it.desc}</p>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-lg font-semibold",
                        it.color || "text-[#2A4467]"
                      )}
                    >
                      {typeof it.value !== "undefined" ? it.value : "$0.0M"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : chart.id === "contract-value-by-project" ? (
          <div className="p-4 space-y-4">
            {(chartData && chartData.length ? chartData : [
              { name: "Project 1", value: 0 },
              { name: "Project 2", value: 0 },
              { name: "Project 3", value: 0 },
              { name: "Project 4", value: 0 },
            ]).map((row: any, idx: number) => {
              const pct = Math.min(100, Math.max(0, Number(row.value || 0)));
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">{row.name}</p>
                    <p className="text-sm font-semibold text-gray-700">
                      ${Number(row.value || 0).toLocaleString()}M
                    </p>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full">
                    <div
                      className="h-2.5 bg-green-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : chart.id === "avg-cycle-time" ? (
          <div className="p-4">
            <div className="h-[20rem] w-full">{renderChart()}</div>
            {chart.headerNote && (
              <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-3">
                <p className="text-xs text-yellow-800">{chart.headerNote}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[26rem] w-full">{renderChart()}</div>
        )}
      </CardContent>
    </Card>
  );
};
