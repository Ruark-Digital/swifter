 
import { MdDashboard } from "react-icons/md";
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
import { UserRole, Modules } from "@/types";
import { isModuleEnabled } from "@/lib/moduleFlags";

export type NavigationItem = {
  icon: any;
  title: string;
  to: string;
  active: boolean;
  isImage?: boolean;
  children?: { title: string; to: string; active: boolean }[];
};

export const getNavigationForRole = (
  role: UserRole,
  currentPath: string,
  modules?: Modules
): NavigationItem[] => {
  // Module flags can be booleans (legacy) or `{ enabled: boolean }` objects
  // (current BE payload) — isModuleEnabled handles both.
  const showDashboard =
    role === "project_manager"
      ? isModuleEnabled(modules?.contractManagement)
      : isModuleEnabled(modules?.reportsAnalytics) && role !== "view_only";

  const baseNavigation: (NavigationItem | undefined)[] = [
    showDashboard
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
      isModuleEnabled(modules?.solicitationManagement)
        ? {
            icon: FileText,
            title: "Solicitation Management",
            to: "/dashboard/solicitation",
            active: currentPath.startsWith("/dashboard/solicitation"),
          }
        : undefined,
      isModuleEnabled(modules?.evaluationsManagement)
        ? {
            icon: ClipboardList,
            title: "Evaluation Management",
            to: "/dashboard/evaluation",
            active: currentPath.startsWith("/dashboard/evaluation"),
          }
        : undefined,
      isModuleEnabled(modules?.contractManagement)
        ? {
            icon: Folder,
            title: "Projects",
            to: "/dashboard/project-management",
            active: currentPath.startsWith("/dashboard/project-management"),
          }
        : undefined,
      isModuleEnabled(modules?.contractManagement)
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
      isModuleEnabled(modules?.vendorManagement)
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
      isModuleEnabled(modules?.contractManagement)
        ? {
            icon: Folder,
            title: "Projects",
            to: "/dashboard/project-management",
            active: currentPath.startsWith("/dashboard/project-management"),
          }
        : undefined,
      isModuleEnabled(modules?.contractManagement)
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
      {
        icon: User2,
        title: "Profile",
        to: "/dashboard/profile",
        active: currentPath.startsWith("/dashboard/profile"),
      },
    ],
    evaluator: [
      isModuleEnabled(modules?.evaluationsManagement)
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
      isModuleEnabled(modules?.solicitationManagement)
        ? {
            icon: FileText,
            title: "Solicitation Management",
            to: "/dashboard/solicitation",
            active: currentPath.startsWith("/dashboard/solicitation"),
          }
        : undefined,
      isModuleEnabled(modules?.contractManagement)
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
      {
        icon: User2,
        title: "Profile",
        to: "/dashboard/profile",
        active: currentPath.startsWith("/dashboard/profile"),
      },
    ],
    project_manager: [
      isModuleEnabled(modules?.contractManagement)
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
                active: currentPath.startsWith("/dashboard/contract-management"),
              },
              {
                title: "Master Service Agreements (MSA)",
                to: "/dashboard/msa",
                active: currentPath.startsWith("/dashboard/msa"),
              },
            ],
          }
        : undefined,
      {
        icon: User2,
        title: "Profile",
        to: "/dashboard/profile",
        active: currentPath.startsWith("/dashboard/profile"),
      },
    ],
    approver: [
      isModuleEnabled(modules?.contractManagement)
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
      {
        icon: User2,
        title: "Profile",
        to: "/dashboard/profile",
        active: currentPath.startsWith("/dashboard/profile"),
      },
    ],
    view_only: [
      isModuleEnabled(modules?.contractManagement)
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
      {
        icon: User2,
        title: "Profile",
        to: "/dashboard/profile",
        active: currentPath.startsWith("/dashboard/profile"),
      },
    ],
    company_admin: [
      isModuleEnabled(modules?.solicitationManagement)
        ? {
            icon: FileText,
            title: "Solicitation Management",
            to: "/dashboard/solicitation",
            active: currentPath.startsWith("/dashboard/solicitation"),
          }
        : undefined,
      isModuleEnabled(modules?.evaluationsManagement)
        ? {
            icon: ClipboardList,
            title: "Evaluation Management",
            to: "/dashboard/evaluation",
            active: currentPath.startsWith("/dashboard/evaluation"),
          }
        : undefined,
      isModuleEnabled(modules?.contractManagement)
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
      isModuleEnabled(modules?.vendorManagement)
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
    super_admin: [
      {
        icon: Building2,
        title: "Companies",
        to: "/dashboard/companies",
        active: currentPath.startsWith("/dashboard/companies"),
      },
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

export const getFirstAccessibleRoute = (
  role: UserRole,
  modules?: Modules
): string => {
  const navigation = getNavigationForRole(role, "/", modules);
  // Find the first valid item
  const firstItem = navigation.find((item) => item !== undefined);
  if (firstItem) {
    return firstItem.to;
  }
  return "/dashboard"; // Fallback
};
