// src/components/dashboard/users/UsersTableFooter.jsx
import React from 'react';
import PaginationFooter from '../../common/PaginationFooter';

const UsersTableFooter = React.memo(({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  userCount,
  usersPerPage = 10
}) => {
  return (
    <PaginationFooter
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      totalItems={userCount}
      itemsPerPage={usersPerPage}
      itemName="users"
    />
  );
});

UsersTableFooter.displayName = 'UsersTableFooter';
export default UsersTableFooter;