import { RoleBasedDashboard } from "@/components/layouts/RoleBasedDashboard";
import { SEOWrapper } from "@/components/SEO";

export const DashboardPage = () => {
  return (
    <>
      <SEOWrapper
        title="Dashboard - SwiftPro eProcurement Portal"
        description="Access your SwiftPro eProcurement dashboard. Manage solicitations, vendors, evaluations, and track procurement activities in real-time."
        keywords="dashboard, SwiftPro, eProcurement, procurement management, solicitations, vendors, evaluations, analytics"
        canonical="/dashboard"
        robots="noindex, nofollow"
      />
      <RoleBasedDashboard />
    </>
  );
};

export default DashboardPage;
