/* eslint-disable @typescript-eslint/no-explicit-any */
import { MdDashboard } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  User2,
  FileText,
  Users,
  ClipboardList,
  Building2,
  UserCheck,
  Settings,
  BarChart3,
  Mail,
  Folder,
} from "lucide-react";
// import { HugeiconsIcon } from '@hugeicons/react'
// import { FolderLibraryIcon } from '@hugeicons/core-free-icons'
import SwiftProLogo from "../assets/image9.png";
import SwiftProWhiteLogo from "../assets/swiftpro-white.svg";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useUser } from "@/store/authSlice";
import { UserRole, Modules } from "@/types";

type NavigationItem = {
  icon: any;
  title: string;
  to: string;
  active: boolean;
  isImage?: boolean;
  children?: { title: string; to: string; active: boolean }[];
};

const getNavigationForRole = (
  role: UserRole,
  currentPath: string,
  modules?: Modules
): NavigationItem[] => {
  const baseNavigation: (NavigationItem | undefined)[] = [
    modules?.reportsAnalytics
      ? {
          icon: MdDashboard,
          title: "Dashboard",
          to: "/dashboard",
          active: currentPath === "/dashboard",
        }
      : undefined,
  ];

  const roleSpecificNavigation: Record<
    UserRole,
    (NavigationItem | undefined)[]
  > = {
    procurement: [
      modules?.solicitationManagement
        ? {
            icon: FileText,
            title: "Solicitation Management",
            to: "/dashboard/solicitation",
            active: currentPath.startsWith("/dashboard/solicitation"),
          }
        : undefined,
      modules?.evaluationsManagement
        ? {
            icon: ClipboardList,
            title: "Evaluation Management",
            to: "/dashboard/evaluation",
            active: currentPath.startsWith("/dashboard/evaluation"),
          }
        : undefined,
      modules?.contractManagement
        ? {
            icon: Folder,
            title: "Projects",
            to: "/dashboard/project-management",
            active: currentPath.startsWith("/dashboard/project-management"),
          }
        : undefined,
      modules?.contractManagement
        ? {
            icon: FileText,
            title: "Contract Management",
            to: "/dashboard/contract-management",
            active:
              currentPath.startsWith("/dashboard/contract-management") ||
              currentPath.startsWith("/dashboard/msa"),
            children: [
              {
                title: "Contracts",
                to: "/dashboard/contract-management",
                active: currentPath.startsWith(
                  "/dashboard/contract-management"
                ),
              },
              {
                title: "Master Service Agreements (MSA)",
                to: "/dashboard/msa",
                active: currentPath.startsWith("/dashboard/msa"),
              },
            ],
          }
        : undefined,
      modules?.vendorManagement
        ? {
            icon: Users,
            title: "Vendor Management",
            to: "/dashboard/vendor",
            active: currentPath.startsWith("/dashboard/vendor"),
          }
        : undefined,
      {
        icon: User2,
        title: "Profile",
        to: "/dashboard/profile",
        active: currentPath.startsWith("/dashboard/profile"),
      },
    ],
    contract_manager: [
      modules?.contractManagement
        ? {
            icon: Folder,
            title: "Projects",
            to: "/dashboard/project-management",
            active: currentPath.startsWith("/dashboard/project-management"),
          }
        : undefined,
      modules?.contractManagement
        ? {
            icon: FileText,
            title: "Contract Management",
            to: "/dashboard/contract-management",
            active:
              currentPath.startsWith("/dashboard/contract-management") ||
              currentPath.startsWith("/dashboard/msa"),
            children: [
              {
                title: "Contracts",
                to: "/dashboard/contract-management",
                active: currentPath.startsWith(
                  "/dashboard/contract-management"
                ),
              },
              {
                title: "Master Service Agreements (MSA)",
                to: "/dashboard/msa",
                active: currentPath.startsWith("/dashboard/msa"),
              },
            ],
          }
        : undefined,
      modules?.vendorManagement
        ? {
            icon: Users,
            title: "Vendor Management",
            to: "/dashboard/vendor",
            active: currentPath.startsWith("/dashboard/vendor"),
          }
        : undefined,
      {
        icon: User2,
        title: "Profile",
        to: "/dashboard/profile",
        active: currentPath.startsWith("/dashboard/profile"),
      },
    ],
    evaluator: [
      modules?.evaluationsManagement
        ? {
            icon: ClipboardList,
            title: "My Evaluation",
            to: "/dashboard/evaluation",
            active: currentPath.startsWith("/dashboard/evaluation"),
          }
        : undefined,
      {
        icon: User2,
        title: "Profile",
        to: "/dashboard/profile",
        active: currentPath.startsWith("/dashboard/profile"),
      },
    ],
    vendor: [
      {
        icon: Mail,
        title: "Invitations",
        to: "/dashboard/invitations",
        active: currentPath.startsWith("/dashboard/invitations"),
      },
      modules?.solicitationManagement
        ? {
            icon: FileText,
            title: "Solicitation Management",
            to: "/dashboard/solicitation",
            active: currentPath.startsWith("/dashboard/solicitation"),
          }
        : undefined,
      {
        icon: User2,
        title: "Profile",
        to: "/dashboard/profile",
        active: currentPath.startsWith("/dashboard/profile"),
      },
    ],
    company_admin: [
      modules?.solicitationManagement
        ? {
            icon: FileText,
            title: "Solicitation Management",
            to: "/dashboard/solicitation",
            active: currentPath.startsWith("/dashboard/solicitation"),
          }
        : undefined,
      {
        icon: Building2,
        title: "Business Divisions",
        to: "/dashboard/business-divisions",
        active: currentPath.startsWith("/dashboard/business-divisions"),
      },
      {
        icon: User2,
        title: "User Management",
        to: "/dashboard/user-management",
        active: currentPath.startsWith("/dashboard/user-management"),
      },
      modules?.vendorManagement
        ? {
            icon: Users,
            title: "Vendor Management",
            to: "/dashboard/vendor",
            active: currentPath.startsWith("/dashboard/vendor"),
          }
        : undefined,
      modules?.evaluationsManagement
        ? {
            icon: ClipboardList,
            title: "Evaluation",
            to: "/dashboard/evaluation",
            active: currentPath.startsWith("/dashboard/evaluation"),
          }
        : undefined,
      {
        icon: User2,
        title: "Profile",
        to: "/dashboard/profile",
        active: currentPath.startsWith("/dashboard/profile"),
      },
    ],
    super_admin: [
      {
        icon: Building2,
        title: "Companies",
        to: "/dashboard/companies",
        active: currentPath.startsWith("/dashboard/companies"),
      },
      // {
      //   icon: Users, // Reusing the Users icon, as it's appropriate for User Management
      //   title: "User Management",
      //   to: "/dashboard/user-management", // Assuming this is the correct route
      //   active: currentPath.startsWith("/dashboard/user-management"),
      // },
      {
        icon: BarChart3,
        title: "Subscription",
        to: "/dashboard/subscription",
        active: currentPath.startsWith("/dashboard/subscription"),
      },
      {
        icon: UserCheck,
        title: "Admin Management",
        to: "/dashboard/admin-management",
        active: currentPath.startsWith("/dashboard/admin-management"),
      },
      {
        icon: Mail,
        title: "Communication Management",
        to: "/dashboard/communication-management",
        active: currentPath.startsWith("/dashboard/communication-management"),
      },
      {
        icon: BarChart3,
        title: "System Log",
        to: "/dashboard/system-log",
        active: currentPath.startsWith("/dashboard/system-log"),
      },
      {
        icon: Settings,
        title: "Portal Settings",
        to: "/dashboard/portal-settings",
        active: currentPath.startsWith("/dashboard/portal-settings"),
      },
      {
        icon: User2,
        title: "Profile",
        to: "/dashboard/profile",
        active: currentPath.startsWith("/dashboard/profile"),
      },
    ],
  };

  const filtered = (roleSpecificNavigation[role] || []).filter(
    Boolean
  ) as NavigationItem[];
  const base = baseNavigation.filter(Boolean) as NavigationItem[];
  return [...base, ...filtered];
};

