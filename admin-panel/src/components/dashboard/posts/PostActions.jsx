// src/components/dashboard/posts/PostActions.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit, Trash2, BarChart } from 'lucide-react';

const PostActions = React.memo(({
  post,
  onEdit,
  onDelete,
  onAnalytics,
  onUpdateStatus
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Calculate position to prevent overflow
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = 300; // Approximate dropdown height

        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          setDropdownPosition('top');
        } else {
          setDropdownPosition('bottom');
        }
      }
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = (action) => {
    setIsOpen(false);
    switch (action) {
      case 'edit':
        onEdit(post);
        break;
      case 'delete':
        onDelete(post.id);
        break;
      case 'analytics':
        onAnalytics(post);
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Actions Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        aria-label="Post actions"
      >
        <MoreHorizontal size={18} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-purple-100 dark:border-gray-700 z-[9999] animate-in fade-in duration-150 transition-colors ${dropdownPosition === 'top'
            ? 'bottom-full mb-1 slide-in-from-bottom-2'
            : 'top-full mt-1 slide-in-from-top-2'
          }`}>
          <div className="py-1">
            {/* Edit */}
            <button
              onClick={() => handleAction('edit')}
              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              <Edit size={16} className="mr-3" />
              Edit Post
            </button>

            {/* Analytics */}
            <button
              onClick={() => handleAction('analytics')}
              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              <BarChart size={16} className="mr-3" />
              View Analytics
            </button>

            <div className="border-t border-purple-100 dark:border-gray-700 my-1"></div>

            {/* Status Update Actions */}
            {onUpdateStatus && (
              <>
                {post.post_status !== 'published' && (
                  <button
                    onClick={() => {
                      onUpdateStatus(post.id, { post_status: 'published' });
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  >
                    Publish
                  </button>
                )}
                {post.post_status !== 'draft' && (
                  <button
                    onClick={() => {
                      onUpdateStatus(post.id, { post_status: 'draft' });
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                  >
                    Mark as Draft
                  </button>
                )}
                <button
                  onClick={() => {
                    onUpdateStatus(post.id, { is_featured: !post.is_featured });
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  {post.is_featured ? 'Remove Featured' : 'Mark as Featured'}
                </button>
                <div className="border-t border-purple-100 dark:border-gray-700 my-1"></div>
              </>
            )}

            {/* Delete */}
            <button
              onClick={() => handleAction('delete')}
              className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 size={16} className="mr-3" />
              Delete Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

PostActions.displayName = 'PostActions';
export default PostActions;