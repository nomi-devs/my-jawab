// src/components/dashboard/banners/BannersPage.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { useBannersList, useBannerActions } from '../../../hooks/useBanners';

import BannersHeader from './BannersHeader';
import BannersTable from './BannersTable';
import AddBannerModal from './AddBannerModal';
import EditBannerModal from './EditBannerModal';
import BannerDetailsModal from './BannerDetailsModal';
import PaginationFooter from '../../common/PaginationFooter';
import TableSkeleton from '../../common/TableSkeleton';
import AlertModal from '../../common/AlertModal';
import ConfirmationModal from '../../common/ConfirmationModal';
import ErrorMessage from '../../common/ErrorMessage';

const BannersPage = () => {
    // Modals
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [selectedBanner, setSelectedBanner] = useState(null);
    const [bannerToDelete, setBannerToDelete] = useState(null);

    // Feedback
    const [alert, setAlert] = useState({ show: false, type: 'success', title: '', message: '' });

    // Filters + pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('display_order');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const queryParams = useMemo(() => ({
        page: currentPage,
        limit: itemsPerPage,
        ...(searchTerm && searchTerm.trim() && { search: searchTerm.trim() }),
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(statusFilter !== 'all' && { is_active: statusFilter }),
        ...(typeFilter !== 'all' && { banner_type: typeFilter }),
    }), [currentPage, searchTerm, sortBy, sortOrder, statusFilter, typeFilter, itemsPerPage]);

    const { data, isLoading, isFetching, isError, error, refetch } = useBannersList(queryParams);
    const {
        createBanner, updateBanner, updateBannerStatus, deleteBanner,
        isCreating, isUpdating, isDeleting,
    } = useBannerActions();

    const banners = data?.banners || [];
    const totalBanners = data?.total || 0;
    const totalPages = data?.totalPages || 1;
    const hasFilters = searchTerm || statusFilter !== 'all' || typeFilter !== 'all';

    const showAlert = useCallback((type, title, message) => {
        setAlert({ show: true, type, title, message });
    }, []);

    // ─── Filter Handlers ────────────────────────
    const handleSearch = useCallback((term) => {
        setSearchTerm(term || '');
        setCurrentPage(1);
    }, []);
    const handleStatusFilter = useCallback((s) => { setStatusFilter(s || 'all'); setCurrentPage(1); }, []);
    const handleTypeFilter = useCallback((t) => { setTypeFilter(t || 'all'); setCurrentPage(1); }, []);
    const handleSortByChange = useCallback((s) => { setSortBy(s); setCurrentPage(1); }, []);
    const handleSortOrderToggle = useCallback(() => {
        setSortOrder(prev => (prev === 'DESC' ? 'ASC' : 'DESC'));
        setCurrentPage(1);
    }, []);
    const handlePageChange = useCallback((p) => setCurrentPage(p), []);

    // ─── CRUD Handlers ──────────────────────────
    const handleAdd = useCallback(async (formData) => {
        try {
            await createBanner(formData);
            showAlert('success', 'Created', 'Banner created successfully!');
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            showAlert('error', 'Error', `Failed to create banner: ${msg}`);
            throw err; // let modal keep the error visible
        }
    }, [createBanner, showAlert]);

    const handleEdit = useCallback((banner) => {
        setSelectedBanner(banner);
        setShowEdit(true);
    }, []);

    const handleSaveEdit = useCallback(async (id, formData) => {
        try {
            await updateBanner({ id, data: formData });
            showAlert('success', 'Updated', 'Banner updated successfully!');
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            showAlert('error', 'Error', `Failed to update banner: ${msg}`);
            throw err;
        }
    }, [updateBanner, showAlert]);

    const handleViewDetails = useCallback((banner) => {
        setSelectedBanner(banner);
        setShowDetails(true);
    }, []);

    const handleToggleActive = useCallback(async (id, isActive) => {
        try {
            await updateBannerStatus({ id, is_active: isActive });
            showAlert('success', 'Updated', isActive ? 'Banner activated!' : 'Banner deactivated!');
        } catch (err) {
            showAlert('error', 'Error', err.response?.data?.message || 'Failed to update status');
        }
    }, [updateBannerStatus, showAlert]);

    const handleDelete = useCallback((id) => {
        const b = banners.find(x => x.id === id);
        setBannerToDelete(b);
        setShowDeleteConfirm(true);
    }, [banners]);

    const confirmDelete = useCallback(async () => {
        if (!bannerToDelete) return;
        try {
            await deleteBanner(bannerToDelete.id);
            setShowDeleteConfirm(false);
            setBannerToDelete(null);
            showAlert('success', 'Deleted', 'Banner deleted successfully!');
        } catch (err) {
            showAlert('error', 'Error', err.response?.data?.message || 'Failed to delete banner');
        }
    }, [bannerToDelete, deleteBanner, showAlert]);

    // ─── Loading & Error States ────────────────
    if (isLoading && banners.length === 0) {
        return <TableSkeleton rows={10} columns={9} showActions containerClassName="min-h-[560px]" />;
    }

    if (isError && banners.length === 0) {
        return <ErrorMessage message={error?.message || 'Failed to load banners'} onRetry={() => refetch()} />;
    }

    return (
        <div className="space-y-4">
            {/* Feedback Modals */}
            <AlertModal
                isOpen={alert.show}
                onClose={() => setAlert({ ...alert, show: false })}
                type={alert.type}
                title={alert.title}
                message={alert.message}
            />

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => { setShowDeleteConfirm(false); setBannerToDelete(null); }}
                onConfirm={confirmDelete}
                type="error"
                title="Delete Banner"
                message={`Are you sure you want to delete "${bannerToDelete?.banner_title || `Banner #${bannerToDelete?.id}`}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
            />

            {/* Header */}
            <BannersHeader
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                typeFilter={typeFilter}
                sortBy={sortBy}
                sortOrder={sortOrder}
                totalBanners={totalBanners}
                loading={isFetching}
                onSearch={handleSearch}
                onStatusFilter={handleStatusFilter}
                onTypeFilter={handleTypeFilter}
                onSortByChange={handleSortByChange}
                onSortOrderToggle={handleSortOrderToggle}
                onAddClick={() => setShowAdd(true)}
                onRefresh={() => refetch()}
            />

            {/* Table */}
            <BannersTable
                banners={banners}
                isRefreshing={isFetching && banners.length > 0}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                hasFilters={hasFilters}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
                onToggleActive={handleToggleActive}
                onAddClick={() => setShowAdd(true)}
            />

            {/* Pagination */}
            {banners.length > 0 && (
                <PaginationFooter
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={totalBanners}
                    itemsPerPage={itemsPerPage}
                    itemName="banners"
                />
            )}

            {/* Add / Edit / Details Modals */}
            <AddBannerModal
                isOpen={showAdd}
                onClose={() => setShowAdd(false)}
                onAdd={handleAdd}
            />
            <EditBannerModal
                isOpen={showEdit}
                banner={selectedBanner}
                onClose={() => { setShowEdit(false); setSelectedBanner(null); }}
                onSave={handleSaveEdit}
            />
            <BannerDetailsModal
                isOpen={showDetails}
                banner={selectedBanner}
                onClose={() => { setShowDetails(false); setSelectedBanner(null); }}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default BannersPage;
