import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaUserCircle,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import Pagination from "../../common/Pagination";
import { formatFacebookRelativeTime } from "../../../utils/timeUtils";

// 🌐 Hosted backend (primary source of truth)
const HOSTED_API = "https://villagelink.site/backend/api";

// 🖥️ Local backend (for syncing or offline mode)
const LOCAL_API = "http://localhost:3000/backend/api";

const ArchivedFaqsPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Format timestamps using Facebook-style relative time in Philippine timezone
  const formatTimestamp = (dateString) => {
    return formatFacebookRelativeTime(dateString);
  };

  // ✅ Fetch archived FAQs from hosted API
  const fetchArchivedFaqs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${HOSTED_API}/get_archived_faqs.php`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();

      if (result.status === 'success') {
        setFaqs(result.data);
      } else {
        console.error("Backend did not return success:", result);
        setFaqs([]);
      }
    } catch (err) {
      console.error("Error fetching archived FAQs:", err);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedFaqs();
  }, []);

  // Filters
  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage);
  const paginatedFaqs = filteredFaqs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const toggleExpand = (id) =>
    setExpandedId(expandedId === id ? null : id);

  const handleRestore = async (item) => {
    try {
      const response = await fetch(`${HOSTED_API}/restore.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table: 'faqs', id: item.faq_id }),
      });
      const result = await response.json();
      if (result.status === 'success') {
        // Remove the item from the list
        setFaqs(prev => prev.filter(faq => faq.faq_id !== item.faq_id));
        setShowRestoreConfirm(false);
        setSuccessMessage('FAQ restored successfully');
        setShowSuccessModal(true);
      } else {
        alert('Failed to restore: ' + result.message);
      }
    } catch (error) {
      alert('Error restoring FAQ: ' + error.message);
    }
  };

  const handleDelete = async (item) => {
    try {
      const response = await fetch(`${HOSTED_API}/delete_archived.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table: 'faqs', id: item.faq_id }),
      });
      const result = await response.json();
      if (result.status === 'success') {
        // Remove the item from the list
        setFaqs(prev => prev.filter(faq => faq.faq_id !== item.faq_id));
        setShowDeleteConfirm(false);
        setSuccessMessage('FAQ deleted successfully');
        setShowSuccessModal(true);
      } else {
        alert('Failed to delete: ' + result.message);
      }
    } catch (error) {
      alert('Error deleting FAQ: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-200 p-2 px-4 rounded-3xl mb-4 transition duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Archived FAQs
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              View and manage archived frequently asked questions
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 max-w-2xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search archived FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* FAQs */}
        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : paginatedFaqs.length > 0 ? (
          paginatedFaqs.map((faq) => (
            <div
              key={faq.faq_id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border mb-6 border-gray-100 max-w-2xl w-full mx-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FaUserCircle className="text-2xl text-slate-400" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {faq.author || "Community Board"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTimestamp(faq.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedItem(faq); setShowRestoreConfirm(true); }}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition duration-200"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => { setSelectedItem(faq); setShowDeleteConfirm(true); }}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition duration-200"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Q: {faq.question}
                  </h3>
                  <p
                    className={`text-gray-700 ${expandedId !== faq.faq_id ? "line-clamp-3" : ""}`}
                  >
                    A: {faq.answer}
                  </p>
                  {faq.answer.length > 150 && (
                    <button
                      onClick={() => toggleExpand(faq.faq_id)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm mt-2"
                    >
                      {expandedId === faq.faq_id ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 mt-10">
            No archived FAQs found.
          </p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        )}

        {/* Restore Confirmation Modal */}
        {showRestoreConfirm && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full relative">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Restore</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to restore this archived FAQ? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRestoreConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRestore(selectedItem)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-900 transition duration-200"
                >
                  Restore
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full relative">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to permanently delete this archived FAQ? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(selectedItem)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[70] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full relative">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Success</h3>
              </div>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivedFaqsPage;
