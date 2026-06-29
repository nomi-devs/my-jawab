// src/components/dashboard/topics/TopicsDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Hash, Calendar, FileText, Edit, Trash2, CheckCircle, XCircle, Loader2, Settings, FolderTree, List } from 'lucide-react';
import topicsApi from '../../../api/topicsApi';
import { normalizeMediaUrl } from '../../../utils/mediaUtils';
import ConfirmationModal from '../../common/ConfirmationModal';

const TopicsDetailsModal = ({ isOpen, onClose, topicId, topicData, onUpdateStatus, onEdit, onDelete }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [topicDetails, setTopicDetails] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState(null);
  const [subTopics, setSubTopics] = useState([]);
  const [loadingSubTopics, setLoadingSubTopics] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subTopicToDelete, setSubTopicToDelete] = useState(null);
  const [deletingSubTopic, setDeletingSubTopic] = useState(false);
  const [refreshSubTopics, setRefreshSubTopics] = useState(0);

  useEffect(() => {
    if (isOpen && topicId) {
      fetchTopicDetails();
    }
  }, [isOpen, topicId]);

  // Fetch sub-topics when sub-topics tab is active and topic is a parent
  useEffect(() => {
    if (isOpen && activeTab === 'subtopics' && topicId) {
      const topic = topicDetails || topicData;
      const isParentTopic = !topic?.parent_id || topic.parent_id === 0;

      if (isParentTopic) {
        // Always fetch fresh data when tab is active or when refresh is triggered
        fetchSubTopics();
      }
    }
  }, [isOpen, activeTab, topicId, refreshSubTopics]);

  // Normalize is_active to boolean (handles both string 'active'/'inactive' and boolean)
  const normalizeIsActive = (value) => {
    if (typeof value === 'boolean') return value;
    if (value === 'active' || value === true || value === 1) return true;
    if (value === 'inactive' || value === false || value === 0) return false;
    return false; // default to false
  };

  const fetchTopicDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await topicsApi.getTopic(topicId);
      const topicData = response.data;
      // Normalize is_active to boolean
      const normalizedTopic = {
        ...topicData,
        is_active: normalizeIsActive(topicData.is_active)
      };
      setTopicDetails(normalizedTopic);

      // If this is a parent topic (parent_id === 0), fetch or use children
      if ((normalizedTopic.parent_id === 0 || !normalizedTopic.parent_id) && normalizedTopic.children) {
        setSubTopics(normalizedTopic.children || []);
      } else {
        setSubTopics([]);
      }
    } catch (err) {
      console.error('Error fetching topic details:', err);
      setError('Failed to load topic details');
      // Use provided topicData as fallback
      if (topicData) {
        const normalizedTopic = {
          ...topicData,
          topic_name: topicData.topic_name || topicData.name,
          topic_description: topicData.topic_description || topicData.description,
          topic_slug: topicData.topic_slug || topicData.slug,
          is_active: normalizeIsActive(topicData.is_active),
          parent_id: topicData.parent_id || 0
        };
        setTopicDetails(normalizedTopic);
        if ((normalizedTopic.parent_id === 0 || !normalizedTopic.parent_id) && normalizedTopic.children) {
          setSubTopics(normalizedTopic.children || []);
        } else {
          setSubTopics([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSubTopics = async () => {
    if (!topicId) return;

    try {
      setLoadingSubTopics(true);
      // Fetch topics with parent_id = topicId
      const response = await topicsApi.getTopics({
        parent_id: topicId,
        limit: 100,
        sort_by: 'created_at',
        sort_order: 'ASC'
      });

      if (response && response.data && response.data.data) {
        setSubTopics(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching sub-topics:', err);
      // If API call fails, use children from topicDetails if available
      if (topicDetails && topicDetails.children) {
        setSubTopics(topicDetails.children);
      }
    } finally {
      setLoadingSubTopics(false);
    }
  };

  const handleDeleteSubTopic = async () => {
    if (!subTopicToDelete) return;

    try {
      setDeletingSubTopic(true);
      setError(null);

      // Call the delete API
      await topicsApi.deleteTopic(subTopicToDelete.id);

      // Remove the sub-topic from the local state
      setSubTopics(prev => prev.filter(st => st.id !== subTopicToDelete.id));

      // Refresh the sub-topics list to ensure consistency
      await fetchSubTopics();

      // Also call the parent's onDelete callback if provided
      if (onDelete) {
        onDelete(subTopicToDelete.id);
      }

      // Close the confirmation modal
      setShowDeleteConfirm(false);
      setSubTopicToDelete(null);
    } catch (err) {
      console.error('Error deleting sub-topic:', err);
      const errorMsg = err.response?.data?.message || 'Failed to delete sub-topic. Please try again.';
      setError(errorMsg);
      // Don't close the modal on error - let user see the error message
      // The error will be displayed in the confirmation modal message
    } finally {
      setDeletingSubTopic(false);
    }
  };

  const handleSubTopicStatusChange = async (subTopicId, newStatus) => {
    try {
      setError(null);
      // Convert boolean to 'active'/'inactive' string
      const status = newStatus ? 'active' : 'inactive';
      await topicsApi.updateTopicStatus(subTopicId, { is_active: status });

      // Update the specific sub-topic in the local state
      setSubTopics(prev => prev.map(st =>
        st.id === subTopicId
          ? { ...st, is_active: newStatus }
          : st
      ));

      // Refresh the sub-topics list to ensure consistency
      await fetchSubTopics();

      // Call parent callback if provided
      if (onUpdateStatus) {
        onUpdateStatus(subTopicId, newStatus);
      }
    } catch (err) {
      console.error('Error updating sub-topic status:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update sub-topic status';
      setError(errorMsg);
      // Refresh the list to get the correct state
      await fetchSubTopics();
    }
  };

  const handleSubTopicEdit = (subTopic) => {
    // Call the parent's onEdit handler
    if (onEdit) {
      onEdit(subTopic);
    }
    // Refresh sub-topics after a short delay to allow edit modal to open
    // Then refresh again when user comes back to this modal
    setTimeout(() => {
      if (activeTab === 'subtopics' && isOpen) {
        fetchSubTopics();
      }
    }, 500);
  };

  // Refresh sub-topics when tab is clicked or when modal regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isOpen && activeTab === 'subtopics' && topicId) {
        // Refresh when page becomes visible (user might have closed edit modal)
        fetchSubTopics();
      }
    };

    const handleFocus = () => {
      if (isOpen && activeTab === 'subtopics' && topicId) {
        // Refresh when window regains focus
        fetchSubTopics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isOpen, activeTab, topicId]);

  const handleStatusChange = async (newStatus) => {
    if (!topicId) return;

    try {
      setUpdatingStatus(true);
      // Convert boolean to 'active'/'inactive' string
      const status = newStatus ? 'active' : 'inactive';
      const updateData = { is_active: status };
      const response = await topicsApi.updateTopicStatus(topicId, updateData);

      // Update local state immediately
      setTopicDetails(prev => ({
        ...prev,
        is_active: newStatus // Store as boolean for consistency
      }));

      // Call parent callback if provided to update parent component
      if (onUpdateStatus) {
        onUpdateStatus(topicId, newStatus);
      }

      // Refresh the modal data from server to ensure consistency
      await fetchTopicDetails();
    } catch (err) {
      console.error('Error updating topic status:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update topic status';
      setError(errorMsg);
      // Refresh to get correct state on error
      await fetchTopicDetails();
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  const topic = topicDetails || topicData;
  const isParentTopic = topic && (!topic.parent_id || topic.parent_id === 0);
  // Normalize is_active to boolean for consistent comparison
  const isActive = topic ? normalizeIsActive(topic.is_active) : false;

  const tabs = [
    { id: 'details', label: 'Details', icon: Hash },
    ...(isParentTopic ? [{ id: 'subtopics', label: 'Sub-topics', icon: List }] : [])
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90%] h-[90vh] flex flex-col overflow-hidden animate-slideInFromTop">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-100 dark:border-gray-700">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {topic && (
              <>
                {topic.topic_image && topic.parent_id === 0 ? (
                  <img
                    src={normalizeMediaUrl(topic.topic_image)}
                    alt={topic.topic_name || topic.name}
                    className="w-10 h-10 rounded-lg object-cover border border-purple-200 dark:border-gray-600 flex-shrink-0"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-white flex-shrink-0 ${(topic.topic_image && topic.parent_id === 0) ? 'hidden' : ''}`}>
                  <Hash size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 truncate">
                    {loading ? 'Loading...' : (topic.topic_name || topic.name || 'Topic Details')}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${isActive
                        ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                        : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700'
                      }`}>
                      <span className={`w-1 h-1 rounded-full mr-1 ${isActive ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-500 dark:bg-gray-400'
                        }`}></span>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30">
                      {topic.parent_id && topic.parent_id > 0 ? 'Subtopic' : 'Category'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ml-3"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-purple-100 dark:border-gray-700 bg-purple-50/50 dark:bg-gray-700/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // Refresh sub-topics when switching to sub-topics tab
                  if (tab.id === 'subtopics' && topicId) {
                    fetchSubTopics();
                  }
                }}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors relative ${activeTab === tab.id
                    ? 'text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800'
                    : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                  }`}
              >
                <Icon size={14} />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
          {loading && !topic ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 size={24} className="animate-spin text-purple-600 dark:text-purple-400" />
            </div>
          ) : error && !topic ? (
            <div className="p-8 text-center">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          ) : (
            <>
              {/* Details Tab */}
              {activeTab === 'details' && topic && (
                <div className="px-6 py-5 space-y-5">
                  {/* Topic Image - Only for parent topics */}
                  {topic.topic_image && (!topic.parent_id || topic.parent_id === 0) && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Topic Image</h3>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <img
                          src={normalizeMediaUrl(topic.topic_image)}
                          alt={topic.topic_name || topic.name}
                          className="w-full max-w-md h-auto rounded-lg border border-purple-200 dark:border-gray-600"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Description</h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {topic.topic_description || topic.description || 'No description'}
                      </p>
                    </div>
                  </div>

                  {/* Topic Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Slug</h3>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                        <p className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                          {topic.topic_slug || topic.slug || 'No slug'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Type</h3>
                      <div className="flex items-center gap-2">
                        <FolderTree size={14} className="text-purple-500" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {topic.parent_id && topic.parent_id > 0 ? 'Subtopic' : 'Category'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Parent Topic</h3>
                      <div className="text-gray-700 dark:text-gray-300">
                        {topic.parent_name ? (
                          <span className="font-medium text-purple-600 dark:text-purple-400">{topic.parent_name}</span>
                        ) : topic.parent_id && topic.parent_id > 0 ? (
                          <span className="text-gray-500 dark:text-gray-400">Has Parent Topic</span>
                        ) : (
                          <span className="text-purple-600 dark:text-purple-400 font-medium">Root Category</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Created</h3>
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Calendar size={18} />
                        <span>{formatDate(topic.created_at)}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Sub-topics Tab - Only for parent topics */}
              {activeTab === 'subtopics' && topic && isParentTopic && (
                <div className="px-6 py-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      Sub-topics of "{topic.topic_name || topic.name}"
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {subTopics.length > 0
                        ? `${subTopics.length} sub-topic${subTopics.length !== 1 ? 's' : ''} found`
                        : 'No sub-topics found'}
                    </p>
                  </div>

                  {loadingSubTopics ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 size={24} className="animate-spin text-purple-600 dark:text-purple-400" />
                    </div>
                  ) : subTopics.length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-gray-700 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-purple-50 dark:bg-gray-700/50 border-b border-purple-100 dark:border-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Slug</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Description</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Created</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-purple-100 dark:divide-gray-700">
                            {subTopics.map((subTopic) => {
                              const isActiveRow = normalizeIsActive(subTopic.is_active);
                              return (
                                <tr
                                  key={subTopic.id}
                                  className="hover:bg-purple-50/50 dark:hover:bg-gray-700/30 transition-colors"
                                >
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <Hash size={14} className="text-purple-500" />
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {subTopic.topic_name || subTopic.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                      {subTopic.topic_slug || subTopic.slug || 'N/A'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 max-w-xs">
                                      {subTopic.topic_description || subTopic.description || 'No description'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isActiveRow
                                        ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                      }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActiveRow
                                          ? 'bg-green-500 dark:bg-green-400'
                                          : 'bg-gray-500 dark:bg-gray-400'
                                        }`}></span>
                                      {isActiveRow ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      {formatDate(subTopic.created_at)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                      {/* Edit Button */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSubTopicEdit(subTopic);
                                        }}
                                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                        title="Edit sub-topic"
                                      >
                                        <Edit size={16} />
                                      </button>

                                      {/* Toggle Active/Inactive Switch */}
                                      <label
                                        className="relative inline-flex items-center cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                        title={isActiveRow ? 'Deactivate sub-topic' : 'Activate sub-topic'}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isActiveRow}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            handleSubTopicStatusChange(subTopic.id, !isActiveRow);
                                          }}
                                          className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                      </label>

                                      {/* Delete Button */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSubTopicToDelete(subTopic);
                                          setShowDeleteConfirm(true);
                                        }}
                                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        title="Delete sub-topic"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                      <FolderTree size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">No sub-topics found</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        This parent topic doesn't have any child topics yet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Standardized Fixed Modal Footer */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
          <div className="flex items-center gap-3">
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(topicId);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-xs font-medium"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(topic);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-xs font-medium"
              >
                <Edit size={16} />
                <span>Edit</span>
              </button>
            )}
            {/* Status Toggle in Footer */}
            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-gray-200 dark:border-gray-700">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => {
                    if (!updatingStatus) {
                      handleStatusChange(e.target.checked);
                    }
                  }}
                  disabled={updatingStatus}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
              </label>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {isActive ? 'Active' : 'Inactive'}
              </span>
              {updatingStatus && <Loader2 size={14} className="animate-spin text-purple-600 ml-1" />}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal for Sub-topics */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSubTopicToDelete(null);
          setError(null);
        }}
        onConfirm={handleDeleteSubTopic}
        type="danger"
        title="Delete Sub-topic"
        message={
          error
            ? error
            : subTopicToDelete
              ? `Are you sure you want to permanently delete "${subTopicToDelete.topic_name || subTopicToDelete.name}"? This action cannot be undone.`
              : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deletingSubTopic}
      />
    </div>
  );
};

export default TopicsDetailsModal;

