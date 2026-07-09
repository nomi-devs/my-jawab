// src/components/dashboard/topics/AddTopicModal.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Hash, Save } from 'lucide-react';
import topicsApi from '../../../api/topicsApi';

const AddTopicModal = React.memo(({ isOpen, onClose, onAddTopic }) => {
  const { t } = useTranslation('topics');
  const [formData, setFormData] = useState({
    topic_name: '',
    topic_slug: '',
    topic_description: '',
    parent_id: 0,
    is_active: true,
    topic_image: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentTopics, setParentTopics] = useState([]);
  const [loadingParents, setLoadingParents] = useState(false);

  // Fetch parent topics (categories) when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchParentTopics();
    }
  }, [isOpen]);

  const fetchParentTopics = async () => {
    setLoadingParents(true);
    try {
      const response = await topicsApi.getParentTopics({ limit: 100 });
      if (response && response.data && response.data.data) {
        // API returns only parent topics (parent_id = 0)
        setParentTopics(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching parent topics:', err);
    } finally {
      setLoadingParents(false);
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
      const status = formData.is_active ? 'active' : 'inactive';
      formDataToSend.append('is_active', status);
      // Only allow image upload for parent topics (parent_id === 0 or undefined)
      if (formData.topic_image && (!formData.parent_id || formData.parent_id === 0)) {
        formDataToSend.append('topic_image', formData.topic_image);
      }

      await onAddTopic(formDataToSend);
      setIsSubmitting(false);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error creating topic:', err);
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      topic_name: '',
      topic_slug: '',
      topic_description: '',
      parent_id: 0,
      is_active: true,
      topic_image: null,
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
        {/* Modal Header */}
        <div className="shrink-0 px-5 py-4 border-b border-purple-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Hash className="text-purple-600 dark:text-purple-400" size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 transition-colors">
                {t('addTopicModal.title')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                {t('addTopicModal.subtitle')}
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
          id="add-topic-form"
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarGutter: 'stable' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Topic Name - Full width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <Hash size={14} className="text-purple-500 dark:text-purple-400" />
                    <span>{t('addTopicModal.topicName')}</span>
                  </div>
                </label>
                <input
                  type="text"
                  name="topic_name"
                  value={formData.topic_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                  placeholder={t('addTopicModal.topicNamePlaceholder')}
                  disabled={isSubmitting}
                />
                {/* Auto-generated Slug Display */}
                {formData.topic_slug && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <Hash size={12} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t('addTopicModal.slug')}
                    </span>
                    <code className="text-xs px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded border border-purple-200 dark:border-purple-700 font-mono">
                      {formData.topic_slug}
                    </code>
                  </div>
                )}
              </div>

              {/* Parent Topic (Category) - Full width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <Hash size={14} className="text-purple-500 dark:text-purple-400" />
                    <span>{t('addTopicModal.parentTopic')}</span>
                  </div>
                </label>
                <select
                  name="parent_id"
                  value={formData.parent_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                  disabled={isSubmitting || loadingParents}
                >
                  <option value={0}>{t('addTopicModal.parentTopicNone')}</option>
                  {parentTopics.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.topic_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('addTopicModal.parentTopicHelp')}
                </p>
              </div>

              {/* Description - Full width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  {t('common:description')}
                </label>
                <textarea
                  name="topic_description"
                  value={formData.topic_description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all resize-none"
                  placeholder={t('addTopicModal.descriptionPlaceholder')}
                  disabled={isSubmitting}
                />
              </div>

              {/* Topic Image - Full width - Only for parent topics */}
              {(!formData.parent_id || formData.parent_id === 0) && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                    {t('addTopicModal.topicImage')}
                  </label>
                  <input
                    type="file"
                    name="topic_image"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all file:me-3 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 dark:file:bg-purple-900/30 dark:file:text-purple-400"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('addTopicModal.topicImageHelp')}
                  </p>
                </div>
              )}

              {/* Is Active - Full width */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors">
                      {t('common:active')}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                      {t('addTopicModal.activeHelp')}
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
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 rtl:peer-checked:after:-translate-x-full"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs font-medium transition-colors"
            disabled={isSubmitting}
          >
            {t('common:cancel')}
          </button>
          <button
            type="submit"
            form="add-topic-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white rounded-lg transition-all text-xs font-semibold shadow-md active:scale-95"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('addTopicModal.adding')}</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{t('addTopicModal.addTopic')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

AddTopicModal.displayName = 'AddTopicModal';
export default AddTopicModal;
