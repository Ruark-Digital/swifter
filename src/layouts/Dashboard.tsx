import Container from "@/components/layouts/Container";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SideBar } from "./Sidebar";
import { Header } from "./Header";
import Footer from "@/components/layouts/Footer";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect } from "react";

export const Dashboard = () => {
  // Enable inactivity logout for authenticated users in dashboard
  useInactivityLogout();
  const { userRole } = useUserRole();
  // Renamed from `location` so it doesn't shadow `window.location`, which
  // trips react-doctor/no-mutable-in-deps' name-based detection.
  const routerLocation = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = routerLocation.pathname;

    if (
      userRole === "procurement" &&
      (path.startsWith("/dashboard/contract-management") ||
        path.startsWith("/dashboard/msa"))
    ) {
      navigate("/dashboard/solicitation", { replace: true });
      return;
    }

    if (userRole !== "project_manager") return;
    const isAllowed =
      path === "/dashboard" ||
      path === "/dashboard/profile" ||
      path.startsWith("/dashboard/contract-management") ||
      path.startsWith("/dashboard/msa");

    if (!isAllowed) {
      navigate("/dashboard/contract-management", { replace: true });
    }
    // `/dashboard` itself is allowed: the PM now sees the (vendor-mirrored)
    // dashboard there instead of being bounced to contract-management.
  }, [userRole, routerLocation.pathname, navigate]);

  return (
    <Container
      noGutter
      fullWidth
      fullHeight
      display="flex"
      className="overflow-hidden bg-[#F7F9FE] dark:bg-gray-950 relative transition-colors"
      as={SidebarProvider}
    >
      <SideBar />
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden bg-white dark:bg-gray-900">
        <Header />
        <ScrollArea>
          <div className="flex-1 overflow-auto h-[calc(100vh-160px)] flex flex-col min-w-0 bg-white dark:bg-gray-900 px-4 sm:px-8 transition-colors">
            <Outlet />
          </div>
        </ScrollArea>
        <Footer />
      </main>
    </Container>
  );
};
