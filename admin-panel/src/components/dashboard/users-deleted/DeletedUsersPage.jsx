// src/components/dashboard/users-deleted/DeletedUsersPage.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UserX, Search, X, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import userApi from '../../../api/userApi';
import AlertModal from '../../common/AlertModal';
import ConfirmationModal from '../../common/ConfirmationModal';
import TableSkeleton from '../../common/TableSkeleton';
import RefreshButton from '../../common/RefreshButton';
import PaginationFooter from '../../common/PaginationFooter';

const formatDate = (d) => {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return '—'; }
};

const DeletedUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const itemsPerPage = 10;

    const [searchTerm, setSearchTerm] = useState('');
    const [localSearch, setLocalSearch] = useState('');
    const searchTimeoutRef = useRef(null);

    // Modals
    const [alert, setAlert] = useState({ show: false, type: 'success', title: '', message: '' });
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [showHardDeleteConfirm, setShowHardDeleteConfirm] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (localSearch === searchTerm) return;
        searchTimeoutRef.current = setTimeout(() => {
            setSearchTerm(localSearch);
            setCurrentPage(1);
        }, 500);
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [localSearch, searchTerm]);

    const showAlert = useCallback((type, title, message) => {
        setAlert({ show: true, type, title, message });
    }, []);

    const fetchDeletedUsers = useCallback(async () => {
        setRefreshing(true);
        try {
            const response = await userApi.getDeletedUsers({
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm,
                sort_by: 'updated_at',
                sort_order: 'DESC',
            });
            const data = response.data?.data || [];
            const meta = response.data?.meta || {};
            setUsers(data);
            setTotalUsers(meta.total || 0);
            setTotalPages(meta.total_pages || 1);
        } catch (err) {
            console.error('Failed to fetch deleted users:', err);
            showAlert('error', 'Error', err.response?.data?.message || 'Failed to load deleted users.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, searchTerm, showAlert]);

    useEffect(() => {
        fetchDeletedUsers();
    }, [fetchDeletedUsers]);

    const handleRestore = (user) => {
        setSelectedUser(user);
        setShowRestoreConfirm(true);
    };

    const confirmRestore = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            await userApi.restoreUser(selectedUser.id);
            setShowRestoreConfirm(false);
            setSelectedUser(null);
            showAlert('success', 'Restored', 'User restored successfully!');
            fetchDeletedUsers();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to restore user.';
            showAlert('error', 'Error', msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleHardDelete = (user) => {
        setSelectedUser(user);
        setShowHardDeleteConfirm(true);
    };

    const confirmHardDelete = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            await userApi.hardDeleteUser(selectedUser.id);
            setShowHardDeleteConfirm(false);
            setSelectedUser(null);
            showAlert('success', 'Deleted', 'User permanently deleted.');
            fetchDeletedUsers();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to permanently delete user.';
            showAlert('error', 'Error', msg);
            setShowHardDeleteConfirm(false);
        } finally {
            setActionLoading(false);
        }
    };

    const hasSearch = useMemo(() => !!localSearch, [localSearch]);

    if (loading && users.length === 0) {
        return <TableSkeleton rows={10} columns={6} showActions containerClassName="min-h-[560px]" />;
    }

    return (
        <div className="space-y-4">
            <AlertModal
                isOpen={alert.show}
                onClose={() => setAlert({ ...alert, show: false })}
                type={alert.type}
                title={alert.title}
                message={alert.message}
            />

            <ConfirmationModal
                isOpen={showRestoreConfirm}
                onClose={() => { setShowRestoreConfirm(false); setSelectedUser(null); }}
                onConfirm={confirmRestore}
                type="info"
                title="Restore User"
                message={`Restore user "${selectedUser?.username || selectedUser?.email}"? They will be able to log in again.`}
                confirmText="Restore"
                cancelText="Cancel"
                isLoading={actionLoading}
            />

            <ConfirmationModal
                isOpen={showHardDeleteConfirm}
                onClose={() => { setShowHardDeleteConfirm(false); setSelectedUser(null); }}
                onConfirm={confirmHardDelete}
                type="error"
                title="Permanently Delete User"
                message={`This CANNOT be undone. "${selectedUser?.username || selectedUser?.email}" will be removed from the database completely. Only works if the user has no posts, polls, or comments.`}
                confirmText="Permanently Delete"
                cancelText="Cancel"
                isLoading={actionLoading}
            />

            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-purple-100 dark:border-gray-700 transition-colors">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
                    <div>
                        <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <UserX className="text-red-500 w-5 h-5" />
                            Deleted Users
                            <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                {totalUsers}
                            </span>
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Soft-deleted user accounts. Restore to re-activate, or permanently delete (only if user has no content).
                        </p>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <RefreshButton onClick={fetchDeletedUsers} loading={refreshing} title="Refresh" size={18} />
                    </div>
                </div>

                {/* Search */}
                <div className="flex gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search deleted users..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="w-full pl-9 pr-8 py-1.5 text-sm bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                        {localSearch && (
                            <button
                                onClick={() => setLocalSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
                <div
                    className={`relative overflow-hidden transition-all duration-300 ${refreshing && users.length > 0 ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                    <div className="p-4 border-b border-purple-100 dark:border-gray-700 bg-purple-50/50 dark:bg-purple-900/10">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 dark:border-purple-700 dark:border-t-purple-400 rounded-full animate-spin"></div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Updating...</span>
                        </div>
                    </div>
                </div>

                {users.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <UserX className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No deleted users</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {hasSearch ? 'No deleted users match your search.' : 'There are no deleted users in the system.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto" style={{ opacity: refreshing ? 0.6 : 1 }}>
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-red-50 dark:bg-red-900/20 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">
                                <tr>
                                    <th className="p-3 w-12 text-center">#</th>
                                    <th className="p-3">User</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Role</th>
                                    <th className="p-3">Deleted At</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-100 dark:divide-gray-700 text-sm">
                                {users.map((user, index) => {
                                    const serial = (currentPage - 1) * itemsPerPage + index + 1;
                                    return (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors"
                                        >
                                            <td className="p-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">{serial}</td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 text-xs font-bold">
                                                        {(user.username || user.email || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-xs text-gray-800 dark:text-gray-100 line-through truncate max-w-[180px]">
                                                            {user.profile?.full_name || user.username}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                                                            @{user.username}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 text-xs text-gray-600 dark:text-gray-300 line-through">
                                                {user.email}
                                            </td>
                                            <td className="p-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-3 text-[11px] text-gray-500 dark:text-gray-400">
                                                {formatDate(user.deleted_at || user.updated_at)}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRestore(user)}
                                                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                                        title="Restore"
                                                    >
                                                        <RotateCcw size={12} />
                                                        Restore
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleHardDelete(user)}
                                                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                        title="Permanently delete (only if user has no content)"
                                                    >
                                                        <Trash2 size={12} />
                                                        Hard Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Warning banner */}
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-[11px] text-amber-800 dark:text-amber-300">
                    <strong>Hard delete</strong> is irreversible. It only works for users who have no posts, polls, or comments. If a user has any content, permanent deletion is blocked — use <strong>Restore</strong> to bring them back or keep them soft-deleted.
                </div>
            </div>

            {users.length > 0 && (
                <PaginationFooter
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalUsers}
                    itemsPerPage={itemsPerPage}
                    itemName="deleted users"
                />
            )}
        </div>
    );
};

export default DeletedUsersPage;
