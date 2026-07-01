// src/components/dashboard/polls/PollRow.jsx
import React from 'react';
import {
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';

const PollRow = React.memo(
  ({ poll, onEdit, onDelete, onViewDetails, index = 0, serialNumber = 0 }) => {
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const truncateText = (text, maxLength = 60) => {
      if (!text) return 'No description';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    const getStatusBadge = () => {
      const status = poll.poll_status || poll.status;
      const isExpired = poll.is_expired;

      if (isExpired || status === 'ended') {
        return (
          <span className="inline-flex items-center w-fit px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
            <span className="w-1 h-1 rounded-full mr-1 bg-gray-500 dark:bg-gray-400"></span>
            Ended
          </span>
        );
      }
      if (status === 'published') {
        return (
          <span className="inline-flex items-center w-fit px-1.5 py-0.5 rounded-full text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30">
            <span className="w-1 h-1 rounded-full mr-1 bg-green-500 dark:bg-green-400"></span>
            Published
          </span>
        );
      }
      if (status === 'draft') {
        return (
          <span className="inline-flex items-center w-fit px-1.5 py-0.5 rounded-full text-[10px] font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30">
            <span className="w-1 h-1 rounded-full mr-1 bg-yellow-500 dark:bg-yellow-400"></span>
            Draft
          </span>
        );
      }
      return null;
    };

    const getTotalVotes = () => {
      if (poll.options && Array.isArray(poll.options)) {
        return poll.options.reduce((sum, option) => sum + (option.vote_count || 0), 0);
      }
      return poll.vote_count || 0;
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
        {/* Poll Title & Icon */}
        <td className="p-2 transition-colors">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-white flex-shrink-0">
              <BarChart3 size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-xs text-gray-800 dark:text-gray-200 transition-colors truncate">
                {poll.poll_title || poll.title || 'Untitled Poll'}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-[10px] transition-colors truncate">
                {truncateText(poll.poll_description || poll.description, 40)}
              </div>
            </div>
          </div>
        </td>

        {/* Description */}
        <td className="p-2 text-xs text-gray-600 dark:text-gray-300 transition-colors max-w-xs">
          <div className="truncate" title={poll.poll_description || poll.description}>
            {truncateText(poll.poll_description || poll.description, 50)}
          </div>
        </td>

        {/* Status */}
        <td className="p-2 transition-colors">
          <div className="flex flex-col gap-0.5">
            {getStatusBadge()}
            <span className="inline-flex items-center w-fit px-1.5 py-0.5 rounded-full text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30">
              {poll.is_featured ? (
                <>
                  <TrendingUp size={9} className="mr-0.5" />
                  Featured
                </>
              ) : (
                <>Not Featured</>
              )}
            </span>
          </div>
        </td>

        {/* Stats */}
        <td className="p-2 transition-colors">
          <div className="flex items-center space-x-2 text-[10px] text-gray-500 dark:text-gray-400">
            {getTotalVotes() > 0 && (
              <div className="flex items-center space-x-1">
                <Users size={10} />
                <span>{getTotalVotes()} votes</span>
              </div>
            )}

            <div className="flex items-center space-x-1">
              <BarChart3 size={10} />
              <span>{poll.view_count} views</span>
            </div>
          </div>
        </td>

        {/* Date */}
        <td className="p-2 text-[10px] text-gray-500 dark:text-gray-400 transition-colors">
          {formatDate(poll.poll_expires_at || poll.expires_at || poll.created_at)}
        </td>

        {/* Actions */}
        <td className="p-2 text-right transition-colors">
          <div className="flex items-center justify-end space-x-1">
            <button
              onClick={() => onViewDetails && onViewDetails(poll)}
              className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded transition-colors"
              title="View Details"
            >
              <Eye size={14} />
            </button>
            {/* Edit temporarily disabled – handled via details view or future edit flow */}
            <button
              onClick={() => onEdit && onEdit(poll)}
              className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/10 rounded transition-colors"
              title="Edit Poll"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => onDelete && onDelete(poll)}
              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title="Delete Poll"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  },
);

PollRow.displayName = 'PollRow';
export default PollRow;
