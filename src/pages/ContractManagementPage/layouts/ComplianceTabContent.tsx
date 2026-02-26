import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import ComplianceSecurityTab from "../components/ComplianceSecurityTab";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { contractManagerApi } from "../api/contractManagerApi";
import { SEOWrapper } from "@/components/SEO";

type Props = { isActive?: boolean };

const ComplianceTabContent: React.FC<Props> = ({ isActive }) => {
  const { id: contractId } = useParams<{ id: string }>();

  const { data: complianceData, isLoading } = useQuery({
    queryKey: ["contract-compliance", contractId],
    queryFn: () => contractManagerApi.getContractCompliance(contractId!),
    enabled: !!contractId && !!isActive,
  });

  return (
    <TabsContent value="compliance" className="space-y-6">
      <SEOWrapper
        title="Compliance & Security - Contract Details - SwiftPro"
        description="Manage contract compliance, insurance coverage, and security requirements."
        robots="noindex, nofollow"
      />
      <ComplianceSecurityTab 
        isLoading={isLoading}
        data={complianceData?.data}
      />
    </TabsContent>
  );
};

export default ComplianceTabContent;
