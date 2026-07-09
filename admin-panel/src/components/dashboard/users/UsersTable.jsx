// src/components/dashboard/users/UsersTable.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import UserDetailsModal from './UserDetailsModal';
import UserRow from './UserRow';
import UsersGrid from './UsersGrid';
import UsersHeader from './UsersHeader';
import UsersTableFooter from './UsersTableFooter';
import AlertModal from '../../common/AlertModal';
import ConfirmationModal from '../../common/ConfirmationModal';
import TableSkeleton from '../../common/TableSkeleton';
import userApi from '../../../api/userApi';
import { useUsersList, useUserActions } from '../../../hooks/useUsers';

const UsersTable = () => {
  const { t } = useTranslation('users');
  const location = useLocation();
  const navigate = useNavigate();

  // UI State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  // Filter and pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const usersPerPage = 10;

  const searchIdRef = useRef(null); // Store search ID for filtering

  // Memoized params for TanStack Query
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: usersPerPage,
      ...(searchTerm && searchTerm.trim() && { search: searchTerm.trim() }),
      sort_by: sortBy,
      sort_order: sortOrder,
      ...(roleFilter && roleFilter !== 'all' && { role: roleFilter }),
      ...(statusFilter !== 'all' &&
        statusFilter !== null && {
          is_active: statusFilter,
        }),
      ...(verifiedFilter !== 'all' &&
        verifiedFilter !== null && {
          is_verified: verifiedFilter,
        }),
    }),
    [
      currentPage,
      searchTerm,
      roleFilter,
      statusFilter,
      verifiedFilter,
      sortBy,
      sortOrder,
      usersPerPage,
    ],
  );

  // Use TanStack Query Hook
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    isPlaceholderData,
    refetch,
  } = useUsersList(queryParams);

  const { createUser, updateUser, deleteUser, isUpdating, isCreating, isDeleting } =
    useUserActions();

  const users = data?.users || [];
  const totalUsers = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Handle navigation state from search (Deep linking)
  useEffect(() => {
    const state = location.state;
    if (state && (state.searchUserId || state.searchQuery)) {
      const { searchUserId, searchQuery } = state;
      if (searchQuery) {
        setSearchTerm(searchQuery);
        setCurrentPage(1);
      }
      if (searchUserId) {
        searchIdRef.current = searchUserId;
      }
      setTimeout(() => {
        navigate(location.pathname, { replace: true, state: null });
      }, 0);
    }
  }, [location.state, location.pathname, navigate]);

  // Specific filter by ID logic (if navigated from search results)
  const displayUsers = useMemo(() => {
    if (searchIdRef.current && users.length > 0) {
      const filtered = users.filter((user) => user.id === searchIdRef.current);
      if (filtered.length > 0) return filtered;
    }
    return users;
  }, [users]);

  // Handle adding new user
  const handleAddUser = useCallback(
    async (userData) => {
      try {
        const apiData = {
          username: userData.handle || userData.username,
          email: userData.email,
          password: userData.password || `TempPassword${Date.now()}`,
          auth_type: userData.email ? 'email' : 'phone',
          role: userData.role ? userData.role.toLowerCase().replace(' ', '_') : 'user',
          is_active: userData.status === 'Active' ? true : false,
        };

        await createUser(apiData);
        setSuccessMessage(t('usersTable.userCreated'));
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowAddUserModal(false);
      } catch (err) {
        console.error('Error creating user:', err);
        throw err;
      }
    },
    [createUser],
  );

  // Handle editing user
  const handleEditUser = useCallback((user) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  }, []);

  const handleViewDetails = useCallback((user) => {
    setSelectedUserForDetails(user);
    setShowUserDetailsModal(true);
  }, []);

  const handleSaveEdit = useCallback(
    async (userId, updatedData) => {
      try {
        let dataToUpdate = updatedData;

        if (!(updatedData instanceof FormData)) {
          dataToUpdate = {};
          if (updatedData.handle !== undefined && updatedData.handle !== '')
            dataToUpdate.username = updatedData.handle;
          if (updatedData.email !== undefined && updatedData.email !== '')
            dataToUpdate.email = updatedData.email;
          if (updatedData.password !== undefined && updatedData.password !== '')
            dataToUpdate.password = updatedData.password;
          if (updatedData.role !== undefined)
            dataToUpdate.role = updatedData.role.toLowerCase().replace(' ', '_');
          if (updatedData.status !== undefined)
            dataToUpdate.is_active = updatedData.status === 'Active' ? 'active' : 'inactive';
          if (updatedData.is_verified !== undefined)
            dataToUpdate.is_verified = updatedData.is_verified ? 'verified' : 'unverified';

          // Map profile fields
          const profileFields = [
            'full_name',
            'profile_picture',
            'profile_background',
            'tagline',
            'profile_bio',
            'profile_gender',
            'profile_birthday',
            'profile_website',
            'profile_location',
          ];
          profileFields.forEach((field) => {
            if (updatedData[field] !== undefined) dataToUpdate[field] = updatedData[field] || null;
          });

          if (Object.keys(dataToUpdate).length === 0) {
            setSuccessMessage(t('usersTable.noChangesToSave'));
            setShowEditUserModal(false);
            return;
          }
        }

        await updateUser({ id: userId, data: dataToUpdate });
        setSuccessMessage(t('usersTable.userUpdated'));
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowEditUserModal(false);
        setSelectedUser(null);
      } catch (err) {
        console.error('Error updating user:', err);
      }
    },
    [updateUser],
  );

  const handleDeleteUser = useCallback(
    (userId) => {
      const user = users.find((user) => user.id === userId);
      setUserToDelete(user);
      setShowDeleteConfirm(true);
    },
    [users],
  );

  const confirmDeleteUser = useCallback(async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      setSuccessMessage(
        t('usersTable.userDeleted', { name: userToDelete.name || userToDelete.username }),
      );
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  }, [userToDelete, deleteUser]);

  const handlePageChange = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages],
  );

  const handleSearch = useCallback((term) => {
    setSearchTerm(term || '');
    setCurrentPage(1);
  }, []);

  const handleRoleFilter = useCallback((role) => {
    setRoleFilter(role || 'all');
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((status) => {
    setStatusFilter(status || 'all');
    setCurrentPage(1);
  }, []);

  const handleVerifiedFilter = useCallback((verified) => {
    setVerifiedFilter(verified || 'all');
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback(({ sortBy, sortOrder }) => {
    setSortBy(sortBy || 'created_at');
    setSortOrder(sortOrder || 'DESC');
    setCurrentPage(1);
  }, []);

  // Performance: isLoading refers to the VERY first load
  // If we have cached data, isLoading will be false, but data will be there instantly.
  if (isLoading && !data) {
    return (
      <TableSkeleton
        rows={10}
        columns={7}
        showAvatar
        showActions
        avatarColumnIndex={1}
        columnWidths={[
          'w-10',
          'w-[220px]',
          'w-[220px]',
          'w-[120px]',
          'w-[120px]',
          'w-[130px]',
          'w-[100px]',
        ]}
        containerClassName="min-h-[560px]"
      />
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <span className="text-red-600 dark:text-red-400 text-2xl">!</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {queryError?.message || t('usersTable.failedToLoad')}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {t('usersTable.retry')}
          </button>
        </div>
      </div>
    );
  }

  const isRefreshing = isFetching; // Show loading state whenever data is being fetched (manual refresh or background update)

  return (
    <>
      <AlertModal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage('')}
        type="success"
        title={t('common:success')}
        message={successMessage}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDeleteUser}
        type="danger"
        title={t('usersTable.deleteUserTitle')}
        message={
          userToDelete
            ? t('usersTable.deleteConfirmMessage', {
                name: userToDelete.name || userToDelete.username,
              })
            : ''
        }
        confirmText={t('common:delete')}
        cancelText={t('common:cancel')}
        isLoading={isDeleting}
      />

      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onAddUser={handleAddUser}
        loading={isCreating}
      />

      <EditUserModal
        isOpen={showEditUserModal}
        onClose={() => {
          setShowEditUserModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSave={handleSaveEdit}
        loading={isUpdating}
      />

      <UserDetailsModal
        isOpen={showUserDetailsModal}
        onClose={() => {
          setShowUserDetailsModal(false);
          setSelectedUserForDetails(null);
        }}
        userId={selectedUserForDetails?.id}
        userData={selectedUserForDetails}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        <UsersHeader
          userCount={totalUsers}
          onAddClick={() => setShowAddUserModal(true)}
          onSearch={handleSearch}
          onRoleFilter={handleRoleFilter}
          onStatusFilter={handleStatusFilter}
          onVerifiedFilter={handleVerifiedFilter}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          loading={isRefreshing}
          searchTerm={searchTerm}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          verifiedFilter={verifiedFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onRefresh={() => refetch()}
        />

        {/* Loading Overlay - Smooth transition */}
        <div
          className={`relative overflow-hidden transition-all duration-300 ${isRefreshing ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="p-4 border-b border-purple-100 dark:border-gray-700 bg-purple-50/50 dark:bg-purple-900/10">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 dark:border-purple-700 dark:border-t-purple-400 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('usersTable.updating')}
              </span>
            </div>
          </div>
        </div>

        <div
          className="overflow-x-auto transition-all duration-300 ease-in-out"
          style={{
            minHeight: displayUsers.length === 0 ? '400px' : 'auto',
            opacity: isRefreshing ? 0.6 : 1,
            scrollbarGutter: 'stable',
          }}
        >
          {displayUsers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('usersTable.noUsersFound')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? t('usersTable.tryChangingFilters')
                  : t('usersTable.startAddingFirstUser')}
              </p>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t('usersTable.addFirstUser')}
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <UsersGrid
              users={displayUsers}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onViewDetails={handleViewDetails}
            />
          ) : (
            <table className="w-full text-start border-collapse transition-opacity duration-300">
              <thead className="bg-purple-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium transition-colors">
                <tr>
                  <th className="p-4 w-16">{t('usersTable.columnHash')}</th>
                  <th className="p-4">{t('usersTable.columnUser')}</th>
                  <th className="p-4">{t('common:email')}</th>
                  <th className="p-4">{t('usersTable.columnRole')}</th>
                  <th className="p-4">{t('common:status')}</th>
                  <th className="p-4">{t('usersTable.columnJoined')}</th>
                  <th className="p-4 text-end">{t('common:actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-gray-700 text-sm">
                {displayUsers.map((user, index) => {
                  const serialNumber = (currentPage - 1) * usersPerPage + index + 1;
                  return (
                    <UserRow
                      key={user.id}
                      user={user}
                      onDelete={handleDeleteUser}
                      onEdit={handleEditUser}
                      onViewDetails={handleViewDetails}
                      index={index}
                      serialNumber={serialNumber}
                    />
                  );
                })}
              </tbody>
            </table>
          )}

          {viewMode === 'list' && displayUsers.length > 0 && (
            <UsersTableFooter
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              userCount={totalUsers}
              usersPerPage={usersPerPage}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default React.memo(UsersTable);
