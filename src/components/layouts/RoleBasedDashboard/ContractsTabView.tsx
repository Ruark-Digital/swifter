import React from "react";
import { cn } from "@/lib/utils";
import { CardStats } from "./components/StatsCard";
import { ActivityComponent } from "./components/ActivityCard";
import { ChartComponent } from "./components/ChartCard";
import { CycleTimeCard } from "./analytics/CycleTimeCard";
import { InvoiceStatusCard } from "./analytics/InvoiceStatusCard";
import { SpendCard } from "./analytics/SpendCard";
import { VendorsValueCard } from "./analytics/VendorsValueCard";
import { ProjectValueCard } from "./analytics/ProjectValueCard";
import { RiskDistributionCard } from "./analytics/RiskDistributionCard";
import { ChangeOrdersImpactCard } from "./analytics/ChangeOrdersImpactCard";
import { CategoryValueCard } from "./analytics/CategoryValueCard";
import { ComplianceStatusCard } from "./analytics/ComplianceStatusCard";
import { ClauseIntelligenceCard } from "./analytics/ClauseIntelligenceCard";
import { ContractStatusCard } from "./analytics/ContractStatusCard";
import { VendorPerformanceSummaryCard } from "./analytics/VendorPerformanceSummaryCard";
import { RenewalsTimelineCard } from "./analytics/RenewalsTimelineCard";
import { AiInsightsAlerts } from "./analytics/AiInsightsAlerts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ContractsTabViewProps {
  topTab: "overview" | "analytics";
  setTopTab: (v: "overview" | "analytics") => void;
  subTab: "total-contracts" | "ytd-contracts";
  setSubTab: (v: "total-contracts" | "ytd-contracts") => void;
  stats: any[];
  rows: any[];
  cmYtdStats: any[];
  cmCycleTimeValues: {
    draft: number;
    review: number;
    approval: number;
    execution: number;
  };
  chartFilters: Record<string, string>;
  contractManagerTotalCards: any;
  contractManagerYtdCards: any;
  contractManagerActionLogs: any;
  contractManagerGeneralUpdates: any;
  contractManagerCycleTime: any;
  contractManagerInvoiceStatus: any;
  contractManagerCommittedVsActualSpend: any;
  contractManagerVendorContractValue: any;
  contractManagerProjectContractValue: any;
  contractManagerRiskDistribution: any;
  contractManagerChangeOrderImpact: any;
  contractManagerCategoryValue: any;
  contractManagerComplianceStatus: any;
  contractManagerClauseIntelligence: any;
  contractManagerContractStatus: any;
  contractManagerVendorSummary: any;
  contractManagerRenewals: any;
  contractManagerAiInsights: any;
  isLoadingContractManagerAiInsights?: boolean;
  canShowMyActions: boolean;
  canShowGeneralUpdates: boolean;
  onFilterChange: (chartId?: string, filter?: string) => void;
  getChartFilter: (chartId?: string) => string;
  getChartData: ((id: string) => any) | undefined;
  onStatCardClick: (title: string) => void;
}

