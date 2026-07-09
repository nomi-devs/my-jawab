// src/components/dashboard/banners/BannerForm.jsx
// Shared form fields used by both Add and Edit modals.
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image as ImageIcon,
  Link as LinkIcon,
  Globe,
  Hash,
  CreditCard,
  Calendar,
  Layers,
  ToggleLeft,
  AlertCircle,
} from 'lucide-react';
import MultiSelectField from '../../common/MultiSelectField';
import topicsApi from '../../../api/topicsApi';
import subscriptionsApi from '../../../api/subscriptionsApi';

const BannerForm = ({
  formData,
  setFormData,
  existingImageUrl = null,
  isSubmitting = false,
  formId = 'banner-form',
  onSubmit,
}) => {
  const { t } = useTranslation('banners');
  const [topics, setTopics] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Fetch topics + subscriptions on mount
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingTopics(true);
      try {
        const res = await topicsApi.getTopics({ limit: 100, is_active: 'active' });
        if (!active) return;
        const list = res.data?.data || [];
        setTopics(
          list.map((t) => ({
            id: t.id,
            label: t.topic_name || t.name || `Topic ${t.id}`,
          })),
        );
      } catch (err) {
        console.error('Failed to load topics:', err);
      } finally {
        if (active) setLoadingTopics(false);
      }
    })();

    (async () => {
      setLoadingSubs(true);
      try {
        const res = await subscriptionsApi.getSubscriptions({ limit: 100, is_active: true });
        if (!active) return;
        const list = res.data?.data || [];
        setSubscriptions(
          list.map((s) => ({
            id: s.id,
            label: s.subscription_name
              ? `${s.subscription_name}${s.subscription_type ? ` (${s.subscription_type})` : ''}`
              : `Subscription ${s.id}`,
          })),
        );
      } catch (err) {
        console.error('Failed to load subscriptions:', err);
      } finally {
        if (active) setLoadingSubs(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // ─── CSV <-> Array helpers ────────────────────
  const csvToArray = (csv) => {
    if (!csv || typeof csv !== 'string') return [];
    return csv
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : v;
      });
  };

  const arrayToCsv = (arr) => (Array.isArray(arr) ? arr.join(',') : '');

  const targetTopicArr = useMemo(
    () => csvToArray(formData.target_topic_ids),
    [formData.target_topic_ids],
  );
  const excludedTopicArr = useMemo(
    () => csvToArray(formData.excluded_topic_ids),
    [formData.excluded_topic_ids],
  );
  const targetSubArr = useMemo(
    () => csvToArray(formData.target_subscription_ids),
    [formData.target_subscription_ids],
  );
  const excludedSubArr = useMemo(
    () => csvToArray(formData.excluded_subscription_ids),
    [formData.excluded_subscription_ids],
  );

  // ─── Handlers ─────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setFormData((prev) => ({ ...prev, banner_image: file }));
  };

  const handleMultiChange = (fieldName) => (newArr) => {
    setFormData((prev) => ({ ...prev, [fieldName]: arrayToCsv(newArr) }));
  };

  const imagePreview =
    formData.banner_image instanceof File
      ? URL.createObjectURL(formData.banner_image)
      : existingImageUrl;

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-5">
      {/* ── Image Upload ───────────────────────────────── */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
          <ImageIcon size={12} className="text-purple-500" />
          {t('bannerForm.bannerImage')} <span className="text-red-500">*</span>
        </label>
        {imagePreview && (
          <div className="mb-2">
            <img
              src={imagePreview}
              alt="Banner preview"
              className="w-full max-h-40 object-cover rounded-lg border border-purple-200 dark:border-gray-600"
            />
          </div>
        )}
        <label className="inline-flex items-center px-3 py-2 rounded-lg border border-purple-200 dark:border-gray-600 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
          <ImageIcon size={14} className="me-1" />
          {existingImageUrl || formData.banner_image
            ? t('bannerForm.replaceImage')
            : t('bannerForm.uploadImage')}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isSubmitting}
          />
        </label>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
          {t('bannerForm.imageHint')}
        </p>
      </div>

      {/* ── Title & Type row ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('common:title')}
          </label>
          <input
            type="text"
            name="banner_title"
            value={formData.banner_title}
            onChange={handleChange}
            placeholder={t('bannerForm.titlePlaceholder')}
            maxLength={255}
            className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
            <Layers size={12} className="text-purple-500" />
            {t('common:type')}
          </label>
          <select
            name="banner_type"
            value={formData.banner_type}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
            disabled={isSubmitting}
          >
            <option value="promotion">{t('bannerForm.typePromotion')}</option>
            <option value="ad">{t('bannerForm.typeAd')}</option>
            <option value="announcement">{t('bannerForm.typeAnnouncement')}</option>
          </select>
        </div>
      </div>

      {/* ── Description ───────────────────────────────── */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('common:description')}
        </label>
        <textarea
          name="banner_description"
          value={formData.banner_description}
          onChange={handleChange}
          rows="2"
          placeholder={t('bannerForm.descriptionPlaceholder')}
          className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm resize-none"
          disabled={isSubmitting}
        />
      </div>

      {/* ── Link & Display Order ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
            <LinkIcon size={12} className="text-purple-500" />
            {t('bannerForm.linkLabel')}
          </label>
          <input
            type="text"
            name="banner_link"
            value={formData.banner_link}
            onChange={handleChange}
            placeholder={t('bannerForm.linkPlaceholder')}
            maxLength={500}
            className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('bannerForm.displayOrder')}
          </label>
          <input
            type="number"
            name="display_order"
            min="0"
            value={formData.display_order}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* ── Validity ──────────────────────────────────── */}
      <div className="pt-3 border-t border-purple-100 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
          <Calendar size={14} className="text-purple-500" />
          {t('bannerForm.scheduling')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('bannerForm.validFrom')}
            </label>
            <input
              type="datetime-local"
              name="valid_from"
              value={formData.valid_from}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('bannerForm.validUntil')}
            </label>
            <input
              type="datetime-local"
              name="valid_until"
              value={formData.valid_until}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
          {t('bannerForm.schedulingHint')}
        </p>
      </div>

      {/* ── Targeting ──────────────────────────────────── */}
      <div className="pt-3 border-t border-purple-100 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
          <Globe size={14} className="text-green-500" />
          {t('bannerForm.targetTitle')}
        </h3>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 flex items-start gap-1.5">
          <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
          <span>{t('bannerForm.targetHint')}</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Countries - still CSV (no backend endpoint for ISO list) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Globe size={11} className="text-purple-500" />
              {t('bannerForm.countries')}
            </label>
            <input
              type="text"
              name="target_countries"
              value={formData.target_countries}
              onChange={handleChange}
              placeholder={t('bannerForm.countriesPlaceholderTarget')}
              className="w-full px-3 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-xs"
              disabled={isSubmitting}
            />
            <p className="text-[10px] text-gray-500 mt-1">{t('bannerForm.countriesHint')}</p>
          </div>

          {/* Topics as multi-select */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Hash size={11} className="text-purple-500" />
              {t('bannerForm.topics')}
            </label>
            <MultiSelectField
              options={topics}
              value={targetTopicArr}
              onChange={handleMultiChange('target_topic_ids')}
              placeholder={t('bannerForm.topicsPlaceholderAll')}
              loading={loadingTopics}
              disabled={isSubmitting}
            />
          </div>

          {/* Subscriptions as multi-select */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <CreditCard size={11} className="text-purple-500" />
              {t('bannerForm.subscriptions')}
            </label>
            <MultiSelectField
              options={subscriptions}
              value={targetSubArr}
              onChange={handleMultiChange('target_subscription_ids')}
              placeholder={t('bannerForm.subscriptionsPlaceholderAll')}
              loading={loadingSubs}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* ── Exclusions ─────────────────────────────────── */}
      <div className="pt-3 border-t border-purple-100 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
          <Globe size={14} className="text-red-500" />
          {t('bannerForm.excludeTitle')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('bannerForm.countries')}
            </label>
            <input
              type="text"
              name="excluded_countries"
              value={formData.excluded_countries}
              onChange={handleChange}
              placeholder={t('bannerForm.countriesPlaceholderExclude')}
              className="w-full px-3 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-xs"
              disabled={isSubmitting}
            />
            <p className="text-[10px] text-gray-500 mt-1">{t('bannerForm.countriesHint')}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('bannerForm.topics')}
            </label>
            <MultiSelectField
              options={topics}
              value={excludedTopicArr}
              onChange={handleMultiChange('excluded_topic_ids')}
              placeholder={t('bannerForm.topicsPlaceholderNone')}
              loading={loadingTopics}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('bannerForm.subscriptions')}
            </label>
            <MultiSelectField
              options={subscriptions}
              value={excludedSubArr}
              onChange={handleMultiChange('excluded_subscription_ids')}
              placeholder={t('bannerForm.subscriptionsPlaceholderNone')}
              loading={loadingSubs}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* ── Status ────────────────────────────────────── */}
      <div className="pt-3 border-t border-purple-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <ToggleLeft size={12} className="text-purple-500" />
            {t('bannerForm.statusLabel')}
          </label>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
            disabled={isSubmitting}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${formData.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
              formData.is_active
                ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                : 'text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700'
            }`}
          >
            <span
              className={`w-1 h-1 rounded-full me-1.5 ${formData.is_active ? 'bg-green-500' : 'bg-gray-400'}`}
            />
            {formData.is_active ? t('common:active') : t('common:inactive')}
          </span>
        </div>
      </div>
    </form>
  );
};

export default BannerForm;
