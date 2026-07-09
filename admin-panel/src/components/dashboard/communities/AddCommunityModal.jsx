// src/components/dashboard/communities/AddCommunityModal.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Globe, Save, Hash, Tag } from 'lucide-react';
import topicsApi from '../../../api/topicsApi';
import TopicsPickerModal from '../../common/TopicsPickerModal';

const AddCommunityModal = React.memo(({ isOpen, onClose, onAddCommunity }) => {
  const { t } = useTranslation('communities');
  const [formData, setFormData] = useState({
    community_name: '',
    community_slug: '',
    community_description: '',
    is_active: true,
    community_image: null,
    topic_ids: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [showTopicsModal, setShowTopicsModal] = useState(false);

  // Fetch topics for dropdown
  useEffect(() => {
    if (isOpen) {
      fetchTopics();
    }
  }, [isOpen]);

  const fetchTopics = async () => {
    try {
      setLoadingTopics(true);
      const response = await topicsApi.getTopicsForSelectList();
      if (response?.data) {
        setTopics(response.data);
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: newValue,
      };

      // Auto-generate slug from community_name (always regenerate)
      if (name === 'community_name') {
        if (newValue) {
          updated.community_slug = newValue
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        } else {
          updated.community_slug = '';
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
        community_image: file,
      }));
    }
  };

  const handleTopicsSelected = (selectedIds) => {
    setFormData((prev) => ({
      ...prev,
      topic_ids: Array.isArray(selectedIds) ? selectedIds : [],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('community_name', formData.community_name);
      formDataToSend.append('community_slug', formData.community_slug);
      if (formData.community_description) {
        formDataToSend.append('community_description', formData.community_description);
      }
      // Send is_active as "active" or "inactive" string for backend transformation
      formDataToSend.append('is_active', formData.is_active ? 'active' : 'inactive');
      if (formData.community_image) {
        formDataToSend.append('community_image', formData.community_image);
      }
      if (formData.topic_ids && formData.topic_ids.length > 0) {
        formData.topic_ids.forEach((id) => {
          formDataToSend.append('topic_ids[]', id);
        });
      }

      await onAddCommunity(formDataToSend);
      setIsSubmitting(false);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error creating community:', err);
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      community_name: '',
      community_slug: '',
      community_description: '',
      is_active: true,
      community_image: null,
      topic_ids: [],
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90%] h-[90vh] flex flex-col border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        {/* Fixed Modal Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-purple-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Globe className="text-purple-600 dark:text-purple-400" size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 transition-colors">
                {t('addModal.title')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                {t('addModal.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <form
          id="add-community-form"
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarGutter: 'stable' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Community Name - Full width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <Globe size={14} className="text-purple-500 dark:text-purple-400" />
                    <span>{t('addModal.communityName')}</span>
                  </div>
                </label>
                <input
                  type="text"
                  name="community_name"
                  value={formData.community_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                  placeholder={t('addModal.communityNamePlaceholder')}
                  disabled={isSubmitting}
                />
                {/* Auto-generated Slug Display */}
                {formData.community_slug && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <Hash size={12} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('addModal.slug')}</span>
                    <code className="text-xs px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded border border-purple-200 dark:border-purple-700 font-mono">
                      {formData.community_slug}
                    </code>
                  </div>
                )}
              </div>

              {/* Description - Full width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  {t('common:description')}
                </label>
                <textarea
                  name="community_description"
                  value={formData.community_description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all resize-none"
                  placeholder={t('addModal.descriptionPlaceholder')}
                  disabled={isSubmitting}
                />
              </div>

              {/* Topics - Full width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <Tag size={14} className="text-purple-500 dark:text-purple-400" />
                    <span>{t('addModal.topics')}</span>
                  </div>
                </label>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {t('addModal.topicsHint')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowTopicsModal(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-600 text-[11px] font-medium text-purple-600 dark:text-purple-300 bg-purple-50/60 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                    disabled={isSubmitting || loadingTopics}
                  >
                    <Tag size={12} />
                    <span>{formData.topic_ids?.length ? t('addModal.editTopics') : t('addModal.selectTopics')}</span>
                  </button>
                </div>
                {formData.topic_ids && formData.topic_ids.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {formData.topic_ids.map((topicId) => {
                      // Find the topic name from the topics list
                      let topicName = '';
                      for (const parent of topics) {
                        if (parent.id === topicId) {
                          topicName = parent.name;
                          break;
                        }
                        if (parent.children) {
                          const child = parent.children.find((c) => c.id === topicId);
                          if (child) {
                            topicName = child.name;
                            break;
                          }
                        }
                      }
                      return (
                        <span
                          key={topicId}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full"
                        >
                          {topicName || t('addModal.topicFallback', { id: topicId })}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                topic_ids: prev.topic_ids.filter((id) => id !== topicId),
                              }));
                            }}
                            className="hover:text-purple-800 dark:hover:text-purple-300"
                            disabled={isSubmitting}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Community Image - Full width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  {t('addModal.communityImage')}
                </label>
                <input
                  type="file"
                  name="community_image"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all file:me-3 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 dark:file:bg-purple-900/30 dark:file:text-purple-400"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('addModal.maxFileSize')}
                </p>
              </div>

              {/* Is Active - Full width */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors">
                      {t('common:active')}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                      {t('addModal.activeHint')}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="sr-only peer"
                      disabled={isSubmitting}
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Topics Picker Modal */}
        <TopicsPickerModal
          isOpen={showTopicsModal}
          onClose={() => setShowTopicsModal(false)}
          initialSelectedIds={formData.topic_ids}
          onSave={handleTopicsSelected}
        />

        {/* Standardized Fixed Modal Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            disabled={isSubmitting}
          >
            {t('common:cancel')}
          </button>
          <button
            type="submit"
            form="add-community-form"
            disabled={isSubmitting}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{t('addModal.creating')}</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>{t('addModal.createCommunity')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

AddCommunityModal.displayName = 'AddCommunityModal';
export default AddCommunityModal;
