import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useUser } from '@/store/authSlice';
import { getFirstAccessibleRoute } from '@/lib/navigation';
import { UserRole } from '@/types';
import { ChevronDown, User, Shield, Building, Crown, Briefcase, FileText, UserCheck, Eye } from 'lucide-react';

const roleConfig: Record<UserRole, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  evaluator: {
    label: 'Evaluator',
    icon: User,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
  },
  vendor: {
    label: 'Vendor',
    icon: Briefcase,
    color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
  },
  project_manager: {
    label: 'Project Manager',
    icon: FileText,
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200'
  },
  approver: {
    label: 'Approver',
    icon: UserCheck,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200'
  },
  view_only: {
    label: 'View Only',
    icon: Eye,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-200'
  },
  contract_manager: {
    label: 'Contract Manager',
    icon: FileText,
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200'
  },
  "company_admin": {
    label: 'Company Admin',
    icon: Building,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200'
  },
  'super_admin': {
    label: 'Super Admin',
    icon: Crown,
    color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
  },
  procurement: {
    label: 'Procurement',
    icon: Shield,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200'
  }
};

/**
 * Header control for users who hold more than one role (QA #177). Switches the
 * *active* role; the rest of the app keeps operating as a single-role app off
 * that active role. Renders nothing for single-role users.
 */
export const RoleSwitcher: React.FC = () => {
  const { roles, userRole, hasMultipleRoles, setActiveRole } = useUserRole();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useUser();

  if (!hasMultipleRoles) return null;

  const currentConfig = roleConfig[userRole];
  const IconComponent = currentConfig.icon;

  const handleRoleSwitch = (newRole: UserRole) => {
    if (newRole === userRole) return;
    setActiveRole(newRole);
    // The active role drives dashboard config and the /manager|/approver|/vendor
    // API dispatch, so re-scope role-dependent data on switch.
    queryClient.invalidateQueries();
    // The previous role's page may not exist in the new role's navigation (its
    // sidebar item is gone, so the user is stranded on a route they can no
    // longer reach from the menu). Land them on the new role's first accessible
    // sidebar item instead — module-gated, same source the sidebar uses.
    navigate(getFirstAccessibleRoute(newRole, user?.module));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <IconComponent className="h-4 w-4" />
          <Badge variant="secondary" className={currentConfig.color}>
            {currentConfig.label}
          </Badge>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map((role) => {
          const config = roleConfig[role];
          if (!config) return null;
          const RoleIcon = config.icon;
          const isActive = role === userRole;

          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleSwitch(role)}
              className={`flex items-center gap-2 cursor-pointer ${
                isActive ? 'bg-gray-100 dark:bg-gray-800' : ''
              }`}
            >
              <RoleIcon className="h-4 w-4" />
              <span className="flex-1">{config.label}</span>
              {isActive && (
                <Badge variant="secondary" className="text-xs">
                  Current
                </Badge>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RoleSwitcher;
