// src/components/dashboard/polls/EditPollModal.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, BarChart3, Save, Hash, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';

const EditPollModal = React.memo(({ isOpen, onClose, poll, onUpdatePoll }) => {
  const { t } = useTranslation('polls');
  const [formData, setFormData] = useState({
    poll_slug: '',
    poll_title: '',
    poll_description: '',
    poll_expires_at: '',
    poll_status: 'draft',
    is_featured: false,
  });

  const [options, setOptions] = useState([]);
  const [initialOptions, setInitialOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Initialize form when poll data changes or modal opens
  useEffect(() => {
    if (isOpen && poll) {
      const expiresAt = poll.poll_expires_at || poll.expires_at;
      let formattedDate = '';

      if (expiresAt) {
        const date = new Date(expiresAt);
        // Format for datetime-local: YYYY-MM-DDTHH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      setFormData({
        poll_slug: poll.poll_slug || poll.slug || '',
        poll_title: poll.poll_title || poll.title || '',
        poll_description: poll.poll_description || poll.description || '',
        poll_expires_at: formattedDate,
        poll_status: poll.poll_status || poll.status || 'draft',
        is_featured: !!poll.is_featured,
      });

      const pollOptions = poll.options || [];
      const mappedOptions = pollOptions.map((opt, index) => ({
        id: opt.id,
        option_text: opt.option_text || opt.text || '',
        display_order: opt.display_order ?? index,
      }));

      setOptions(mappedOptions);
      setInitialOptions(JSON.parse(JSON.stringify(mappedOptions))); // Deep copy for change detection
    }
  }, [isOpen, poll]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setValidationError('');
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: newValue,
      };

      // Auto-generate slug from poll_title if it was changed
      if (name === 'poll_title') {
        updated.poll_slug = newValue
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      return updated;
    });
  };

  const handleOptionChange = (index, value) => {
    setValidationError('');
    const newOptions = [...options];
    newOptions[index].option_text = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { option_text: '', display_order: options.length }]);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      // Reorder display_order
      newOptions.forEach((opt, idx) => {
        opt.display_order = idx;
      });
      setOptions(newOptions);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationError('');

    try {
      // Validate options
      const validOptions = options.filter((opt) => opt.option_text.trim() !== '');
      if (validOptions.length < 2) {
        setValidationError(t('editPollModal.minOptionsError'));
        setIsSubmitting(false);
        return;
      }

      let pollExpiresAt = null;
      if (formData.poll_expires_at) {
        // Preserving the selected local time and treating it as UTC for simplicity in this admin panel
        const [datePart, timePart] = formData.poll_expires_at.split('T');
        const [hours, minutes] = timePart.split(':');
        pollExpiresAt = `${datePart}T${hours}:${minutes}:00.000Z`;
      }

      const updateData = {
        poll_slug: formData.poll_slug,
        poll_title: formData.poll_title,
        poll_description: formData.poll_description,
        poll_expires_at: pollExpiresAt,
        poll_status: formData.poll_status,
        is_featured: formData.is_featured ? 'featured' : 'not_featured',
        options: validOptions.map((opt) => ({
          ...(opt.id && { id: opt.id }), // Include ID only if it exists
          option_text: opt.option_text,
          display_order: opt.display_order,
        })),
      };

      await onUpdatePoll(poll.id, updateData);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Error updating poll:', err);
      setIsSubmitting(false);
      setValidationError(
        err.response?.data?.message || err.message || t('editPollModal.updateFailedError'),
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[60] animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90%] h-[90vh] flex flex-col border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        {/* Fixed Modal Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-purple-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart3 className="text-purple-600 dark:text-purple-400" size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 transition-colors">
                {t('editPollModal.title')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                {t('editPollModal.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <form
          id="edit-poll-form"
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarGutter: 'stable' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Poll Title - Full width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 size={14} className="text-purple-500 dark:text-purple-400" />
                    <span>{t('editPollModal.pollTitleLabel')}</span>
                  </div>
                </label>
                <input
                  type="text"
                  name="poll_title"
                  value={formData.poll_title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                  placeholder={t('editPollModal.pollTitlePlaceholder')}
                  disabled={isSubmitting}
                />
                {/* Slug Display */}
                {formData.poll_slug && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <Hash size={12} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t('editPollModal.slug')}
                    </span>
                    <code className="text-xs px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded border border-purple-200 dark:border-purple-700 font-mono">
                      {formData.poll_slug}
                    </code>
                  </div>
                )}
              </div>

              {/* Description - Full width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  {t('editPollModal.descriptionLabel')}
                </label>
                <textarea
                  name="poll_description"
                  value={formData.poll_description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all resize-none"
                  placeholder={t('editPollModal.descriptionPlaceholder')}
                  disabled={isSubmitting}
                />
              </div>

              {/* Expiration Date and Status */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-purple-500 dark:text-purple-400" />
                    <span>{t('editPollModal.expirationDateLabel')}</span>
                  </div>
                </label>
                <input
                  type="datetime-local"
                  name="poll_expires_at"
                  value={formData.poll_expires_at}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  {t('common:status')}
                </label>
                <select
                  name="poll_status"
                  value={formData.poll_status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                  disabled={isSubmitting}
                >
                  <option value="draft">{t('editPollModal.statusDraft')}</option>
                  <option value="published">{t('editPollModal.statusPublished')}</option>
                  <option value="ended">{t('editPollModal.statusEnded')}</option>
                </select>
              </div>

              {/* Is Featured */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors">
                      {t('editPollModal.featuredLabel')}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                      {t('editPollModal.featuredDescription')}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleInputChange}
                      className="sr-only peer"
                      disabled={isSubmitting}
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Poll Options */}
            <div className="mt-4 pt-4 border-t border-purple-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-100 transition-colors">
                  {t('editPollModal.optionsLabel')}
                </h4>
                <button
                  type="button"
                  onClick={addOption}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors text-xs font-medium"
                >
                  <Plus size={12} className="me-1" />
                  {t('editPollModal.addOption')}
                </button>
              </div>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={option.option_text}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={t('editPollModal.optionPlaceholder', { number: index + 1 })}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                        disabled={isSubmitting}
                      />
                    </div>
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        disabled={isSubmitting}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {validationError && (
                <div className="mt-2 inline-flex items-start gap-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-700">
                  <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Standardized Fixed Modal Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            disabled={isSubmitting}
          >
            {t('common:cancel')}
          </button>
          <button
            type="submit"
            form="edit-poll-form"
            disabled={isSubmitting}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{t('editPollModal.saving')}</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>{t('editPollModal.saveChanges')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

EditPollModal.displayName = 'EditPollModal';
export default EditPollModal;
