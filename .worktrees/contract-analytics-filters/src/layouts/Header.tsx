import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToastHandler } from "@/hooks/useToaster";
import { useSetReset, useUser } from "@/store/authSlice";
import { ApiResponseError } from "@/types";
import { ChevronDown, LogOut } from "lucide-react";
import { ConfirmAlert } from "@/components/layouts/ConfirmAlert";
import { FaUser } from "react-icons/fa";
import { TbUserHexagon } from "react-icons/tb";
import { useNavigate, useLocation } from "react-router-dom";
import avatarImage from "@/assets/avatar-user.png";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const Header = () => {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard/solicitation":
        return "Solicitation Management";
      case "/dashboard/vendor":
        return "Vendor Management";
      case "/dashboard/evaluation":
        return "Evaluation Management";
      case "/dashboard/profile":
        return "Profile";
      case "/dashboard/user-management":
        return "User Management";
      case "/dashboard/business-divisions":
        return "Business Divisions";
      case "/dashboard/subscription":
        return "Subscription Management";
      case "/dashboard/companies":
        return "Company Management";
      case "/dashboard/project-management":
        return "Project Management";
      case "/dashboard/contract-management":
        return "Contract Management";
      case "/dashboard/admin-management":
        return "Admin Management";
      case "/dashboard/system-log":
        return "System Log";
      case "/dashboard/portal-settings":
        return "Portal Settings";
      case "/dashboard/invitations":
        return "Invitations";
      case "/dashboard/settings":
        return "Settings";
      case "/dashboard/demo":
        return "Demo";

      default:
        return "Dashboard";
    }
  };

  return (
    <header className="py-[34px] px-12 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-[82px] transition-colors">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-black dark:text-white font-quicksand">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
};

function UserMenu() {
  const user = useUser();
  const onResetState = useSetReset();
  const toastHandler = useToastHandler();
  const navigate = useNavigate();

  const handleLogOut = async () => {
    const TOAST_TITTLE = "Account Access";
    try {
      onResetState();
      navigate("/");
      // toastHandler.success(TOAST_TITTLE, "Logged out successfully"); // Optional: Show success message after logout
    } catch (error) {
      toastHandler.error(TOAST_TITTLE, error as ApiResponseError);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-3 px-4 py-0 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar ?? avatarImage} alt="User avatar" />
            <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
              <FaUser />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-black dark:text-white font-quicksand">
              {user?.name}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-quicksand capitalize">
              {user?.role?.name?.replace('_', ' ')}
            </span>
          </div>
          <ChevronDown className="h-6 w-6 text-[#2A4467] dark:text-gray-300 stroke-[1.5]" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
          <TbUserHexagon className="mr-2 h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="text-xs">My Profile</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <ConfirmAlert
          type="logout"
          title="Confirm Logout"
          text="Are you sure you want to log out?"
          onPrimaryAction={handleLogOut}
          primaryButtonText="Logout"
          secondaryButtonText="Cancel"
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <LogOut className="mr-2 h-4 w-4 text-primary" />
              <span className="text-primary text-xs">Log out</span>
            </DropdownMenuItem>
          }
        ></ConfirmAlert>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
