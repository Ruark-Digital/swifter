import React from 'react';

const UserPageHeader: React.FC = () => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
      <h1 className="text-3xl font-semibold text-gray-900 mb-4 sm:mb-0">Users</h1>
      <div className="flex space-x-3">
        <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center">
          <ExportIcon />
          <span className="ml-2">Export</span>
        </button>
        <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center">
          <PlusIcon />
          <span className="ml-2">Add User</span>
        </button>
      </div>
    </div>
  );
};

// Placeholder Icons - these should be replaced with actual SVG icons
const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m2.25-6.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> 
    {/* A generic icon, replace with a proper export icon */}
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export default UserPageHeader;