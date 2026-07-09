// src/components/dashboard/support/SupportPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Headphones,
  Save,
  Plus,
  Mail,
  Phone,
  Globe,
  MapPin,
  MessageCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import supportApi from '../../../api/supportApi';
import AlertModal from '../../common/AlertModal';
import TableSkeleton from '../../common/TableSkeleton';

const SupportPage = () => {
  const { t } = useTranslation('support');
  const [support, setSupport] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    address: '',
    is_active: 'active',
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: 'success', title: '', message: '' });

  const fetchSupport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supportApi.getAdmin();
      if (res.data) {
        setSupport(res.data);
        setFormData({
          email: res.data.email || '',
          phone: res.data.phone || '',
          whatsapp: res.data.whatsapp || '',
          website: res.data.website || '',
          address: res.data.address || '',
          is_active: res.data.is_active ? 'active' : 'inactive',
        });
        setIsNew(false);
      } else {
        setIsNew(true);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setIsNew(true);
      } else {
        console.error('Failed to fetch support info:', error);
        showAlert('error', t('common:error'), t('loadFailed'));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSupport();
  }, [fetchSupport]);

  const showAlert = (type, title, message) => {
    setAlert({ show: true, type, title, message });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      showAlert('error', t('validationError'), t('emailRequired'));
      return;
    }
    if (!formData.phone.trim()) {
      showAlert('error', t('validationError'), t('phoneRequired'));
      return;
    }
    setIsSaving(true);
    try {
      if (isNew) {
        const res = await supportApi.create(formData);
        setSupport(res.data);
        setIsNew(false);
        showAlert('success', t('common:created'), t('createdSuccess'));
      } else {
        const res = await supportApi.update(support.id, formData);
        setSupport(res.data);
        showAlert('success', t('common:updated'), t('updatedSuccess'));
      }
    } catch (error) {
      console.error('Failed to save support info:', error);
      const msg = error.response?.data?.message || t('saveFailed');
      showAlert('error', t('common:error'), msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <TableSkeleton rows={8} columns={2} />;
  }

  return (
    <>
      {/* Alert Modal */}
      <AlertModal
        isOpen={alert.show}
        onClose={() => setAlert({ ...alert, show: false })}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-purple-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Headphones className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 transition-colors">
                {t('pageTitle')}
              </h2>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 transition-colors">
                {isNew ? t('subtitleCreate') : t('subtitleManage')}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveClick}>
          <div className="p-4 md:p-6 space-y-6">
            {/* Contact Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 transition-colors">
                <Phone size={16} className="text-purple-500 dark:text-purple-400" />
                {t('contactDetails')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    {t('supportEmail')}
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={t('supportEmailPlaceholder')}
                      required
                      disabled={isSaving}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('supportEmailHint')}
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    {t('phoneNumber')}
                  </label>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder={t('phonePlaceholder')}
                      required
                      disabled={isSaving}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('phoneHint')}
                  </p>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    {t('whatsappNumber')}
                  </label>
                  <div className="flex items-center gap-2">
                    <MessageCircle size={14} className="text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      placeholder={t('phonePlaceholder')}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('whatsappHint')}
                  </p>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    {t('websiteUrl')}
                  </label>
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder={t('websitePlaceholder')}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('websiteHint')}
                  </p>
                </div>
              </div>

              {/* Address - Full Width */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  {t('officeAddress')}
                </label>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-gray-400 dark:text-gray-500 mt-3" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder={t('addressPlaceholder')}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm resize-none"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('addressHint')}
                </p>
              </div>
            </div>

            {/* Status Section */}
            <div className="pt-6 border-t border-purple-100 dark:border-gray-700">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 transition-colors">
                  <Headphones size={16} className="text-purple-500 dark:text-purple-400" />
                  {t('visibility')}
                </h3>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    {t('statusLabel')}
                  </label>
                  <div className="flex items-center gap-2">
                    {formData.is_active === 'active' ? (
                      <span
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 cursor-pointer"
                        onClick={() => setFormData((prev) => ({ ...prev, is_active: 'inactive' }))}
                      >
                        <CheckCircle size={14} className="me-1" />
                        {t('common:active')}
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 cursor-pointer"
                        onClick={() => setFormData((prev) => ({ ...prev, is_active: 'active' }))}
                      >
                        <XCircle size={14} className="me-1" />
                        {t('common:inactive')}
                      </span>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('clickToToggle')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white font-semibold px-6 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('saving')}</span>
                  </>
                ) : isNew ? (
                  <>
                    <Plus size={16} />
                    <span>{t('createSupport')}</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{t('saveSupport')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default SupportPage;
