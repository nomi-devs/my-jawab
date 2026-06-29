// src/components/dashboard/settings/AppSettingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Save, RefreshCw, DollarSign, Globe } from 'lucide-react';
import RefreshButton from '../../common/RefreshButton';
import appSettingsApi from '../../../api/appSettingsApi';
import currenciesApi from '../../../api/currenciesApi';
import AlertModal from '../../common/AlertModal';
import TableSkeleton from '../../common/TableSkeleton';

const AppSettingsPage = () => {
    const [settings, setSettings] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [alert, setAlert] = useState({ show: false, type: 'success', title: '', message: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [settingsRes, currenciesRes] = await Promise.all([
                appSettingsApi.getSettings(),
                currenciesApi.getCurrencies()
            ]);
            setSettings(settingsRes.data);
            setCurrencies(currenciesRes.data.filter(c => c.is_active));
        } catch (error) {
            console.error('Failed to fetch settings data:', error);
            showAlert('error', 'Error', 'Failed to load settings. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const showAlert = (type, title, message) => {
        setAlert({ show: true, type, title, message });
    };

    const handleUpdateSetting = async (key, value) => {
        setIsSaving(true);
        try {
            await appSettingsApi.updateSetting(key, { setting_value: value });
            setSettings(prev => prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s));
            showAlert('success', 'Success', 'Setting updated successfully!');
        } catch (error) {
            console.error(`Failed to update setting ${key}:`, error);
            showAlert('error', 'Error', 'Failed to update setting.');
        } finally {
            setIsSaving(false);
        }
    };

    const getSettingValue = (key) => {
        return settings.find(s => s.setting_key === key)?.setting_value || '';
    };

    const tabs = [
        { id: 'general', label: 'General Settings', icon: Globe },
        { id: 'currency', label: 'Currency Settings', icon: DollarSign },
    ];

    if (loading) {
        return <TableSkeleton rows={8} columns={2} />;
    }

    return (
        <div className="space-y-6">
            <AlertModal
                isOpen={alert.show}
                onClose={() => setAlert({ ...alert, show: false })}
                type={alert.type}
                title={alert.title}
                message={alert.message}
            />

            {/* Header Card */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-purple-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Settings className="text-purple-600 w-5 h-5" />
                        Application Settings
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Configure app-wide parameters and preferences.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <RefreshButton
                        onClick={fetchData}
                        loading={loading}
                        title="Refresh settings"
                        size={18}
                    />
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${activeTab === tab.id
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-100 dark:shadow-none'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-purple-500/70'} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-purple-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6">
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">General Configuration</h4>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-0.5">
                                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">App Name</label>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">The display name of the application.</p>
                                                </div>
                                                <div className="relative w-full md:w-64">
                                                    <input
                                                        type="text"
                                                        defaultValue="Jawaab"
                                                        disabled
                                                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-500 border border-gray-200 dark:border-gray-700 cursor-not-allowed text-sm font-medium"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-900 px-1">Read only</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'currency' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Currency Configuration</h4>
                                    <div className="p-6 bg-purple-50/30 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="space-y-1 max-w-md">
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    Primary System Currency
                                                </label>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                                    This currency will be used for all transactions and price displays across the platform. Ensure the selected currency is properly configured.
                                                </p>
                                            </div>
                                            <div className="w-full md:w-64">
                                                <select
                                                    value={getSettingValue('app_currency')}
                                                    onChange={(e) => handleUpdateSetting('app_currency', e.target.value)}
                                                    disabled={isSaving}
                                                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-purple-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm font-bold"
                                                >
                                                    <option value="">Select Currency</option>
                                                    {currencies.map(c => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.currency_name} ({c.currency_symbol} - {c.currency_code})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {isSaving && (
                                            <div className="mt-4 flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">
                                                <RefreshCw size={12} className="animate-spin" />
                                                Persisting changes to database...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {(activeTab === 'security' || activeTab === 'notifications') && (
                            <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in duration-300">
                                <div className="w-20 h-20 bg-purple-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
                                    <Settings className="w-10 h-10 text-purple-200 dark:text-purple-900/50 animate-spin-slow" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-400 dark:text-gray-600 mb-2">Coming Soon</h3>
                                <p className="text-sm text-gray-400 dark:text-gray-600 max-w-xs italic font-medium">
                                    These settings are being finalized and will be available in the next system update.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Info Bar */}
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest flex justify-between items-center border-t border-purple-50 dark:border-gray-700">
                        <span>Platform v1.4.0</span>
                        <span>Last updated: {new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default AppSettingsPage;
