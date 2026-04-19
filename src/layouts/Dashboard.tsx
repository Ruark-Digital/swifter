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
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (userRole !== "project_manager") return;
    const path = location.pathname;
    const isAllowed =
      path === "/dashboard" ||
      path === "/dashboard/profile" ||
      path.startsWith("/dashboard/contract-management") ||
      path.startsWith("/dashboard/msa");

    if (!isAllowed) {
      navigate("/dashboard/contract-management", { replace: true });
      return;
    }

    if (path === "/dashboard") {
      navigate("/dashboard/contract-management", { replace: true });
    }
  }, [userRole, location.pathname, navigate]);

  return (
    <Container
      noGutter
      fullWidth
      fullHeight
      display="flex"
      className="overflow-x-hidden overflow-y-hidden bg-[#F7F9FE] dark:bg-gray-950 relative transition-colors"
      as={SidebarProvider}
    >
      <SideBar />
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900">
        <Header />
        <ScrollArea>
          <div className="flex-1 overflow-auto h-[calc(100vh-160px)] flex flex-col bg-white dark:bg-gray-900 px-8 transition-colors">
            <Outlet />
          </div>
        </ScrollArea>
        <Footer />
      </main>
    </Container>
  );
};
