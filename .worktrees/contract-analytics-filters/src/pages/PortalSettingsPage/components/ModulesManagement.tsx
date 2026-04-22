import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRequest, putRequest } from '@/lib/axiosInstance';
import { ApiResponse, ApiResponseError } from '@/types';
import { useToastHandler } from '@/hooks/useToaster';
import { useUser } from '@/store/authSlice';
import { PageLoader } from '@/components/ui/PageLoader';

type ModuleType = {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  connected: boolean;
};

// Portal Settings type based on API documentation
type PortalSettings = {
  _id: string;
  companyId: string;
  solicitationManagement: boolean;
  evaluationsManagement: boolean;
  vendorManagement: boolean;
  reportsAnalytics: boolean;
  vendorsQA: boolean;
  generalUpdatesNotifications: boolean;
  addendumManagement: boolean;
  myActions: boolean;
  createdAt: string;
  updatedAt: string;
};

// Module settings for API update
type ModuleSettings = {
  solicitationManagement?: boolean;
  evaluationsManagement?: boolean;
  vendorManagement?: boolean;
  reportsAnalytics?: boolean;
  vendorsQA?: boolean;
  generalUpdatesNotifications?: boolean;
  addendumManagement?: boolean;
  myActions?: boolean;
};

const ModulesManagement: React.FC = () => {
  const user = useUser();
  const toast = useToastHandler();
  const queryClient = useQueryClient();
  const companyId = user?.companyId;

  // Module configuration mapping API fields to UI
  const moduleConfig: ModuleType[] = [
    {
      id: 'solicitation-management',
      title: 'Solicitations Management',
      description: 'Manage solicitation creation and vendor invites',
      moduleId: 'ighmmpiobklfepjocnamgkkbiglidom',
      connected: true,
    },
    {
      id: 'evaluations-management',
      title: 'Evaluations Management',
      description: 'Setup evaluations and assign reviewers/evaluators',
      moduleId: 'ighmmpiobklfepjocnamgkkbiglidom',
      connected: true,
    },
    {
      id: 'vendor-management',
      title: 'Vendor Management',
      description: 'Onboard, track, and assign vendors',
      moduleId: 'ighmmpiobklfepjocnamgkkbiglidom',
      connected: true,
    },
    {
      id: 'reports-analytics',
      title: 'Reports & Analytics',
      description: 'View dashboards and generate performance reports',
      moduleId: 'ighmmpiobklfepjocnamgkkbiglidom',
      connected: true,
    },
    {
      id: 'vendors-qa',
      title: 'Vendors Q & A',
      description: 'Allow vendor clarification and updates',
      moduleId: 'ighmmpiobklfepjocnamgkkbiglidom',
      connected: true,
    },
    {
      id: 'general-updates',
      title: 'General Updates/Notifications',
      description: 'Trigger alerts via email and in-app',
      moduleId: 'ighmmpiobklfepjocnamgkkbiglidom',
      connected: true,
    },
    {
      id: 'addendum-management',
      title: 'Addendum Management',
      description: 'Manage Vendor Q & A, updates solicitations',
      moduleId: 'ighmmpiobklfepjocnamgkkbiglidom',
      connected: true,
    },
    {
      id: 'my-actions',
      title: 'My Actions',
      description: 'Updates about pending actions/tasks',
      moduleId: 'ighmmpiobklfepjocnamgkkbiglidom',
      connected: true,
    },
  ];

  const [modules, setModules] = useState<ModuleType[]>(moduleConfig);

  // Fetch portal settings from API
  const {
    data: portalSettingsResponse,
    isLoading: isLoadingPortalSettings,
    error: portalSettingsError,
  } = useQuery<ApiResponse<PortalSettings>, ApiResponseError>({
    queryKey: ['portalSettings', companyId],
    queryFn: async () => await getRequest({ url: `/admins/portal-settings/${companyId}` }),
    enabled: !!companyId,
  });

  const portalSettingsData = portalSettingsResponse?.data?.data;

  // Portal settings update mutation
  const { mutateAsync: updatePortalSettings } =
    useMutation<ApiResponse<PortalSettings>, ApiResponseError, ModuleSettings>({
      mutationFn: async (payload) =>
        await putRequest({ url: `/admins/portal-settings/${companyId}`, payload }),
      onSuccess: () => {
        toast.success(
          'Portal Settings',
          'Module settings updated successfully'
        );
        queryClient.invalidateQueries({ queryKey: ['portalSettings', companyId] });
      },
      onError: (error) => {
        toast.error(
          'Error',
          error.response?.data?.message || 'Failed to update module settings'
        );
      },
    });

  // Update modules state when portal settings data is loaded
  useEffect(() => {
    if (portalSettingsData) {
      const updatedModules = moduleConfig.map((module) => {
        let connected = true;
        
        // Map module IDs to API fields
        switch (module.id) {
          case 'solicitation-management':
            connected = portalSettingsData.solicitationManagement;
            break;
          case 'evaluations-management':
            connected = portalSettingsData.evaluationsManagement;
            break;
          case 'vendor-management':
            connected = portalSettingsData.vendorManagement;
            break;
          case 'reports-analytics':
            connected = portalSettingsData.reportsAnalytics;
            break;
          case 'vendors-qa':
            connected = portalSettingsData.vendorsQA;
            break;
          case 'general-updates':
            connected = portalSettingsData.generalUpdatesNotifications;
            break;
          case 'addendum-management':
            connected = portalSettingsData.addendumManagement;
            break;
          case 'my-actions':
            connected = portalSettingsData.myActions;
            break;
          default:
            connected = true;
        }
        
        return { ...module, connected };
      });
      
      setModules(updatedModules);
    }
  }, [portalSettingsData]);

  const updateModule = async (id: string, connected: boolean) => {
    // Optimistically update UI
    setModules(prev => 
      prev.map(module => 
        module.id === id 
          ? { ...module, connected }
          : module
      )
    );

    // Prepare API payload based on module ID
    const payload: ModuleSettings = {};
    
    switch (id) {
      case 'solicitation-management':
        payload.solicitationManagement = connected;
        break;
      case 'evaluations-management':
        payload.evaluationsManagement = connected;
        break;
      case 'vendor-management':
        payload.vendorManagement = connected;
        break;
      case 'reports-analytics':
        payload.reportsAnalytics = connected;
        break;
      case 'vendors-qa':
        payload.vendorsQA = connected;
        break;
      case 'general-updates':
        payload.generalUpdatesNotifications = connected;
        break;
      case 'addendum-management':
        payload.addendumManagement = connected;
        break;
      case 'my-actions':
        payload.myActions = connected;
        break;
      default:
        return;
    }

    try {
      await updatePortalSettings(payload);
    } catch (error) {
      // Revert optimistic update on error
      setModules(prev => 
        prev.map(module => 
          module.id === id 
            ? { ...module, connected: !connected }
            : module
        )
      );
    }
  };

  // Show loading state
  if (isLoadingPortalSettings) {
    return (
      <Card className='!bg-transparent border-0'>
        <CardHeader>
          <CardTitle>Portal Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <PageLoader 
            showHeader={false}
            message="Loading portal settings..."
            className="py-8"
          />
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (portalSettingsError) {
    return (
      <Card className='!bg-transparent border-0'>
        <CardHeader>
          <CardTitle>Portal Settings</CardTitle>
          <CardDescription>
            Error loading portal settings. Please try again.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className='!bg-transparent border-0'>
      <CardHeader>
        <CardTitle>Portal Settings</CardTitle>
        <CardDescription>
          Enable or disable modules across the portal. These modules determine what features companies can activate during onboarding or via subscription upgrades
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module) => (
            <Card key={module.id} className="border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {module.title}
                    </h3>
                    <p className="text-sm text-gray-400 dark:text-gray-700 mb-3">
                      {module.description}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                      <span className="font-medium">ID:</span> {module.moduleId}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-gray-600 dark:text-gray-400">
                        {module.connected ? 'Connected' : 'Disconnected'}
                      </Label>
                      <Switch
                        checked={module.connected}
                        onCheckedChange={(checked) => updateModule(module.id, checked)}
                        className="data-[state=checked]:bg-[#2A4467]"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModulesManagement;