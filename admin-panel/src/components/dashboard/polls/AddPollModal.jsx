// src/components/dashboard/polls/AddPollModal.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, BarChart3, Save, Hash, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';

const AddPollModal = React.memo(({ isOpen, onClose, onAddPoll }) => {
  const { t } = useTranslation('polls');
  // Helper function to get default expiry date (tomorrow at 00:00)
  const getDefaultExpiryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Set to tomorrow
    tomorrow.setHours(0, 0, 0, 0); // Set to start of day (00:00)
    // Format for datetime-local: YYYY-MM-DDTHH:mm
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    poll_slug: '',
    poll_title: '',
    poll_description: '',
    poll_expires_at: '',
    poll_status: 'draft',
    is_featured: false,
    community_ids: [],
  });

  // Set default expiry date to tomorrow when modal opens
  useEffect(() => {
    if (isOpen) {
      // Always set to tomorrow (start of day) when modal opens
      setFormData((prev) => ({
        ...prev,
        poll_expires_at: getDefaultExpiryDate(),
      }));
    }
  }, [isOpen]);
  const [options, setOptions] = useState([
    { option_text: '', display_order: 0 },
    { option_text: '', display_order: 1 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setValidationError('');
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: newValue,
      };

      // Auto-generate slug from poll_title (always regenerate)
      if (name === 'poll_title') {
        if (newValue) {
          updated.poll_slug = newValue
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        } else {
          updated.poll_slug = '';
        }
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
        setValidationError(t('addPollModal.minOptionsError'));
        setIsSubmitting(false);
        return;
      }

      // Validate expiration date - must be at least tomorrow (not same day)
      let expiresAtDate = null;
      let pollExpiresAt = null;

      if (formData.poll_expires_at) {
        // Parse datetime-local value (which is in user's local timezone)
        // Format: YYYY-MM-DDTHH:mm (datetime-local format)
        expiresAtDate = new Date(formData.poll_expires_at);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow

        if (expiresAtDate < tomorrow) {
          setValidationError(t('addPollModal.expiryError'));
          setIsSubmitting(false);
          return;
        }

        // Convert datetime-local to ISO string preserving the exact date/time selected
        // Instead of using toISOString() which converts to UTC, we format it manually
        // to preserve the exact date/time the user selected (treating it as UTC)
        const [datePart, timePart] = formData.poll_expires_at.split('T');
        const [hours, minutes] = timePart.split(':');
        // Format as ISO string with UTC timezone (Z) - preserves exact date/time selected
        pollExpiresAt = `${datePart}T${hours}:${minutes}:00.000Z`;
      }

      const pollData = {
        poll_slug: formData.poll_slug,
        poll_title: formData.poll_title,
        poll_description: formData.poll_description,
        poll_expires_at: pollExpiresAt,
        poll_status: formData.poll_status,
        is_featured: formData.is_featured ? 'featured' : 'not_featured',
        options: validOptions,
      };

      await onAddPoll(pollData);
      setIsSubmitting(false);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error creating poll:', err);
      setIsSubmitting(false);
      // For unexpected errors, show a local message as well
      if (!validationError) {
        setValidationError(err.message || t('addPollModal.createFailedError'));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      poll_slug: '',
      poll_title: '',
      poll_description: '',
      poll_expires_at: getDefaultExpiryDate(),
      poll_status: 'draft',
      is_featured: false,
      community_ids: [],
    });
    setOptions([
      { option_text: '', display_order: 0 },
      { option_text: '', display_order: 1 },
    ]);
    setValidationError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Set minimum date to tomorrow (start of day) - polls cannot expire on same day
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Set to tomorrow
    tomorrow.setHours(0, 0, 0, 0); // Set to start of day (00:00)
    // Format for datetime-local: YYYY-MM-DDTHH:mm
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90%] h-[90vh] flex flex-col border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        {/* Fixed Modal Header */}
        <div className="shrink-0 px-5 py-4 border-b border-purple-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart3 className="text-purple-600 dark:text-purple-400" size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 transition-colors">
                {t('addPollModal.title')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                {t('addPollModal.subtitle')}
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
          id="add-poll-form"
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
                    <span>{t('addPollModal.pollTitleLabel')}</span>
                  </div>
                </label>
                <input
                  type="text"
                  name="poll_title"
                  value={formData.poll_title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                  placeholder={t('addPollModal.pollTitlePlaceholder')}
                  disabled={isSubmitting}
                />
                {/* Auto-generated Slug Display */}
                {formData.poll_slug && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <Hash size={12} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t('addPollModal.slug')}
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
                  {t('addPollModal.descriptionLabel')}
                </label>
                <textarea
                  name="poll_description"
                  value={formData.poll_description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all resize-none"
                  placeholder={t('addPollModal.descriptionPlaceholder')}
                  disabled={isSubmitting}
                />
              </div>

              {/* Expiration Date and Status - Side by side */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-purple-500 dark:text-purple-400" />
                    <span>{t('addPollModal.expirationDateLabel')}</span>
                  </div>
                </label>
                <input
                  type="datetime-local"
                  name="poll_expires_at"
                  value={formData.poll_expires_at}
                  onChange={handleInputChange}
                  required
                  min={getMinDate()}
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
                  <option value="draft">{t('addPollModal.statusDraft')}</option>
                  <option value="published">{t('addPollModal.statusPublished')}</option>
                </select>
              </div>

              {/* Is Featured - Full width */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors">
                      {t('addPollModal.featuredLabel')}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                      {t('addPollModal.featuredDescription')}
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
                  {t('addPollModal.optionsLabel')}
                </h4>
                <button
                  type="button"
                  onClick={addOption}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors text-xs font-medium"
                >
                  <Plus size={12} className="me-1" />
                  {t('addPollModal.addOption')}
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
                        placeholder={t('addPollModal.optionPlaceholder', { number: index + 1 })}
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t('addPollModal.optionsHint')}
              </p>
              {validationError && (
                <div className="mt-2 inline-flex items-start gap-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-700">
                  <AlertCircle size={12} className="mt-0.5 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Standardized Fixed Modal Footer */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
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
            form="add-poll-form"
            disabled={isSubmitting}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{t('addPollModal.creating')}</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>{t('addPollModal.createPoll')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

AddPollModal.displayName = 'AddPollModal';
export default AddPollModal;
