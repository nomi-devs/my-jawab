// src/components/common/PaginationFooter.jsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PaginationFooter = React.memo(({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems,
  itemsPerPage,
  itemName = 'items'
}) => {
  // Calculate page range
  const startItem = totalItems > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      onPageChange(newPage);
    }
  };

  // Generate page numbers to show (max 5 pages)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages, start + maxVisible - 1);
      
      // Adjust if we're near the end
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return (
      <div className="p-4 border-t border-purple-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
          {totalItems > 0 ? (
            <>
              Showing {startItem}-{endItem} of {totalItems} {itemName}
            </>
          ) : (
            `No ${itemName} found`
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-purple-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
      <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
        {totalItems > 0 ? (
          <>
            Showing {startItem}-{endItem} of {totalItems} {itemName} • Page {currentPage} of {totalPages}
          </>
        ) : (
          `No ${itemName} found`
        )}
      </div>
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>
        <div className="flex items-center space-x-1">
          {pageNumbers[0] > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="w-8 h-8 flex items-center justify-center text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
              >
                1
              </button>
              {pageNumbers[0] > 2 && (
                <span className="text-gray-400 dark:text-gray-500 px-1">...</span>
              )}
            </>
          )}
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => handlePageChange(pageNumber)}
              className={`w-8 h-8 flex items-center justify-center text-sm rounded-lg transition-colors ${
                currentPage === pageNumber
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30'
              }`}
            >
              {pageNumber}
            </button>
          ))}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className="text-gray-400 dark:text-gray-500 px-1">...</span>
              )}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="w-8 h-8 flex items-center justify-center text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 disabled:hover:bg-transparent"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
});

PaginationFooter.displayName = 'PaginationFooter';
export default PaginationFooter;

