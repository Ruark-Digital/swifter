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
import { useSetUser, useUser } from '@/store/authSlice';
import { UserRole } from '@/types';
import { getUser } from '@/demo';
import { ChevronDown, User, Shield, Building, Crown, Briefcase, FileText, UserCheck, Eye } from 'lucide-react';

const roleConfig: Record<UserRole, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  evaluator: {
    label: 'Evaluator',
    icon: User,
    color: 'bg-blue-100 text-blue-800'
  },
  vendor: {
    label: 'Vendor',
    icon: Briefcase,
    color: 'bg-green-100 text-green-800'
  },
  project_manager: {
    label: 'Project Manager',
    icon: FileText,
    color: 'bg-slate-100 text-slate-800'
  },
  approver: {
    label: 'Approver',
    icon: UserCheck,
    color: 'bg-yellow-100 text-yellow-800'
  },
  view_only: {
    label: 'View Only',
    icon: Eye,
    color: 'bg-gray-100 text-gray-800'
  },
  contract_manager: {
    label: 'Contract Manager',
    icon: FileText,
    color: 'bg-slate-100 text-slate-800'
  },
  "company_admin": {
    label: 'Company Admin',
    icon: Building,
    color: 'bg-purple-100 text-purple-800'
  },
  'super_admin': {
    label: 'Super Admin',
    icon: Crown,
    color: 'bg-red-100 text-red-800'
  },
  procurement: {
    label: 'Procurement',
    icon: Shield,
    color: 'bg-orange-100 text-orange-800'
  }
};

export const RoleSwitcher: React.FC = () => {
  const user = useUser();
  const setUser = useSetUser();
  const currentRole = user?.role?.name || 'procurement';
  const currentConfig = roleConfig[currentRole];
  const IconComponent = currentConfig.icon;

  const handleRoleSwitch = (newRole: UserRole) => {
    // Create a new user with the selected role
    const newUser = getUser(newRole);
    setUser(newUser);
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
        <DropdownMenuLabel>Switch Role (Demo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(roleConfig).map(([role, config]) => {
          const RoleIcon = config.icon;
          const isActive = role === currentRole;
          
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleSwitch(role as UserRole)}
              className={`flex items-center gap-2 cursor-pointer ${
                isActive ? 'bg-gray-100' : ''
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
