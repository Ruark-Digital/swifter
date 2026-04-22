import React from 'react';

const PaginationControls: React.FC = () => {
  // Placeholder data
  const currentPage = 1;
  const totalPages = 10;
  const totalItems = 100;
  const itemsPerPage = 10;

  return (
    <div className="py-3 flex items-center justify-between border-t border-gray-200 mt-6">
      <div className="text-sm text-gray-700">
        Page {currentPage} of {totalPages} (Showing {itemsPerPage * (currentPage -1) + 1}-{Math.min(itemsPerPage * currentPage, totalItems)} of {totalItems} items)
      </div>
      <div className="flex-1 flex justify-between sm:justify-end">
        <button
          // onClick={() => { /* Handle Previous Page */ }}
          // disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          // onClick={() => { /* Handle Next Page */ }}
          // disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;