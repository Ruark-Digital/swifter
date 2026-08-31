import React from "react";
import { useQuery } from "@tanstack/react-query";
import { TabsContent } from "@/components/ui/tabs";
import { getRequest } from "@/lib/axiosInstance";
import AnalyticsTab from "@/pages/ContractManagementPage/components/AnalyticsTab";
import { useUserRole } from "@/hooks/useUserRole";

type Props = { contractId: string; isActive?: boolean };

const DEFAULT_CONTRACT_TYPE = "MsaContract" as const;
type AnalyticsRange = "YTD" | 90 | 60 | 7;

const Analytics: React.FC<Props> = ({ contractId, isActive = false }) => {
  const { isApprover } = useUserRole();
  const roleSegment = isApprover ? "approver" : "manager";
  const roleNs = `msa-contract-${roleSegment}`;
  const baseUrl = `/contract/${roleSegment}/msa-contracts`;
  const [activitiesRange, setActivitiesRange] =
    React.useState<AnalyticsRange>("YTD");
  const [deliverySummaryRange, setDeliverySummaryRange] =
    React.useState<AnalyticsRange>("YTD");

  const enabled = Boolean(contractId) && Boolean(isActive);

  const contractQuery = useQuery({
    queryKey: [roleNs, "contract", contractId],
    queryFn: async () => {
      const res = await getRequest({ url: `${baseUrl}/${contractId}` });
      return res.data?.data;
    },
    enabled,
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
    enabled,
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
    enabled,
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
    enabled,
    staleTime: 60000,
    retry: false,
  });

  const activitiesQuery = useQuery({
    queryKey: [`${roleNs}-dashboard`, "activities", contractId, activitiesRange],
    queryFn: async () => {
      const res = await getRequest({
        url: `${baseUrl}/${contractId}/dashboard/activities`,
        config: {
          params: { range: activitiesRange, type: DEFAULT_CONTRACT_TYPE },
        },
      });
      return res.data?.data;
    },
    enabled,
    staleTime: 60000,
    retry: false,
  });

  // MSA endpoint is /deliverable-summary (singular noun, unlike Contract which
  // uses /delivery-summary). Spec source: docs.json 2.3.0.
  const deliverySummaryQuery = useQuery({
    queryKey: [
      `${roleNs}-dashboard`,
      "deliverable-summary",
      contractId,
      deliverySummaryRange,
    ],
    queryFn: async () => {
      const res = await getRequest({
        url: `${baseUrl}/${contractId}/dashboard/deliverable-summary`,
        config: {
          params: { range: deliverySummaryRange, type: DEFAULT_CONTRACT_TYPE },
        },
      });
      return res.data?.data;
    },
    enabled,
    staleTime: 60000,
    retry: false,
  });

  // MSA endpoint is /attachments (plural, unlike Contract's /attachment).
  const attachmentsQuery = useQuery({
    queryKey: [`${roleNs}-dashboard`, "attachments", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `${baseUrl}/${contractId}/dashboard/attachments`,
        config: { params: { type: DEFAULT_CONTRACT_TYPE } },
      });
      return res.data?.data;
    },
    enabled,
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
    enabled,
    staleTime: 60000,
    retry: false,
  });

  const clauseLegalAnalysisQuery = useQuery({
    queryKey: [`${roleNs}-dashboard`, "clause-legal-analysis", contractId],
    queryFn: async () => {
      const res = await getRequest({
        url: `${baseUrl}/${contractId}/dashboard/clause-legal-analysis`,
        config: { params: { type: DEFAULT_CONTRACT_TYPE } },
      });
      return res.data?.data;
    },
    enabled,
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

export default Analytics;
