import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
};

// Shared "nothing to show" body for the dashboard analytics cards. Markup
// mirrors the inline empty states already used by VendorsValueCard /
// CategoryValueCard / ProjectValueCard so every card reads the same when the
// API returns nothing.
export const AnalyticsEmptyState: React.FC<Props> = ({
  icon: Icon,
  title,
  description,
}) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 h-full">
    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4">
      <Icon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
    </div>
    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1">
      {title}
    </h4>
    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
      {description}
    </p>
  </div>
);
