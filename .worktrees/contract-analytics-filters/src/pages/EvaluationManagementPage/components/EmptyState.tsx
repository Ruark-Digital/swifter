import { FileText } from "lucide-react";

export const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-300 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6">
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-400 mb-2">
        No Evaluations Added Yet
      </h3>
    </div>
  );
};