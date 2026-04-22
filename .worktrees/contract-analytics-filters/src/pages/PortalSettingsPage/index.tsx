import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotificationSettings from "./components/NotificationSettings";
import ModulesManagement from "./components/ModulesManagement";

const PortalSettingsPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Portal Settings
        </h1>
      </div>

      <Tabs defaultValue="modules" className="w-full bg-transparent">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="w-64 ">
            <TabsList className="h-auto !bg-transparent p-0 w-full flex-col justify-start space-y-2">
              <TabsTrigger
                value="modules"
                className="w-full text-left text-sm py-2 px-3 border-0 rounded cursor-pointer transition-colors data-[state=active]:font-medium data-[state=active]:text-gray-900 data-[state=active]:dark:text-gray-100 data-[state=active]:bg-gray-100 data-[state=active]:dark:bg-gray-800 data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 justify-start"
              >
                Modules Management
              </TabsTrigger>
              <TabsTrigger
                value="notification"
                className="w-full text-left text-sm py-2 px-3 border-0 rounded cursor-pointer transition-colors data-[state=active]:font-medium data-[state=active]:text-gray-900 data-[state=active]:dark:text-gray-100 data-[state=active]:bg-gray-100 data-[state=active]:dark:bg-gray-800 data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 justify-start"
              >
                Notification
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <TabsContent value="notification" className="mt-0">
              <NotificationSettings />
            </TabsContent>
            <TabsContent value="modules" className="mt-0">
              <ModulesManagement />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default PortalSettingsPage;
