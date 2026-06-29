// src/components/dashboard/privacy-policy/PrivacyPolicyPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Save, Plus, Eye, EyeOff, FileText, CheckCircle, XCircle } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import privacyPolicyApi from '../../../api/privacyPolicyApi';
import AlertModal from '../../common/AlertModal';
import TableSkeleton from '../../common/TableSkeleton';

const quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ script: 'sub' }, { script: 'super' }],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ direction: 'rtl' }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean'],
    ],
};

const quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'script',
    'blockquote', 'code-block',
    'list', 'indent', 'direction', 'align',
    'link', 'image',
];

const PrivacyPolicyPage = () => {
    const [policy, setPolicy] = useState(null);
    const [formData, setFormData] = useState({
        slug: 'privacy-policy',
        title: '',
        content: '',
        is_active: 'active',
    });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isNew, setIsNew] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: 'success', title: '', message: '' });

    const fetchPolicy = useCallback(async () => {
        setLoading(true);
        try {
            const res = await privacyPolicyApi.getAdmin();
            if (res.data) {
                setPolicy(res.data);
                setFormData({
                    slug: res.data.slug || 'privacy-policy',
                    title: res.data.title || '',
                    content: res.data.content || '',
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
                console.error('Failed to fetch privacy policy:', error);
                showAlert('error', 'Error', 'Failed to load privacy policy. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPolicy();
    }, [fetchPolicy]);

    const showAlert = (type, title, message) => {
        setAlert({ show: true, type, title, message });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'title') {
                updated.slug = value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
            }
            return updated;
        });
    };

    const handleContentChange = (value) => {
        setFormData(prev => ({ ...prev, content: value }));
    };

    const handleSaveClick = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            showAlert('error', 'Validation Error', 'Title is required.');
            return;
        }
        if (!formData.content.trim() || formData.content === '<p><br></p>') {
            showAlert('error', 'Validation Error', 'Content is required.');
            return;
        }
        setIsSaving(true);
        try {
            if (isNew) {
                const res = await privacyPolicyApi.create(formData);
                setPolicy(res.data);
                setIsNew(false);
                showAlert('success', 'Created', 'Privacy policy created successfully!');
            } else {
                const res = await privacyPolicyApi.update(policy.id, formData);
                setPolicy(res.data);
                showAlert('success', 'Updated', 'Privacy policy updated successfully!');
            }
        } catch (error) {
            console.error('Failed to save privacy policy:', error);
            const msg = error.response?.data?.message || 'Failed to save privacy policy.';
            showAlert('error', 'Error', msg);
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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Shield className="text-purple-600 dark:text-purple-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 transition-colors">Privacy Policy</h2>
                                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 transition-colors">
                                    {isNew ? 'Create your privacy policy for the platform' : 'Manage and update your privacy policy content'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${showPreview
                                ? 'border-purple-200 dark:border-gray-600 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30'
                                : 'border-purple-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                            {showPreview ? 'Editor' : 'Preview'}
                        </button>
                    </div>
                </div>

                {showPreview ? (
                    /* Preview Mode */
                    <div className="p-4 md:p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 transition-colors">
                            <Eye size={16} className="text-purple-500 dark:text-purple-400" />
                            Content Preview
                        </h3>
                        <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-purple-200 dark:border-gray-600">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{formData.title || 'Untitled'}</h4>
                            <div
                                className="prose prose-sm prose-purple dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                                dangerouslySetInnerHTML={{ __html: formData.content || '<p class="italic text-gray-400">No content yet.</p>' }}
                            />
                        </div>
                    </div>
                ) : (
                    /* Editor Form */
                    <form onSubmit={handleSaveClick}>
                        <div className="p-4 md:p-6 space-y-6">
                            {/* Policy Details Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 transition-colors">
                                    <FileText size={16} className="text-purple-500 dark:text-purple-400" />
                                    Policy Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                                            Title *
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder="Privacy Policy"
                                            required
                                            disabled={isSaving}
                                            className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all text-sm"
                                        />
                                    </div>

                                    {/* Slug */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                                            Slug
                                        </label>
                                        <input
                                            type="text"
                                            name="slug"
                                            value={formData.slug}
                                            disabled
                                            className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed transition-colors text-sm"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Auto-generated from title</p>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                                            Status
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {formData.is_active === 'active' ? (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, is_active: 'inactive' }))}>
                                                    <CheckCircle size={14} className="mr-1" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, is_active: 'active' }))}>
                                                    <XCircle size={14} className="mr-1" />
                                                    Inactive
                                                </span>
                                            )}
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Click to toggle</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Editor Section */}
                            <div className="pt-6 border-t border-purple-100 dark:border-gray-700">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 transition-colors">
                                        <Shield size={16} className="text-purple-500 dark:text-purple-400" />
                                        Policy Content *
                                    </h3>

                                    <div className="quill-wrapper rounded-lg overflow-hidden border border-purple-200 dark:border-gray-600">
                                        <ReactQuill
                                            theme="snow"
                                            value={formData.content}
                                            onChange={handleContentChange}
                                            modules={quillModules}
                                            formats={quillFormats}
                                            placeholder="Write your privacy policy content here..."
                                            style={{ minHeight: '400px' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white font-semibold px-6 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Saving...</span>
                                        </>
                                    ) : isNew ? (
                                        <>
                                            <Plus size={16} />
                                            <span>Create Policy</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            <span>Save Policy</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
};

export default PrivacyPolicyPage;
