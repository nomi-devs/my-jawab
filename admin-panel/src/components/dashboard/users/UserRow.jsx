// src/components/dashboard/users/UserRow.jsx
import React from 'react';
import { Eye, Shield } from 'lucide-react';

const UserRow = React.memo(
  ({ user, onDelete, onEdit, onViewDetails, index = 0, serialNumber = 0 }) => {
    const handleDelete = () => {
      onDelete(user.id);
    };

    const handleEdit = () => {
      onEdit(user);
    };

    const handleViewDetails = () => {
      if (onViewDetails) {
        onViewDetails(user);
      }
    };

    return (
      <tr
        className="hover:bg-purple-50 dark:hover:bg-gray-700 transition-all duration-200"
        style={{
          animation: `fadeIn 0.3s ease-in-out ${index * 20}ms both`,
        }}
      >
        <td className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors">
          {serialNumber}
        </td>
        <td className="p-2 transition-colors">
          <div className="flex items-center space-x-2">
            <img
              src={user.img}
              alt={user.name || user.username}
              className="w-7 h-7 rounded-full bg-purple-200 dark:bg-purple-900/30 border border-white dark:border-gray-700 transition-transform duration-200 hover:scale-105"
              loading="lazy"
            />
            <div>
              <div className="font-semibold text-xs text-gray-800 dark:text-gray-200 transition-colors">
                {user.name || user.username}
              </div>
              {user.name && (
                <div className="text-gray-500 dark:text-gray-400 text-[10px] transition-colors">
                  @{user.username}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="p-2 text-xs text-gray-600 dark:text-gray-300 transition-colors">
          {user.email}
        </td>
        <td className="p-2 transition-colors">
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center w-fit space-x-1 ${
              user.role === 'Pro'
                ? 'bg-purple-100 text-purple-600'
                : user.role === 'Admin'
                  ? 'bg-amber-100 text-amber-600'
                  : user.role === 'Moderator'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Shield size={10} />
            <span>{user.role}</span>
          </span>
        </td>
        <td className="p-2">
          <span
            className={`inline-flex items-center w-fit px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
              user.status === 'Active'
                ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                : user.status === 'Suspended'
                  ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
                  : user.status === 'Pending'
                    ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30'
                    : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700'
            }`}
          >
            <span
              className={`w-1 h-1 rounded-full mr-1 ${
                user.status === 'Active'
                  ? 'bg-green-500 dark:bg-green-400'
                  : user.status === 'Suspended'
                    ? 'bg-red-500 dark:bg-red-400'
                    : user.status === 'Pending'
                      ? 'bg-yellow-500 dark:bg-yellow-400'
                      : 'bg-gray-500 dark:bg-gray-400'
              }`}
            ></span>
            {user.status}
          </span>
        </td>
        <td className="p-2 text-[10px] text-gray-500 dark:text-gray-400 transition-colors">
          {user.joined}
        </td>
        <td className="p-2 text-right transition-colors">
          <div className="flex items-center justify-end space-x-1">
            <button
              onClick={handleViewDetails}
              className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded transition-colors"
              title="View Details"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={handleEdit}
              className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
              title="Edit User"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title="Delete User"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </td>
      </tr>
    );
  },
);

UserRow.displayName = 'UserRow';
export default UserRow;
