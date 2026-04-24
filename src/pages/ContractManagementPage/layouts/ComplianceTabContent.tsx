import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import ComplianceSecurityTab from "../components/ComplianceSecurityTab";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import { SEOWrapper } from "@/components/SEO";

type Props = { isActive?: boolean; currency?: string };

const ComplianceTabContent: React.FC<Props> = ({ isActive }) => {
  const { id: contractId } = useParams<{ id: string }>();
  const { isVendor, isProjectManager, isManager, isAdmin, isApprover, isViewOnly } =
    useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;

  const getBasePath = () => {
    if (isContractVendorLike) return `/contract/vendor/contracts/${contractId}/compliance`;
    if (isApprover) return `/contract/approver/contracts/${contractId}/compliance`;
    if (isManager) return `/contract/manager/contracts/${contractId}/compliance`;
    if (isAdmin || isViewOnly) return `/contract/user/contracts/${contractId}/compliance`;
    return `/contract/user/contracts/${contractId}/compliance`;
  };

  const basePath = getBasePath();

  const { data: complianceData, isLoading } = useQuery({
    queryKey: ["contract-compliance", contractId, basePath],
    queryFn: async () => {
      const res = await getRequest({
        url: basePath,
      });
      return res.data;
    },
    enabled: !!contractId && !!isActive,
  });

  if (isApprover || isViewOnly) return null;

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
        basePath={basePath}
      />
    </TabsContent>
  );
};

export default ComplianceTabContent;
