import React, { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, putRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { PageLoader } from "@/components/ui/PageLoader";

// Types for notification settings based on API documentation
type NotificationMethod = "email" | "push" | "sms";

type NotificationItem = {
  newSolicitations: NotificationMethod[];
  proposalUpdates: NotificationMethod[];
  evaluationAssignments: NotificationMethod[];
  upcomingDeadlines: NotificationMethod[];
  questionsUpdate: NotificationMethod[];
};

export interface NotificationSettings extends NotificationItem {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

type NotificationKey =
  | "newSolicitations"
  | "proposalUpdates"
  | "evaluationAssignments"
  | "upcomingDeadlines"
  | "questionsUpdate";

type NotificationCardProps = {
  title: string;
  settingKey: NotificationKey;
  settings: NotificationItem | null;
  onSettingChange: (
    type: NotificationMethod,
    key: NotificationKey,
    value: boolean
  ) => void;
  isUpdating: boolean;
};

const NotificationCard: React.FC<NotificationCardProps> = ({
  title,
  settingKey,
  settings,
  onSettingChange,
  isUpdating,
}) => {
  const currentSettings = settings?.[settingKey] || [];

  const isMethodEnabled = (method: NotificationMethod) => {
    return currentSettings.includes(method);
  };

  const handleToggle = (method: NotificationMethod, checked: boolean) => {
    onSettingChange(method, settingKey, checked);
  };

  return (
    <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
      <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
        {title}
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch
              checked={isMethodEnabled("push")}
              onCheckedChange={(checked) => handleToggle("push", checked)}
              disabled={isUpdating}
              className="data-[state=checked]:bg-[#2A4467] dark:data-[state=checked]:bg-[#2A4467]"
            />
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Push
            </Label>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch
              checked={isMethodEnabled("email")}
              onCheckedChange={(checked) => handleToggle("email", checked)}
              disabled={isUpdating}
              className="data-[state=checked]:bg-[#2A4467] dark:data-[state=checked]:bg-[#2A4467]"
            />
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </Label>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch
              checked={isMethodEnabled("sms")}
              onCheckedChange={(checked) => handleToggle("sms", checked)}
              disabled={isUpdating}
              className="data-[state=checked]:bg-[#2A4467] dark:data-[state=checked]:bg-[#2A4467]"
            />
            <Label className="text-sm text-gray-500 dark:text-gray-400">
              SMS
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const { success: showSuccessToast, error: showErrorToast } = useToastHandler();
  const [localSettings, setLocalSettings] = useState<NotificationItem | null>(null);

  // Fetch notification settings
  const {
    data: notificationData,
    isLoading,
    error,
  } = useQuery<ApiResponse<NotificationSettings>, ApiResponseError>({
    queryKey: ["notification-settings"],
    queryFn: async () => await getRequest({ url: `/notifications/settings` }),
    staleTime: 5 * 60 * 1000,
  });

  // Update notification settings mutation
  const updateSettingsMutation = useMutation<
    ApiResponse<NotificationSettings>,
    ApiResponseError,
    Partial<NotificationItem>
  >({
    mutationFn: async (updatedSettings) =>
      await putRequest({
        url: `/notifications/settings`,
        payload: updatedSettings,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
      showSuccessToast("Success", "Notification settings updated successfully");
    },
    onError: (error) => {
      showErrorToast(
        "Error",
        error.response?.data?.message || "Failed to update notification settings"
      );
      // Revert local changes on error
      if (notificationData?.data) {
        setLocalSettings({
          newSolicitations: notificationData.data.data.newSolicitations,
          proposalUpdates: notificationData.data.data.proposalUpdates,
          evaluationAssignments: notificationData.data.data.evaluationAssignments,
          upcomingDeadlines: notificationData.data.data.upcomingDeadlines,
          questionsUpdate: notificationData.data.data.questionsUpdate,
        });
      }
    },
  });

  // Initialize local settings when data is loaded
  useEffect(() => {
    if (notificationData?.data) {
      setLocalSettings({
        newSolicitations: notificationData.data.data.newSolicitations,
        proposalUpdates: notificationData.data.data.proposalUpdates,
        evaluationAssignments: notificationData.data.data.evaluationAssignments,
        upcomingDeadlines: notificationData.data.data.upcomingDeadlines,
        questionsUpdate: notificationData.data.data.questionsUpdate,
      });
    }
  }, [notificationData]);

  const handleSettingChange = (
    method: NotificationMethod,
    key: NotificationKey,
    enabled: boolean
  ) => {
    if (!localSettings) return;

    const currentMethods = localSettings[key] || [];
    let updatedMethods: NotificationMethod[];

    if (enabled) {
      // Add method if not already present
      updatedMethods = currentMethods.includes(method)
        ? currentMethods
        : [...currentMethods, method];
    } else {
      // Remove method
      updatedMethods = currentMethods.filter((m) => m !== method);
    }

    const updatedSettings = {
      ...localSettings,
      [key]: updatedMethods,
    };

    setLocalSettings(updatedSettings);

    // Send update to server
    updateSettingsMutation.mutate({
      [key]: updatedMethods,
    });
  };

  if (isLoading) {
    return (
      <PageLoader
        showHeader={false}
        message="Loading notification settings..."
        className="p-6"
      />
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Notification settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We may still send you important notifications about your account
            outside of your notification settings.
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-red-500 dark:text-red-400">
            Error loading notification settings:{" "}
            {error.response?.data?.message || error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Notification settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We may still send you important notifications about your account
          outside of your notification settings.
        </p>
      </div>

      <div className="space-y-8">
        <NotificationCard
          title="New solicitations"
          settingKey="newSolicitations"
          settings={localSettings}
          onSettingChange={handleSettingChange}
          isUpdating={updateSettingsMutation.isPending}
        />

        <NotificationCard
          title="Proposal updates"
          settingKey="proposalUpdates"
          settings={localSettings}
          onSettingChange={handleSettingChange}
          isUpdating={updateSettingsMutation.isPending}
        />

        <NotificationCard
          title="Evaluation assignments"
          settingKey="evaluationAssignments"
          settings={localSettings}
          onSettingChange={handleSettingChange}
          isUpdating={updateSettingsMutation.isPending}
        />

        <NotificationCard
          title="Upcoming deadlines"
          settingKey="upcomingDeadlines"
          settings={localSettings}
          onSettingChange={handleSettingChange}
          isUpdating={updateSettingsMutation.isPending}
        />

        <NotificationCard
          title="Questions Update"
          settingKey="questionsUpdate"
          settings={localSettings}
          onSettingChange={handleSettingChange}
          isUpdating={updateSettingsMutation.isPending}
        />
      </div>
    </div>
  );
};

export default NotificationSettings;
