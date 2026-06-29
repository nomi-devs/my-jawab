// src/components/dashboard/settings/CurrenciesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, RefreshCw, DollarSign, Filter, X, Check } from 'lucide-react';
import currenciesApi from '../../../api/currenciesApi';
import appSettingsApi from '../../../api/appSettingsApi';
import CurrencyModal from './CurrencyModal';
import AlertModal from '../../common/AlertModal';
import ConfirmationModal from '../../common/ConfirmationModal';
import TableSkeleton from '../../common/TableSkeleton';
import PaginationFooter from '../../common/PaginationFooter';
import RefreshButton from '../../common/RefreshButton';

const CurrenciesPage = () => {
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [currencyToDelete, setCurrencyToDelete] = useState(null);
    const [alert, setAlert] = useState({ show: false, type: 'success', title: '', message: '' });
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [defaultCurrencyId, setDefaultCurrencyId] = useState(null);

    // Filter and Pagination State
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchCurrencies = useCallback(async () => {
        setLoading(true);
        try {
            const [currenciesRes, settingsRes] = await Promise.all([
                currenciesApi.getCurrencies(),
                appSettingsApi.getSettings()
            ]);
            setCurrencies(currenciesRes.data);
            const appCurrencySetting = settingsRes.data.find(s => s.setting_key === 'app_currency');
            setDefaultCurrencyId(appCurrencySetting?.setting_value ? parseInt(appCurrencySetting.setting_value) : null);
        } catch (error) {
            console.error('Failed to fetch currencies:', error);
            showAlert('error', 'Error', 'Failed to load currencies. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCurrencies();
    }, [fetchCurrencies]);

    const showAlert = (type, title, message) => {
        setAlert({ show: true, type, title, message });
    };

    const handleAddCurrency = async (data) => {
        setIsActionLoading(true);
        try {
            await currenciesApi.createCurrency(data);
            showAlert('success', 'Success', 'Currency added successfully!');
            setShowAddModal(false);
            fetchCurrencies();
        } catch (error) {
            console.error('Failed to add currency:', error);
            showAlert('error', 'Error', error.response?.data?.message || 'Failed to add currency.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleEditCurrency = async (data) => {
        setIsActionLoading(true);
        try {
            await currenciesApi.updateCurrency(selectedCurrency.id, data);
            showAlert('success', 'Success', 'Currency updated successfully!');
            setShowEditModal(false);
            fetchCurrencies();
        } catch (error) {
            console.error('Failed to update currency:', error);
            showAlert('error', 'Error', error.response?.data?.message || 'Failed to update currency.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDeleteConfirm = (currency) => {
        setCurrencyToDelete(currency);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        setIsActionLoading(true);
        try {
            await currenciesApi.deleteCurrency(currencyToDelete.id);
            showAlert('success', 'Success', 'Currency deleted successfully!');
            setShowDeleteConfirm(false);
            fetchCurrencies();
        } catch (error) {
            console.error('Failed to delete currency:', error);
            showAlert('error', 'Error', error.response?.data?.message || 'Failed to delete currency.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleSetDefault = async (currencyId) => {
        setIsActionLoading(true);
        try {
            await appSettingsApi.updateSetting('app_currency', { setting_value: currencyId.toString() });
            setDefaultCurrencyId(currencyId);
            showAlert('success', 'Success', 'Default currency updated successfully!');
        } catch (error) {
            console.error('Failed to set default currency:', error);
            showAlert('error', 'Error', error.response?.data?.message || 'Failed to set default currency.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const filteredCurrencies = currencies.filter(c => {
        const matchesSearch = c.currency_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.currency_code.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && c.is_active) ||
            (statusFilter === 'inactive' && !c.is_active);

        return matchesSearch && matchesStatus;
    });

    // Pagination logic
    const totalItems = filteredCurrencies.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedCurrencies = filteredCurrencies.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
        setCurrentPage(1); // Reset to first page on filter change
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setCurrentPage(1);
    };

    const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all';

    return (
        <div className="space-y-6">
            {/* Alert Modals */}
            <AlertModal
                isOpen={alert.show}
                onClose={() => setAlert({ ...alert, show: false })}
                type={alert.type}
                title={alert.title}
                message={alert.message}
            />

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                type="danger"
                title="Delete Currency"
                message={`Are you sure you want to delete ${currencyToDelete?.currency_name}? This action cannot be undone.`}
                isLoading={isActionLoading}
            />

            {/* Currency Modals */}
            <CurrencyModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={handleAddCurrency}
                title="Add New Currency"
                isLoading={isActionLoading}
            />

            {showEditModal && (
                <CurrencyModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleEditCurrency}
                    currency={selectedCurrency}
                    title="Edit Currency"
                    isLoading={isActionLoading}
                />
            )}

            {/* Main Content Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-purple-100 dark:border-gray-700 overflow-hidden">
                {/* Header Row */}
                <div className="p-4 border-b border-purple-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <DollarSign className="text-purple-600 w-5 h-5" />
                            Currency Management
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {loading ? 'Loading...' : `Total Currencies: ${currencies.length}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <RefreshButton
                            onClick={fetchCurrencies}
                            loading={loading}
                            title="Refresh currencies"
                            size={18}
                        />

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white rounded-lg transition-all text-xs font-medium shadow-sm hover:shadow-md active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={16} />
                            Add Currency
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="p-4 bg-purple-50/30 dark:bg-gray-900/10 border-b border-purple-100 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        {/* Search Input */}
                        <div className="relative flex-1 w-full sm:w-auto sm:min-w-[240px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by name or code..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full pl-9 pr-8 py-1.5 text-sm bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Status Filter */}
                        <div className="relative flex-shrink-0 w-full sm:w-auto">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={handleStatusFilterChange}
                                className="appearance-none w-full sm:w-auto min-w-[140px] pl-9 pr-8 py-1.5 text-sm bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer transition-all"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Clear Button */}
                        <button
                            onClick={clearFilters}
                            disabled={!hasActiveFilters}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${hasActiveFilters
                                ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/30'
                                : 'border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-600'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <X size={14} />
                            <span>Clear Filters</span>
                        </button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <TableSkeleton rows={5} columns={6} />
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-purple-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium transition-colors">
                                    <th className="px-6 py-4 w-16">#</th>
                                    <th className="px-6 py-4">Currency Name</th>
                                    <th className="px-6 py-4">Code</th>
                                    <th className="px-6 py-4 text-center">Symbol</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Default</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-100 dark:divide-gray-700">
                                {paginatedCurrencies.length > 0 ? (
                                    paginatedCurrencies.map((currency, index) => {
                                        const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
                                        return (
                                            <tr
                                                key={currency.id}
                                                className="hover:bg-purple-50/30 dark:hover:bg-gray-700/30 transition-colors"
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">{serialNumber}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{currency.currency_name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-[10px] font-bold uppercase tracking-wider">
                                                        {currency.currency_code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 text-center">{currency.currency_symbol}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${currency.is_active
                                                        ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                                                        : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
                                                        }`}>
                                                        <span className={`w-1 h-1 rounded-full mr-1.5 ${currency.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                        {currency.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {currency.id === defaultCurrencyId ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                                            <Check size={10} className="mr-1" />
                                                            Default
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSetDefault(currency.id)}
                                                            disabled={isActionLoading || !currency.is_active}
                                                            className="px-2 py-0.5 text-[10px] font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title={!currency.is_active ? 'Activate currency first to set as default' : 'Set as default currency'}
                                                        >
                                                            Set as Default
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-1">
                                                        <button
                                                            onClick={() => { setSelectedCurrency(currency); setShowEditModal(true); }}
                                                            className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                                                            title="Edit Currency"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteConfirm(currency)}
                                                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                            title="Delete Currency"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/50">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                                <p className="text-sm">No currencies found matching your search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Footer */}
                <PaginationFooter
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    itemName="currencies"
                />
            </div>
        </div>
    );

};

export default CurrenciesPage;
