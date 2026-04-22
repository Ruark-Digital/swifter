import React from 'react';

interface LocalUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Suspended' | 'Inactive';
  lastActivity: string;
}

interface StatusBadgeProps {
  status: LocalUser['status'];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let bgColor = '';
  let textColor = '';

  switch (status) {
    case 'Active':
      bgColor = 'bg-green-100';
      textColor = 'text-green-700';
      break;
    case 'Suspended':
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
      break;
    case 'Inactive':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-700';
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-700';
  }

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
      {status}
    </span>
  );
};

interface UserTableRowProps {
  user: LocalUser;
}

const UserTableRow: React.FC<UserTableRowProps> = ({ user }) => {
  return (
    <tr className="bg-white hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {user.name}
        <div className="text-xs text-gray-500">{user.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={user.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastActivity}</td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button className="text-indigo-600 hover:text-indigo-900">
          <DotsVerticalIcon />
        </button>
      </td>
    </tr>
  );
};

const UsersTable: React.FC = () => {
  // Placeholder data - this will eventually come from an API
  const users: LocalUser[] = [
    { _id: '1', name: 'Elise Johnson', email: 'Mike@acme.com', role: 'Admin', status: 'Active', lastActivity: '2025-03-25' },
    { _id: '2', name: 'Elise Johnson', email: 'Mike@acme.com', role: 'Admin', status: 'Suspended', lastActivity: '2025-03-25' },
    { _id: '3', name: 'Elise Johnson', email: 'Mike@acme.com', role: 'Procurement Lead', status: 'Inactive', lastActivity: '2025-03-25' },
    { _id: '4', name: 'Elise Johnson', email: 'Mike@acme.com', role: 'Procurement Lead', status: 'Active', lastActivity: '2025-03-25' },
    { _id: '5', name: 'Elise Johnson', email: 'Mike@acme.com', role: 'Evaluators', status: 'Active', lastActivity: '2025-03-25' },
    { _id: '6', name: 'Elise Johnson', email: 'Mike@acme.com', role: 'Evaluators', status: 'Active', lastActivity: '2025-03-25' },
    { _id: '7', name: 'Elise Johnson', email: 'Mike@acme.com', role: 'Evaluators', status: 'Active', lastActivity: '2025-03-25' },
    { _id: '8', name: 'Elise Johnson', email: 'Mike@acme.com', role: 'Evaluators', status: 'Active', lastActivity: '2025-03-25' },
    { _id: '9', name: 'Elise Johnson', email: 'Mike@acme.com', role: 'Evaluators', status: 'Active', lastActivity: '2025-03-25' },
    { _id: '10', name: 'Elise Johnson', email: 'Mike@acme.com', role: 'Evaluators', status: 'Active', lastActivity: '2025-03-25' },
  ];

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <UserTableRow key={user._id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Placeholder Icon
const DotsVerticalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
  </svg>
);

export default UsersTable;