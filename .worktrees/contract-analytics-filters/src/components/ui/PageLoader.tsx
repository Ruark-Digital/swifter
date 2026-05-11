import React from 'react';

interface PageLoaderProps {
  title?: string;
  message?: string;
  showHeader?: boolean;
  headerContent?: React.ReactNode;
  className?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  title = "Loading...",
  message,
  showHeader = true,
  headerContent,
  className = "p-6 space-y-6"
}) => {
  return (
    <div className={className}>
      {showHeader && (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
              {title}
            </h1>
          </div>
          {headerContent}
        </div>
      )}
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          {message && (
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageLoader;