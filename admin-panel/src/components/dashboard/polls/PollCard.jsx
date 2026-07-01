// src/components/dashboard/polls/PollCard.jsx
import React from 'react';
import {
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

const PollCard = React.memo(({ poll, onEdit, onDelete, onViewDetails }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status, isExpired) => {
    if (isExpired || status === 'ended') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
          <XCircle size={12} className="mr-1" />
          Ended
        </span>
      );
    }
    if (status === 'published') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
          <CheckCircle size={12} className="mr-1" />
          Published
        </span>
      );
    }
    if (status === 'draft') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all">
      {/* Card Header */}
      <div className="p-4 border-b border-purple-100 dark:border-gray-700">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1 line-clamp-2 transition-colors">
              {poll.poll_title || poll.title || 'Untitled Poll'}
            </h3>
            {poll.poll_description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 transition-colors">
                {poll.poll_description}
              </p>
            )}
          </div>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0
            ${
              poll.is_featured
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            <TrendingUp size={12} className="mr-1" />
            {poll.is_featured ? 'Featured' : 'Not Featured'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          {getStatusBadge(poll.poll_status || poll.status, poll.is_expired)}
          <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
            {/* ID: {poll.id} */}
          </span>
        </div>
      </div>

      {/* Poll Options Preview */}
      <div className="p-4">
        {poll.options && Array.isArray(poll.options) && poll.options.length > 0 ? (
          <div className="space-y-2 mb-4">
            {poll.options.slice(0, 3).map((option, index) => {
              const totalVotes = getTotalVotes();
              const percentage =
                totalVotes > 0 ? (((option.vote_count || 0) / totalVotes) * 100).toFixed(0) : 0;
              return (
                <div key={option.id || index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                      {option.option_text}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {poll.options.length > 3 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                +{poll.options.length - 3} more options
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
            No options available
          </p>
        )}

        {/* Stats */}
        <div
          className={`grid gap-2 pt-3 border-t border-purple-100 dark:border-gray-700 ${
            (getTotalVotes() > 0 ? 1 : 0) + (poll.view_count > 0 ? 1 : 0) + 1 === 3
              ? 'grid-cols-3'
              : (getTotalVotes() > 0 ? 1 : 0) + (poll.view_count > 0 ? 1 : 0) + 1 === 2
                ? 'grid-cols-2'
                : 'grid-cols-1'
          }`}
        >
          {getTotalVotes() > 0 && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Users size={14} className="text-purple-500 dark:text-purple-400" />
              </div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                {getTotalVotes()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Votes</p>
            </div>
          )}
          {poll.view_count > 0 && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <BarChart3 size={14} className="text-blue-500 dark:text-blue-400" />
              </div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                {poll.view_count}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Views</p>
            </div>
          )}
          <div className="flex items-center justify-center text-left">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 mr-2">
              <Clock size={13} className="text-amber-500 dark:text-amber-400" />
            </div>
            {(() => {
              const dateRaw = poll.poll_expires_at || poll.expires_at;
              const dateObj = dateRaw ? new Date(dateRaw) : null;
              return dateObj ? (
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold">
                    Expires
                  </span>
                  <span
                    className="text-[11px] font-semibold text-gray-900 dark:text-gray-100"
                    title={dateObj.toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  >
                    {dateObj.toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-[10px] font-mono text-gray-600 dark:text-gray-300">
                    {dateObj.toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">(no date)</span>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 flex items-center justify-end gap-2">
        <button
          onClick={() => onViewDetails && onViewDetails(poll)}
          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="View Details"
        >
          <Eye size={16} />
        </button>
        {/* Edit temporarily disabled – handled via details view or future edit flow */}
        <button
          onClick={() => onEdit && onEdit(poll)}
          className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/10 rounded-lg transition-colors"
          title="Edit Poll"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={() => onDelete && onDelete(poll)}
          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete Poll"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
});

PollCard.displayName = 'PollCard';
export default PollCard;