export const ContractsTabView: React.FC<ContractsTabViewProps> = ({
  topTab,
  setTopTab,
  subTab,
  setSubTab,
  stats,
  rows,
  cmYtdStats,
  cmCycleTimeValues,
  chartFilters,
  contractManagerTotalCards,
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
  canShowMyActions,
  canShowGeneralUpdates,
  onFilterChange,
  getChartFilter,
  getChartData,
  onStatCardClick,
}) => {
  const showOverviewTotalContracts =
    topTab === "overview" && subTab === "total-contracts";
  const showOverviewYtdContracts =
    topTab === "overview" && subTab === "ytd-contracts";
  const showAnalytics = topTab === "analytics";

  return (
    <div className="space-y-4">
      <Tabs
        value={topTab}
        onValueChange={(v) =>
          setTopTab((v as "overview" | "analytics") ?? "overview")
        }
        className="w-full"
      >
        <TabsList className="bg-slate-100 rounded-full p-1.5 gap-3 mb-3 h-12">
          <TabsTrigger
            value="overview"
            className={cn(
              "rounded-full px-4 py-2 text-sm",
              "data-[state=active]:bg-[#2A4467] data-[state=active]:text-white",
              "text-gray-600"
            )}
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className={cn(
              "rounded-full px-4 py-2 text-sm",
              "text-gray-600",
              "data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
            )}
          >
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Tabs
            value={subTab}
            onValueChange={(v) =>
              setSubTab(
                (v as "total-contracts" | "ytd-contracts") ??
                  "total-contracts"
              )
            }
            className="w-full"
          >
            <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 w-full justify-start bg-transparent">
              <TabsTrigger
                value="total-contracts"
                className={cn(
                  "data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3",
                )}
              >
                Total Contracts
              </TabsTrigger>
              <TabsTrigger
                value="ytd-contracts"
                className={cn(
                  "data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3",
                )}
              >
                YTD Contracts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="total-contracts" />

            <TabsContent value="ytd-contracts">

            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="analytics">

        </TabsContent>
      </Tabs>

      {/* Stats Cards */}
      {showOverviewTotalContracts && (
        <div
          className={cn(`grid grid-cols-1 md:grid-cols-2 gap-6`, {
            "lg:grid-cols-2": stats.length === 8,
            "lg:grid-cols-3": stats.length === 6,
            "lg:grid-cols-4": stats.length === 4 || stats.length > 8,
          })}
        >
          {stats?.map?.((stat, index) => (
            <CardStats
              key={`${stat.title}-${index}`}
              {...stat}
              onClick={() => onStatCardClick(stat.title)}
            />
          ))}
        </div>
      )}

      {showOverviewYtdContracts && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cmYtdStats.map((stat, index) => (
            <CardStats
              key={`cm-ytd-${index}`}
              {...stat}
              onClick={() => onStatCardClick(stat.title)}
            />
          ))}
        </div>
      )}

      {showAnalytics && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CycleTimeCard
              values={cmCycleTimeValues}
              bottleneck={contractManagerCycleTime?.bottleneck}
              selectedRange={chartFilters["cycle-time"] ?? "ytd"}
              onRangeChange={(value) => onFilterChange("cycle-time", value)}
            />
            <InvoiceStatusCard
              approved={contractManagerInvoiceStatus?.approved}
              pending={contractManagerInvoiceStatus?.pending}
              rejected={contractManagerInvoiceStatus?.rejected}
              selectedRange={chartFilters["invoice-status"] ?? "ytd"}
              onRangeChange={(value) =>
                onFilterChange("invoice-status", value)
              }
            />
            <SpendCard
              committed={contractManagerCommittedVsActualSpend?.committed}
              actual={contractManagerCommittedVsActualSpend?.actual}
              currency={contractManagerTotalCards?.totalContractValue?.currency}
              selectedRange={chartFilters["committed-vs-actual"] ?? "ytd"}
              onRangeChange={(value) =>
                onFilterChange("committed-vs-actual", value)
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VendorsValueCard
              rows={contractManagerVendorContractValue}
              selectedRange={chartFilters["vendor-contract-value"] ?? "ytd"}
              onRangeChange={(value) =>
                onFilterChange("vendor-contract-value", value)
              }
            />
            <ProjectValueCard
              rows={contractManagerProjectContractValue}
              selectedRange={chartFilters["project-contract-value"] ?? "ytd"}
              onRangeChange={(value) =>
                onFilterChange("project-contract-value", value)
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RiskDistributionCard
              values={contractManagerRiskDistribution}
              selectedRange={chartFilters["risk-distribution"] ?? "ytd"}
              onRangeChange={(value) =>
                onFilterChange("risk-distribution", value)
              }
            />
            <ChangeOrdersImpactCard
              data={contractManagerChangeOrderImpact}
              selectedRange={chartFilters["change-order-impact"] ?? "ytd"}
              onRangeChange={(value) =>
                onFilterChange("change-order-impact", value)
              }
            />
            <CategoryValueCard
              rows={contractManagerCategoryValue}
              selectedRange={chartFilters["category-value"] ?? "ytd"}
              onRangeChange={(value) => onFilterChange("category-value", value)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ComplianceStatusCard
              data={contractManagerComplianceStatus}
              selectedRange={chartFilters["compliance-status"] ?? "ytd"}
              onRangeChange={(value) =>
                onFilterChange("compliance-status", value)
              }
            />
            <ClauseIntelligenceCard
              data={contractManagerClauseIntelligence}
              selectedRange={chartFilters["clause-intelligence"] ?? "ytd"}
              onRangeChange={(value) =>
                onFilterChange("clause-intelligence", value)
              }
            />
            <ContractStatusCard
              data={contractManagerContractStatus}
              selectedRange={chartFilters["contract-status"] ?? "ytd"}
              onRangeChange={(value) => onFilterChange("contract-status", value)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VendorPerformanceSummaryCard
              data={contractManagerVendorSummary}
              selectedRange={chartFilters["vendor-summary"] ?? "ytd"}
              onRangeChange={(value) => onFilterChange("vendor-summary", value)}
            />
            <RenewalsTimelineCard data={contractManagerRenewals} />
          </div>
          <AiInsightsAlerts
            data={contractManagerAiInsights}
            isLoading={isLoadingContractManagerAiInsights}
          />
        </>
      )}

      {/* Activities and Charts Section */}
      {rows?.map?.((item, rowIndex) => {
        if (showAnalytics) {
          return null;
        }
        if (item.type === "activity") {
          const gatedActivities = item.properties.filter((activity: any) => {
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
              {gatedActivities.map((activity: any, index: number) => (
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
              {item.properties?.map?.((chart: any) => (
                <ChartComponent
                  key={chart.id}
                  chart={chart}
                  selected={getChartFilter(chart.id)}
                  onFilterChange={(filter) =>
                    onFilterChange(chart.id, filter)
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
                ?.filter?.((component: any) => {
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
                ?.map?.((component: any, index: number) => {
                  if (component.items) {
                    return (
                      <ActivityComponent
                        key={`activity-${index}`}
                        activity={component}
                      />
                    );
                  } else {
                    return (
                      <ChartComponent
                        key={`chart-${component.id || index}`}
                        chart={component}
                        selected={getChartFilter(
                          component.id || `chart-${index}`
                        )}
                        onFilterChange={(filter) =>
                          onFilterChange(
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
