import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TabsContent } from "@/components/ui/tabs";
import AnalyticsTab from "../components/AnalyticsTab";
import { getRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";

type Props = { isActive?: boolean; currency?: string };

const DEFAULT_CONTRACT_TYPE = "Contract" as const;
type AnalyticsRange = "YTD" | 90 | 60 | 7;

const AnalyticsTabContent: React.FC<Props> = ({ isActive = false }) => {
  const { id: contractId } = useParams<{ id: string }>();
  const { isManager, isApprover } = useUserRole();
  const roleSegment = isApprover ? "approver" : isManager ? "manager" : "manager";
  const roleNs = `contract-${roleSegment}` as const;
  const baseUrl = `/contract/${roleSegment}/contracts`;
  const [activitiesRange, setActivitiesRange] =
    React.useState<AnalyticsRange>("YTD");
  const [deliverySummaryRange, setDeliverySummaryRange] =
    React.useState<AnalyticsRange>("YTD");

  const contractQuery = useQuery({
    queryKey: [roleNs, "contract", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `${baseUrl}/${contractId}`,
      });
      return res.data?.data;
    },
    enabled: !!contractId && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const overviewQuery = useQuery({
    queryKey: [`${roleNs}-dashboard`, "overview", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `${baseUrl}/${contractId}/dashboard/overview`,
        config: { params: { type: DEFAULT_CONTRACT_TYPE } },
      });
      return res.data?.data;
    },
    enabled: !!contractId && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const financialStatementQuery = useQuery({
    queryKey: [`${roleNs}-dashboard`, "financial-statement", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `${baseUrl}/${contractId}/dashboard/financial-statement`,
        config: { params: { type: DEFAULT_CONTRACT_TYPE } },
      });
      return res.data?.data;
    },
    enabled: !!contractId && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const deliverableStatusQuery = useQuery({
    queryKey: [`${roleNs}-dashboard`, "deliverable-status", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `${baseUrl}/${contractId}/dashboard/deliverable-status`,
        config: { params: { type: DEFAULT_CONTRACT_TYPE } },
      });
      return res.data?.data;
    },
    enabled: !!contractId && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const activitiesQuery = useQuery({
    queryKey: [`${roleNs}-dashboard`, "activities", contractId, activitiesRange],
    queryFn: async () => {
      const res = await getRequest({
        url: `${baseUrl}/${contractId}/dashboard/activities`,
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
      `${roleNs}-dashboard`,
      "delivery-summary",
      contractId,
      deliverySummaryRange,
    ],
    queryFn: async () => {
      const res = await getRequest({
        url: `${baseUrl}/${contractId}/dashboard/delivery-summary`,
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
    queryKey: [`${roleNs}-dashboard`, "attachment", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `${baseUrl}/${contractId}/dashboard/attachment`,
        config: { params: { type: DEFAULT_CONTRACT_TYPE } },
      });
      return res.data?.data;
    },
    enabled: !!contractId && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const alertsQuery = useQuery({
    queryKey: [`${roleNs}-dashboard`, "alerts", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `${baseUrl}/${contractId}/dashboard/alerts`,
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
      `${roleNs}-dashboard`,
      "clause-legal-analysis",
      contractId,
    ],
    queryFn: async () => {
      const res = await getRequest({
        url: `${baseUrl}/${contractId}/dashboard/clause-legal-analysis`,
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
        alerts={alertsQuery.data}
        clauseLegalAnalysis={clauseLegalAnalysisQuery.data}
      />
    </TabsContent>
  );
};

export default AnalyticsTabContent;
