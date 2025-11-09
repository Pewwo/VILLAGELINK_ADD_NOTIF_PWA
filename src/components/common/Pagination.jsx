import React from 'react';

export default function Pagination({ currentPage, totalPages, setCurrentPage }) {
  const handlePageChange = (e) => {
    setCurrentPage(Number(e.target.value));
  };

  return (
    <div className="flex justify-center items-center gap-4 mt-6">
      <button
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className="w-10 h-10 bg-white border border-gray-300 text-slate-800 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-all"
        aria-label="Previous page"
      >
        ‹
      </button>
      <div className="flex items-center gap-2">
        <span className="text-gray-700 text-sm md:text-base">Page</span>
        <select
          value={currentPage}
          onChange={handlePageChange}
          className="border border-gray-300 rounded-md px-3 py-1 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <option key={page} value={page}>
              {page}
            </option>
          ))}
        </select>
        <span className="text-gray-700 text-sm md:text-base">of {totalPages}</span>
      </div>
      <button
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="w-10 h-10 bg-white border border-gray-300 text-slate-800 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-all"
        aria-label="Next page"
      >
        ›
      </button>
    </div>
  );
}
