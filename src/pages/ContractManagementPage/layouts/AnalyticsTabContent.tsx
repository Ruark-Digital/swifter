import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TabsContent } from "@/components/ui/tabs";
import AnalyticsTab from "../components/AnalyticsTab";
import { getRequest } from "@/lib/axiosInstance";

type Props = { isActive?: boolean };

const DEFAULT_CONTRACT_TYPE = "Contract" as const;
type AnalyticsRange = "YTD" | 90 | 60 | 7;

const AnalyticsTabContent: React.FC<Props> = ({ isActive = false }) => {
  const { id: contractId } = useParams<{ id: string }>();
  const [activitiesRange, setActivitiesRange] =
    React.useState<AnalyticsRange>("YTD");
  const [deliverySummaryRange, setDeliverySummaryRange] =
    React.useState<AnalyticsRange>("YTD");

  const contractQuery = useQuery({
    queryKey: ["contract-manager", "contract", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/contracts/${contractId}`,
      });
      return res.data?.data;
    },
    enabled: !!contractId && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const overviewQuery = useQuery({
    queryKey: ["contract-manager-dashboard", "overview", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/contracts/${contractId}/dashboard/overview`,
        config: { params: { type: DEFAULT_CONTRACT_TYPE } },
      });
      return res.data?.data;
    },
    enabled: !!contractId && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const financialStatementQuery = useQuery({
    queryKey: ["contract-manager-dashboard", "financial-statement", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/contracts/${contractId}/dashboard/financial-statement`,
        config: { params: { type: DEFAULT_CONTRACT_TYPE } },
      });
      return res.data?.data;
    },
    enabled: !!contractId && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const deliverableStatusQuery = useQuery({
    queryKey: ["contract-manager-dashboard", "deliverable-status", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/contracts/${contractId}/dashboard/deliverable-status`,
        config: { params: { type: DEFAULT_CONTRACT_TYPE } },
      });
      return res.data?.data;
    },
    enabled: !!contractId && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const activitiesQuery = useQuery({
    queryKey: ["contract-manager-dashboard", "activities", contractId, activitiesRange],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/contracts/${contractId}/dashboard/activities`,
        config: { params: { range: activitiesRange, type: DEFAULT_CONTRACT_TYPE } },
      });
      return res.data?.data;
    },
    enabled: !!contractId && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const deliverySummaryQuery = useQuery({
    queryKey: [
      "contract-manager-dashboard",
      "delivery-summary",
      contractId,
      deliverySummaryRange,
    ],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/contracts/${contractId}/dashboard/delivery-summary`,
        config: {
          params: { range: deliverySummaryRange, type: DEFAULT_CONTRACT_TYPE },
        },
      });
      return res.data?.data;
    },
    enabled: !!contractId && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const attachmentsQuery = useQuery({
    queryKey: ["contract-manager-dashboard", "attachment", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/contracts/${contractId}/dashboard/attachment`,
        config: { params: { type: DEFAULT_CONTRACT_TYPE } },
      });
      return res.data?.data;
    },
    enabled: !!contractId && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const vendorKpiQuery = useQuery({
    queryKey: ["contract-manager-dashboard", "vendor-kpi", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/contracts/${contractId}/dashboard/vendor-kpi`,
        config: { params: { type: DEFAULT_CONTRACT_TYPE } },
      });
      return res.data?.data;
    },
    enabled: !!contractId && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const alertsQuery = useQuery({
    queryKey: ["contract-manager-dashboard", "alerts", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/contracts/${contractId}/dashboard/alerts`,
        config: { params: { type: DEFAULT_CONTRACT_TYPE } },
      });
      return res.data?.data;
    },
    enabled: !!contractId && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const clauseLegalAnalysisQuery = useQuery({
    queryKey: [
      "contract-manager-dashboard",
      "clause-legal-analysis",
      contractId,
    ],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/contracts/${contractId}/dashboard/clause-legal-analysis`,
        config: { params: { type: DEFAULT_CONTRACT_TYPE } },
      });
      return res.data?.data;
    },
    enabled: !!contractId && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  return (
    <TabsContent value="analytics" className="space-y-6">
      <AnalyticsTab
        contract={contractQuery.data}
        overview={overviewQuery.data}
        financialStatement={financialStatementQuery.data}
        deliverableStatus={deliverableStatusQuery.data}
        activities={activitiesQuery.data}
        activitiesRange={activitiesRange}
        onActivitiesRangeChange={setActivitiesRange}
        deliverySummary={deliverySummaryQuery.data}
        deliverySummaryRange={deliverySummaryRange}
        onDeliverySummaryRangeChange={setDeliverySummaryRange}
        attachments={attachmentsQuery.data}
        vendorKpi={vendorKpiQuery.data}
        alerts={alertsQuery.data}
        clauseLegalAnalysis={clauseLegalAnalysisQuery.data}
      />
    </TabsContent>
  );
};

export default AnalyticsTabContent;
