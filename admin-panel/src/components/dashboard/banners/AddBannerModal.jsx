// src/components/dashboard/banners/AddBannerModal.jsx
import React, { useState, useCallback } from 'react';
import { X, Image as ImageIcon, Plus } from 'lucide-react';
import BannerForm from './BannerForm';

const DEFAULT_FORM = {
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
};

const AddBannerModal = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState(DEFAULT_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const resetForm = useCallback(() => {
        setFormData(DEFAULT_FORM);
        setError('');
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.banner_image || !(formData.banner_image instanceof File)) {
            setError('Banner image is required');
            return;
        }

        setIsSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('banner_image', formData.banner_image);
            if (formData.banner_title) fd.append('banner_title', formData.banner_title);
            if (formData.banner_description) fd.append('banner_description', formData.banner_description);
            if (formData.banner_link) fd.append('banner_link', formData.banner_link);
            fd.append('banner_type', formData.banner_type);
            if (formData.target_countries) fd.append('target_countries', formData.target_countries);
            if (formData.target_topic_ids) fd.append('target_topic_ids', formData.target_topic_ids);
            if (formData.target_subscription_ids) fd.append('target_subscription_ids', formData.target_subscription_ids);
            if (formData.excluded_countries) fd.append('excluded_countries', formData.excluded_countries);
            if (formData.excluded_topic_ids) fd.append('excluded_topic_ids', formData.excluded_topic_ids);
            if (formData.excluded_subscription_ids) fd.append('excluded_subscription_ids', formData.excluded_subscription_ids);
            if (formData.valid_from) fd.append('valid_from', new Date(formData.valid_from).toISOString());
            if (formData.valid_until) fd.append('valid_until', new Date(formData.valid_until).toISOString());
            fd.append('display_order', String(formData.display_order || 0));
            fd.append('is_active', formData.is_active ? 'active' : 'inactive');

            await onAdd(fd);
            resetForm();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to create banner');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            resetForm();
            onClose();
        }
    };

    if (!isOpen) return null;

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
                            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Add Banner</h2>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                Create a promotional banner for the feed.
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
                        isSubmitting={isSubmitting}
                        formId="add-banner-form"
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
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="add-banner-form"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm hover:shadow-md active:scale-95 transition-all"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Adding...</span>
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                <span>Add Banner</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddBannerModal;
