// src/components/dashboard/settings/CurrencyModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

const CurrencyModal = ({ isOpen, onClose, onSave, currency, title, isLoading }) => {
    const [formData, setFormData] = useState({
        currency_name: '',
        currency_code: '',
        currency_symbol: '',
        is_active: true
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (currency) {
            setFormData({
                currency_name: currency.currency_name || '',
                currency_code: currency.currency_code || '',
                currency_symbol: currency.currency_symbol || '',
                is_active: currency.is_active ?? true
            });
        } else {
            setFormData({
                currency_name: '',
                currency_code: '',
                currency_symbol: '',
                is_active: true
            });
        }
        setErrors({});
    }, [currency, isOpen]);

    const validate = () => {
        const newErrors = {};
        if (!formData.currency_name.trim()) newErrors.currency_name = 'Name is required';
        if (!formData.currency_code.trim()) newErrors.currency_code = 'Code is required';
        if (!formData.currency_symbol.trim()) newErrors.currency_symbol = 'Symbol is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSave(formData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-purple-100 dark:border-gray-700 animate-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="px-5 py-4 border-b border-purple-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
                    <div className="flex items-center space-x-2.5">
                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Save className="text-purple-600 dark:text-purple-400" size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Fill in the currency details</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <X size={16} className="text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Currency Name</label>
                            <input
                                type="text"
                                placeholder="e.g. US Dollar"
                                value={formData.currency_name}
                                onChange={(e) => setFormData({ ...formData, currency_name: e.target.value })}
                                className={`w-full px-4 py-2 text-sm rounded-lg border ${errors.currency_name ? 'border-red-500' : 'border-purple-100 dark:border-gray-600'} bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 transition-all outline-none`}
                            />
                            {errors.currency_name && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={10} /> {errors.currency_name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Code (3-4 chars)</label>
                                <input
                                    type="text"
                                    placeholder="USD"
                                    value={formData.currency_code}
                                    onChange={(e) => setFormData({ ...formData, currency_code: e.target.value.toUpperCase() })}
                                    maxLength={10}
                                    className={`w-full px-4 py-2 text-sm rounded-lg border ${errors.currency_code ? 'border-red-500' : 'border-purple-100 dark:border-gray-600'} bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 transition-all outline-none text-center font-bold`}
                                />
                                {errors.currency_code && <p className="text-[10px] text-red-500 mt-1">{errors.currency_code}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Symbol</label>
                                <input
                                    type="text"
                                    placeholder="$"
                                    value={formData.currency_symbol}
                                    onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                                    maxLength={10}
                                    className={`w-full px-4 py-2 text-sm rounded-lg border ${errors.currency_symbol ? 'border-red-500' : 'border-purple-100 dark:border-gray-600'} bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 transition-all outline-none text-center`}
                                />
                                {errors.currency_symbol && <p className="text-[10px] text-red-500 mt-1">{errors.currency_symbol}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                            />
                            <label htmlFor="is_active" className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer user-select-none">
                                Mark as Active
                            </label>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs font-medium transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2 purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white rounded-lg transition-all text-xs font-semibold shadow-md active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>{currency ? 'Update Currency' : 'Create Currency'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CurrencyModal;
