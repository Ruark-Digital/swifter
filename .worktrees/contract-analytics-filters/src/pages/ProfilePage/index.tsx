import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import ProfileInformation from './components/ProfileInformation';
import NotificationSettings from './components/NotificationSettings';
import SecuritySettings from './components/SecuritySettings';
import CompanyProfile from './components/CompanyProfile';
import { useUserRole } from '@/hooks/useUserRole';

type TabType = 'profile' | 'company' | 'notification' | 'security';

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const { isCompanyAdmin, isSuperAdmin } = useUserRole();

  const allTabs = [
    { id: 'profile' as TabType, label: 'Profile information' },
    { id: 'company' as TabType, label: 'Company Profile' },
    { id: 'notification' as TabType, label: 'Notification Setting' },
    { id: 'security' as TabType, label: 'Security settings' },
  ];

  // Filter tabs based on user role
  const tabs = allTabs.filter(tab => {
    if (tab.id === 'company') {
      return isCompanyAdmin;
    }
    if (tab.id === 'notification') {
      return !isSuperAdmin;
    }
    return true;
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileInformation />;
      case 'company':
        return <CompanyProfile />;
      case 'notification':
        return <NotificationSettings />;
      case 'security':
        return <SecuritySettings />;
      default:
        return <ProfileInformation />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">My Profile</h1>
      </div>

      <div className="flex gap-6">
        {/* Left Sidebar */}
        <div className="w-64 flex-shrink-0">
            <div className="p-4 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full text-left text-sm py-2 px-3 rounded cursor-pointer transition-colors",
                    activeTab === tab.id
                      ? "font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-3xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;