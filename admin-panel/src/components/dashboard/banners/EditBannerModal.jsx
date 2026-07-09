// src/components/dashboard/banners/EditBannerModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Image as ImageIcon, Save } from 'lucide-react';
import BannerForm from './BannerForm';

const toDatetimeLocal = (value) => {
  if (!value) return '';
  try {
    const d = new Date(value);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

const EditBannerModal = ({ isOpen, onClose, banner, onSave }) => {
  const { t } = useTranslation('banners');
  const [formData, setFormData] = useState({
    banner_title: '',
    banner_description: '',
    banner_image: null,
    banner_link: '',
    banner_type: 'promotion',
    target_countries: '',
    target_topic_ids: '',
    target_subscription_ids: '',
    excluded_countries: '',
    excluded_topic_ids: '',
    excluded_subscription_ids: '',
    valid_from: '',
    valid_until: '',
    display_order: 0,
    is_active: true,
  });
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (banner) {
      setFormData({
        banner_title: banner.banner_title || '',
        banner_description: banner.banner_description || '',
        banner_image: null,
        banner_link: banner.banner_link || '',
        banner_type: banner.banner_type || 'promotion',
        target_countries: banner.target_countries || '',
        target_topic_ids: banner.target_topic_ids || '',
        target_subscription_ids: banner.target_subscription_ids || '',
        excluded_countries: banner.excluded_countries || '',
        excluded_topic_ids: banner.excluded_topic_ids || '',
        excluded_subscription_ids: banner.excluded_subscription_ids || '',
        valid_from: toDatetimeLocal(banner.valid_from),
        valid_until: toDatetimeLocal(banner.valid_until),
        display_order: banner.display_order ?? 0,
        is_active: banner.is_active === true || banner.is_active === 1,
      });
      setExistingImageUrl(banner.banner_image || null);
      setError('');
    }
  }, [banner]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const fd = new FormData();
      if (formData.banner_image instanceof File) {
        fd.append('banner_image', formData.banner_image);
      }
      fd.append('banner_title', formData.banner_title || '');
      fd.append('banner_description', formData.banner_description || '');
      fd.append('banner_link', formData.banner_link || '');
      fd.append('banner_type', formData.banner_type);
      fd.append('target_countries', formData.target_countries || '');
      fd.append('target_topic_ids', formData.target_topic_ids || '');
      fd.append('target_subscription_ids', formData.target_subscription_ids || '');
      fd.append('excluded_countries', formData.excluded_countries || '');
      fd.append('excluded_topic_ids', formData.excluded_topic_ids || '');
      fd.append('excluded_subscription_ids', formData.excluded_subscription_ids || '');
      if (formData.valid_from) fd.append('valid_from', new Date(formData.valid_from).toISOString());
      if (formData.valid_until)
        fd.append('valid_until', new Date(formData.valid_until).toISOString());
      fd.append('display_order', String(formData.display_order || 0));
      fd.append('is_active', formData.is_active ? 'active' : 'inactive');

      await onSave(banner.id, fd);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('editBannerModal.updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!isSubmitting) onClose();
  }, [isSubmitting, onClose]);

  if (!isOpen || !banner) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[9999] animate-in fade-in duration-200 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-purple-100 dark:border-gray-700 flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-purple-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ImageIcon className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
                {t('editBannerModal.title')}
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('editBannerModal.subtitleWithId', { id: banner.id })}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarGutter: 'stable' }}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          <BannerForm
            formData={formData}
            setFormData={setFormData}
            existingImageUrl={existingImageUrl}
            isSubmitting={isSubmitting}
            formId="edit-banner-form"
            onSubmit={handleSubmit}
          />
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs font-medium"
          >
            {t('common:cancel')}
          </button>
          <button
            type="submit"
            form="edit-banner-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm hover:shadow-md active:scale-95 transition-all"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('editBannerModal.saving')}</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{t('editBannerModal.saveChanges')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBannerModal;
