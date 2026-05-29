 
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
// import { HugeiconsIcon } from '@hugeicons/react'
// import { FolderLibraryIcon } from '@hugeicons/core-free-icons'
import SwiftProLogo from "../assets/image9.png";
import SwiftProWhiteLogo from "../assets/swiftpro-white.svg";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useUser } from "@/store/authSlice";
import { getNavigationForRole } from "@/lib/navigation";

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
                                    : "border-l-2 border-[#2A4467] dark:border-blue-400 text-[#0B003A] dark:text-blue-400 font-medium"
                                  : userRole === "super_admin"
                                  ? "text-white/80 hover:text-white"
                                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
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
