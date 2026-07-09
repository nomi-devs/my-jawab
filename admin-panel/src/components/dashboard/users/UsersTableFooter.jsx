// src/components/dashboard/users/UsersTableFooter.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import PaginationFooter from '../../common/PaginationFooter';

const UsersTableFooter = React.memo(
  ({ currentPage, totalPages, onPageChange, userCount, usersPerPage = 10 }) => {
    const { t } = useTranslation('users');
    return (
      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        totalItems={userCount}
        itemsPerPage={usersPerPage}
        itemName={t('usersTableFooter.itemName')}
      />
    );
  },
);

UsersTableFooter.displayName = 'UsersTableFooter';
export default UsersTableFooter;
