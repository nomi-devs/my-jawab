// src/components/dashboard/topics/EditTopicModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { X, Hash, Save } from 'lucide-react';
import ConfirmationModal from '../../common/ConfirmationModal';
import topicsApi from '../../../api/topicsApi';

const EditTopicModal = React.memo(({ isOpen, onClose, topic, onSave }) => {
  const [formData, setFormData] = useState({
    topic_name: '',
    topic_slug: '',
    topic_description: '',
    parent_id: 0,
    is_active: true,
    topic_image: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [changes, setChanges] = useState([]);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [parentTopics, setParentTopics] = useState([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  // Fetch parent topics when modal opens (only if topic is not a parent)
  useEffect(() => {
    if (isOpen && topic && topic.parent_id !== 0) {
      fetchParentTopics();
    }
  }, [isOpen, topic]);

  const fetchParentTopics = async () => {
    setLoadingParents(true);
    try {
      const response = await topicsApi.getParentTopics({ limit: 100 });
      if (response && response.data && response.data.data) {
        // API returns only parent topics (parent_id = 0), exclude current topic
        const parents = response.data.data.filter((t) => t.id !== topic?.id);
        setParentTopics(parents);
      }
    } catch (err) {
      console.error('Error fetching parent topics:', err);
    } finally {
      setLoadingParents(false);
    }
  };

  // Initialize form with topic data
  useEffect(() => {
    if (topic) {
      // Ensure is_active is properly converted to boolean
      let isActive = true; // default
      if (topic.is_active !== undefined) {
        // Handle both boolean and string values from API
        if (typeof topic.is_active === 'boolean') {
          isActive = topic.is_active;
        } else if (
          topic.is_active === 'active' ||
          topic.is_active === true ||
          topic.is_active === 1
        ) {
          isActive = true;
        } else if (
          topic.is_active === 'inactive' ||
          topic.is_active === false ||
          topic.is_active === 0
        ) {
          isActive = false;
        }
      }

      const initialData = {
        topic_name: topic.topic_name || '',
        topic_slug: topic.topic_slug || '',
        topic_description: topic.topic_description || '',
        parent_id: topic.parent_id || 0,
        is_active: isActive,
        topic_image: null, // Don't pre-fill image, user needs to upload new one if changing
      };

      setFormData(initialData);
      setChanges([]);
    }
  }, [topic]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => {
      const oldValue = prev[name];

      // Track changes
      if (oldValue !== newValue && !changes.includes(name)) {
        setChanges((prevChanges) => [...prevChanges, name]);
      }

      const updated = {
        ...prev,
        [name]: newValue,
      };

      // Auto-generate slug from topic_name (always regenerate)
      if (name === 'topic_name') {
        if (newValue) {
          updated.topic_slug = newValue
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        } else {
          updated.topic_slug = '';
        }
        if (!changes.includes('topic_slug')) {
          setChanges((prevChanges) => [...prevChanges, 'topic_slug']);
        }
      }

      return updated;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        topic_image: file,
      }));
      if (!changes.includes('topic_image')) {
        setChanges((prev) => [...prev, 'topic_image']);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('topic_name', formData.topic_name);
      formDataToSend.append('topic_slug', formData.topic_slug);
      if (formData.topic_description) {
        formDataToSend.append('topic_description', formData.topic_description);
      }
      formDataToSend.append('parent_id', formData.parent_id || 0);
      // Convert boolean to 'active'/'inactive' string
      // Handle both boolean and string values
      const isActiveValue = formData.is_active;
      const status =
        isActiveValue === true || isActiveValue === 'active' || isActiveValue === 1
          ? 'active'
          : 'inactive';
      formDataToSend.append('is_active', status);
      // Only allow image upload for parent topics (parent_id === 0 or undefined)
      if (formData.topic_image && (!formData.parent_id || formData.parent_id === 0)) {
        formDataToSend.append('topic_image', formData.topic_image);
      }

      await onSave(topic.id, formDataToSend);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Error updating topic:', err);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (changes.length > 0) {
      setShowDiscardConfirm(true);
      return;
    }

    resetForm();
    onClose();
  };

  const resetForm = () => {
    if (topic) {
      // Ensure is_active is properly converted to boolean
      let isActive = true; // default
      if (topic.is_active !== undefined) {
        // Handle both boolean and string values from API
        if (typeof topic.is_active === 'boolean') {
          isActive = topic.is_active;
        } else if (
          topic.is_active === 'active' ||
          topic.is_active === true ||
          topic.is_active === 1
        ) {
          isActive = true;
        } else if (
          topic.is_active === 'inactive' ||
          topic.is_active === false ||
          topic.is_active === 0
        ) {
          isActive = false;
        }
      }

      setFormData({
        topic_name: topic.topic_name || '',
        topic_slug: topic.topic_slug || '',
        topic_description: topic.topic_description || '',
        parent_id: topic.parent_id || 0,
        is_active: isActive,
        topic_image: null,
      });
    }
    setChanges([]);
  };

  const confirmDiscard = useCallback(() => {
    resetForm();
    setShowDiscardConfirm(false);
    onClose();
  }, [onClose]);

  if (!isOpen || !topic) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90%] h-[90vh] flex flex-col border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-purple-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 transition-colors">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Hash className="text-purple-600 dark:text-purple-400" size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 transition-colors">
                Edit Topic
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                Modify topic details and settings
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {changes.length > 0 && (
              <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-full transition-colors">
                {changes.length} change{changes.length !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <form
          id="edit-topic-form"
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarGutter: 'stable' }}>
            {/* Basic Information Section */}
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3 transition-colors">
              Basic Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Topic Name - Full width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  <div className="flex items-center space-x-1.5">
                    <Hash size={14} className="text-purple-500 dark:text-purple-400" />
                    <span>Topic Name *</span>
                  </div>
                </label>
                <input
                  type="text"
                  name="topic_name"
                  value={formData.topic_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                  placeholder="Enter topic name"
                  disabled={isSubmitting}
                />
                {/* Auto-generated Slug Display */}
                {formData.topic_slug && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <Hash size={12} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Slug:</span>
                    <code className="text-xs px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded border border-purple-200 dark:border-purple-700 font-mono">
                      {formData.topic_slug}
                    </code>
                  </div>
                )}
              </div>

              {/* Parent Topic (Category) - Full width - Only show if topic is not a parent */}
              {topic && topic.parent_id !== 0 && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    <div className="flex items-center space-x-1.5">
                      <Hash size={14} className="text-purple-500 dark:text-purple-400" />
                      <span>Parent Topic (Category)</span>
                    </div>
                  </label>
                  <select
                    name="parent_id"
                    value={formData.parent_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                    disabled={isSubmitting || loadingParents}
                  >
                    <option value={0}>None (Main Category)</option>
                    {parentTopics.map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.topic_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Select a parent topic to create a subtopic, or leave as "None" to create a main
                    category
                  </p>
                </div>
              )}

              {/* Show info message if topic is a parent/category */}
              {topic && topic.parent_id === 0 && (
                <div className="md:col-span-2">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Hash size={14} className="text-purple-600 dark:text-purple-400" />
                      <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        This is a parent category topic. Parent topics cannot have a parent
                        category.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description - Full width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  Description
                </label>
                <textarea
                  name="topic_description"
                  value={formData.topic_description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all resize-none"
                  placeholder="Describe this topic in detail..."
                  disabled={isSubmitting}
                />
              </div>

              {/* Topic Image - Full width - Only for parent topics */}
              {(!formData.parent_id || formData.parent_id === 0) && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    Topic Image
                  </label>
                  {currentImageUrl && (
                    <div className="mb-2">
                      <img
                        src={currentImageUrl}
                        alt={topic.topic_name}
                        className="w-20 h-20 object-cover rounded-lg border border-purple-200 dark:border-gray-600"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    name="topic_image"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all file:mr-3 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 dark:file:bg-purple-900/30 dark:file:text-purple-400"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Maximum file size: 10MB. Only parent topics can have images.
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex-shrink-0 flex flex-col gap-2 px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs font-medium transition-colors"
              disabled={isSubmitting}
            >
              Discard
            </button>
            <button
              type="submit"
              form="edit-topic-form"
              disabled={isSubmitting || changes.length === 0}
              className="flex items-center gap-2 px-6 py-2 purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white rounded-lg transition-all text-xs font-semibold shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Update Topic</span>
                </>
              )}
            </button>
          </div>
          {changes.length > 0 && (
            <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              <span className="flex-shrink-0">Changes detected:</span>
              <div className="flex flex-wrap gap-1">
                {changes.map((change, index) => (
                  <span
                    key={`${change}-${index}`}
                    className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-700 text-purple-600 dark:text-purple-400 rounded transition-colors"
                  >
                    {change}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Discard Changes Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={confirmDiscard}
        type="warning"
        title="Discard Changes"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmText="Discard"
        cancelText="Cancel"
      />
    </div>
  );
});

EditTopicModal.displayName = 'EditTopicModal';
export default EditTopicModal;
