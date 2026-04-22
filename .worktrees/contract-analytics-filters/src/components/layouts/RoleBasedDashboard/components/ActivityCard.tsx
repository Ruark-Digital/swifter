import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardConfig } from "@/config/dashboardConfig";
import { Activity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ActivityComponentProps {
  activity: DashboardConfig["rows"][0]["properties"][0];
}

// Campaign data shape based on API response provided in requirements
interface CampaignData {
  subject: string;
  subtitle?: string;
  message: string;
  recipientType: "all_users" | "selected_users";
  users: string[];
  bannerUrl?: string;
  campaignType: string;
  createdAt: string;
}

export const ActivityComponent: React.FC<ActivityComponentProps> = ({
  activity,
}) => {
  const [open, setOpen] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<CampaignData | null>(
    null
  );

  const handleItemClick = (item: any) => {
    if (item?.action === "campaign" && item?.campaign) {
      setActiveCampaign(item.campaign as CampaignData);
      setOpen(true);
    }
  };

  return (
    <>
      <Card className={("bg-white dark:bg-slate-950 " + (activity?.className || "")).trim()}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-gray-800 dark:text-gray-200">
            {activity.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 overflow-auto h-[25rem]">
          {activity?.items && activity.items.length > 0 ? (
            activity.items.map((item: any) => (
              <div
                key={item.id}
                className={
                  "space-y-1 w-full py-1.5 border-t border-gray-200 dark:border-gray-700 first:border-t-0" +
                  (item?.action === "campaign" ? " cursor-pointer" : "")
                }
                onClick={
                  item?.action === "campaign"
                    ? () => handleItemClick(item)
                    : undefined
                }
                role={item?.action === "campaign" ? "button" : undefined}
                aria-haspopup={
                  item?.action === "campaign" ? "dialog" : undefined
                }
              >
                <div className="mt-2 text-base text-gray-900 dark:text-gray-100">
                  <span dangerouslySetInnerHTML={{ __html: item.text }} />
                </div>

                {(item.status || item.date || item.time || item.type) && (
                  <div className="flex items-center gap-2 min-w-0">
                    {item.date || item.time ? (
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {item.type} • {item.date || item.time}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {item.type}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 h-full">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1">
                No {activity.title?.toLowerCase() || "activities"} yet
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {activity.title?.includes("Recent Activity")
                  ? "Recent activities will appear here when actions are performed."
                  : activity.title?.includes("My Actions")
                  ? "Your pending actions will appear here when available."
                  : "Activities will appear here when available."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className=" sm:rounded-lg p-0 overflow-hidden">
          <DialogHeader className="p-3 py-4 bg-gray-300">
            <DialogTitle className="text-xl font-semibold text-primary dark:text-gray-100">
              SwiftPro Support
            </DialogTitle>
          </DialogHeader>

          <div className="pb-3 px-4">
            {/* Subject */}
            {activeCampaign?.subject && (
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {activeCampaign.subject}
              </h2>
            )}

            {/* Subtitle */}
            {activeCampaign?.subtitle ? (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {activeCampaign.subtitle}
              </p>
            ) : null}

            {/* Banner Image */}
            {activeCampaign?.bannerUrl ? (
              <div className="mt-4 rounded-b-lg">
                <img
                  src={activeCampaign.bannerUrl}
                  alt="Campaign banner"
                  className="w-full max-h-64 object-cover rounded-md"
                />
              </div>
            ) : null}

            {/* Message */}
            {activeCampaign?.message && (
              <div className="mt-4 text-sm leading-6 text-gray-800 dark:text-gray-200 overflow-y-auto">
                <div
                  // Rendering as HTML per requirements (message supports formatting)
                  dangerouslySetInnerHTML={{ __html: activeCampaign.message }}
                />
              </div>
            )}

            {/* Footer / Recipient Info */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {activeCampaign?.recipientType === "all_users"
                  ? "Sent to all users"
                  : `Sent to ${activeCampaign?.users?.length ?? 0} users`}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