export const SideBar = () => {
  const location = useLocation();
  const { userRole } = useUserRole();
  const user = useUser();
  const modules = user?.module;

  const navigation = getNavigationForRole(userRole, location.pathname, modules);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-blue-700 focus:px-3 focus:py-2 focus:rounded shadow"
      >
        Skip to main content
      </a>
      <Sidebar
        collapsible="none"
        className={cn(
          "border-r border-gray-200 dark:border-gray-700 transition-colors",
          userRole === "super_admin"
            ? "bg-[#2A4467]"
            : "bg-white dark:bg-gray-900"
        )}
      >
        <SidebarHeader className="p-6 ">
          <div className="flex items-center gap-3">
            <img
              src={
                userRole === "super_admin" ? SwiftProWhiteLogo : SwiftProLogo
              }
              alt="SwiftPro"
              className="h-8 w-auto"
            />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.active}
                      className={cn(
                        "w-full justify-start px-3 py-5 text-sm font-medium transition-colors rounded-none",
                        userRole === "super_admin"
                          ? item.active
                            ? "bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl"
                            : "text-white/80 hover:text-white hover:bg-white/5 "
                          : item.active
                          ? "bg-[#2A44671A] dark:bg-blue-900/20 text-[#2A4467] dark:text-blue-400 border-l-2 border-[#2A4467] dark:border-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                      )}
                    >
                      <Link to={item.to} className="flex items-center gap-3">
                        <item.icon
                          className={cn(
                            "h-5 w-5",
                            userRole === "super_admin"
                              ? "text-white"
                              : item.active
                              ? "text-[#2A4467] dark:text-blue-400"
                              : "text-gray-500 dark:text-gray-400"
                          )}
                        />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                    {item.children && item.children.length > 0 && (
                      <div className="mt-1 ml-4">
                        <div className="flex flex-col">
                          {item.children.map((child) => (
                            <Link
                              key={child.title}
                              to={child.to}
                              className={cn(
                                "px-4 py-2 text-sm",
                                child.active
                                  ? userRole === "super_admin"
                                    ? "border-l-2 border-white/40 text-white"
                                    : "border-l-2 border-[#2A4467] text-[#0B003A]"
                                  : userRole === "super_admin"
                                  ? "text-white/80 hover:text-white"
                                  : "text-gray-600 hover:text-gray-900"
                              )}
                            >
                              {child.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3 mt-auto">
          <div className="flex items-center justify-center">
            <span
              className={cn(
                "text-xs font-medium",
                userRole === "super_admin"
                  ? "text-white"
                  : "text-gray-700 dark:text-gray-300"
              )}
            >
              Version 1.0.3
            </span>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  );
};
