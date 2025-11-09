import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../common/Avatar';
import DatePicker from '../../common/DatePicker';
import Pagination from '../../common/Pagination';

const API_BASE = "https://villagelink.site/backend/api";
const BACKEND_BASE_URL = "https://villagelink.site/backend/";

const ArchivedFeedBackPage = () => {
  const [feedbackData, setFeedbackData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreItemId, setRestoreItemId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchArchivedFeedback = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/get_archived_feedback.php`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.status === 'success') {
          if (mounted) {
            const formattedData = result.data.map(feedback => ({
              id: feedback.id,
              resident_name: feedback.resident_name,
              email: feedback.email,
              feedback_context: feedback.feedback_context,
              rating: feedback.rating,
              submitted_at: feedback.submitted_at,
              profile_picture: feedback.profile_picture
                ? (feedback.profile_picture.startsWith('http') ? feedback.profile_picture : BACKEND_BASE_URL + feedback.profile_picture)
                : '',
            }));
            setFeedbackData(formattedData);
            setFilteredData(formattedData);
            setError('');
          }
        } else {
          if (mounted) setError(result.message || 'Failed to fetch archived feedback');
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to fetch archived feedback');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchArchivedFeedback();
    return () => { mounted = false; };
  }, []);

  // Filter data based on search, rating, and date
  useEffect(() => {
    const filtered = feedbackData.filter(item => {
      const searchLower = (searchTerm || '').toLowerCase();
      const fields = [item.resident_name, item.email, item.feedback_context].filter(Boolean);
      const matchesSearch = fields.some(f => f.toString().toLowerCase().includes(searchLower));
      const matchesRating = ratingFilter ? item.rating === Number(ratingFilter) : true;

      // Date filter
      let matchesDate = true;
      if (selectedDate) {
        const itemDate = new Date(item.submitted_at);
        const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        matchesDate = selectedDateOnly.getTime() === itemDateOnly.getTime();
      }

      return matchesSearch && matchesRating && matchesDate;
    });
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, ratingFilter, selectedDate, feedbackData]);

  // Calculate paginated data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const openModal = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleRestore = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to restore this feedback?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/restore.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'feedback',
          id: feedbackId,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Remove the restored feedback from the archived list
        setFeedbackData(prevData => prevData.filter(item => item.id !== feedbackId));
        alert('Feedback restored successfully!');
      } else {
        alert('Failed to restore feedback: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error restoring feedback:', error);
      alert('Error restoring feedback: ' + error.message);
    }
  };

  const handleDelete = async (feedbackId) => {
    try {
      const response = await fetch(`${API_BASE}/delete_archived.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'feedback',
          id: feedbackId,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Remove the deleted feedback from the archived list
        setFeedbackData(prevData => prevData.filter(item => item.id !== feedbackId));
        setShowDeleteModal(false);
        setDeleteItemId(null);
        setShowDeleteSuccessModal(true);
      } else {
        alert('Failed to delete feedback: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Error deleting feedback: ' + error.message);
    }
  };

  const totalFeedback = feedbackData.length;

  // Calculate rating counts
  const countByRating = [5, 4, 3, 2, 1].reduce((acc, rating) => {
    acc[rating] = feedbackData.filter(item => parseInt(item.rating) === rating).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-200 p-2 px-4 rounded-3xl mb-4 transition duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Archived Feedback
          </h1>
          <p className="text-gray-600 text-lg">View archived feedback reports</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Archived</p>
                <p className="text-2xl font-bold text-gray-900">{totalFeedback}</p>
              </div>
            </div>
          </div>

          {[5, 4, 3, 2, 1].map(rating => (
            <div key={rating} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="gold" viewBox="0 0 24 24" stroke="gold" strokeWidth={2} className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.286 7.034a1 1 0 00.95.69h7.39c.969 0 1.371 1.24.588 1.81l-5.98 4.34a1 1 0 00-.364 1.118l2.287 7.034c.3.921-.755 1.688-1.54 1.118l-5.98-4.34a1 1 0 00-1.176 0l-5.98 4.34c-.784.57-1.838-.197-1.539-1.118l2.287-7.034a1 1 0 00-.364-1.118l-5.98-4.34c-.783-.57-.38-1.81.588-1.81h7.39a1 1 0 00.95-.69l2.286-7.034z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{rating} Star</p>
                  <p className="text-2xl font-bold text-gray-900">{countByRating[rating] || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700/70 mb-2">Filter</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-3 mx-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Ratings</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Ratings</option>
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Date</label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="MMMM d, yyyy"
                placeholder="Filter by date..."
                className="w-full"
                isClearable
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-b-amber-950"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-700 font-semibold text-lg">
            <p>Error: {error}</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <svg className="mx-auto h-16 w-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">No archived feedback</h3>
            <p className="mb-6 text-sm text-gray-600">Archived feedback will appear here.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {paginatedData.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{item.resident_name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="mr-1 font-semibold text-black">{item.rating ?? '0'}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="gold" viewBox="0 0 24 24" stroke="gold" strokeWidth={2} className="w-3 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.286 7.034a1 1 0 00.95.69h7.39c.969 0 1.371 1.24.588 1.81l-5.98 4.34a1 1 0 00-.364 1.118l2.287 7.034c.3.921-.755 1.688-1.54 1.118l-5.98-4.34a1 1 0 00-1.176 0l-5.98 4.34c-.784.57-1.838-.197-1.539-1.118l2.287-7.034a1 1 0 00-.364-1.118l-5.98-4.34c-.783-.57-.38-1.81.588-1.81h7.39a1 1 0 00.95-.69l2.286-7.034z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mt-1">{new Date(item.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="border-t pt-3">
                      <button
                        onClick={() => openModal(item)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resident
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Restore
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delete
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <Avatar
                                fullName={item.resident_name}
                                profilePic={item.profile_picture}
                                size={40}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.resident_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {item.email || '--'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="mr-1 font-semibold text-black">{item.rating ?? '0'}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="gold" viewBox="0 0 24 24" stroke="gold" strokeWidth={2} className="w-3 h-4 mb-0.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.286 7.034a1 1 0 00.95.69h7.39c.969 0 1.371 1.24.588 1.81l-5.98 4.34a1 1 0 00-.364 1.118l2.287 7.034c.3.921-.755 1.688-1.54 1.118l-5.98-4.34a1 1 0 00-1.176 0l-5.98 4.34c-.784.57-1.838-.197-1.539-1.118l2.287-7.034a1 1 0 00-.364-1.118l-5.98-4.34c-.783-.57-.38-1.81.588-1.81h7.39a1 1 0 00.95-.69l2.286-7.034z" />
                            </svg>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.submitted_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openModal(item)}
                            className="text-blue-600 hover:underline hover:text-blue-900 transition duration-200"
                          >
                            View Details
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setRestoreItemId(item.id);
                              setShowRestoreModal(true);
                            }}
                            className="text-green-600 hover:underline hover:text-green-900 transition duration-200"
                          >
                            Restore
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setDeleteItemId(item.id);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:underline hover:text-red-900 transition duration-200"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        )}

        {/* Modal */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-sm sm:max-w-lg w-full relative">
              <button
                className="absolute px-2 py-1 top-4 right-4 text-gray-600 hover:bg-amber-700/10 rounded-full hover:text-red-600 text-md font-bold"
                onClick={closeModal}
                aria-label="Close modal"
              >
                &#x2715;
              </button>
              <div className="flex items-center space-x-2 ml-2 mb-3">
                <Avatar fullName={selectedItem.resident_name} profilePic={selectedItem.profile_picture} size={40} />
                <h2 className="text-xl font-bold">{selectedItem.resident_name}</h2>
              </div>
              <div className="flex items-center mb-5 space-x-2 ml-4">
                <span className="font-semibold">{selectedItem.rating ?? '0'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="gold" viewBox="0 0 24 24" stroke="gold" strokeWidth={2} className="w-3 h-5 pb-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.286 7.034a1 1 0 00.95.69h7.39c.969 0 1.371 1.24.588 1.81l-5.98 4.34a1 1 0 00-.364 1.118l2.287 7.034c.3.921-.755 1.688-1.54 1.118l-5.98-4.34a1 1 0 00-1.176 0l-5.98 4.34c-.784.57-1.838-.197-1.539-1.118l2.287-7.034a1 1 0 00-.364-1.118l-5.98-4.34c-.783-.57-.38-1.81.588-1.81h7.39a1 1 0 00.95-.69l2.286-7.034z" />
                </svg>
                <span>{new Date(selectedItem.submitted_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <p className="whitespace-pre-wrap mb-4 bg-gray-400/10 p-5 rounded-lg">{selectedItem.feedback_context}</p>
            </div>
          </div>
        )}

        {/* Restore Confirmation Modal */}
        {showRestoreModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative">
              <h2 className="text-xl font-bold mb-4">Confirm Restore</h2>
              <p className="text-gray-600 mb-6">Are you sure you want to restore this feedback? This action will move it back to the active feedback list.</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowRestoreModal(false);
                    setRestoreItemId(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!restoreItemId) return;

                    try {
                      const response = await fetch(`${API_BASE}/restore.php`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          table: 'feedback',
                          id: restoreItemId,
                        }),
                      });

                      const result = await response.json();

                      if (result.status === 'success') {
                        // Remove the restored feedback from the archived list
                        setFeedbackData(prevData => prevData.filter(item => item.id !== restoreItemId));
                        setShowRestoreModal(false);
                        setRestoreItemId(null);
                        setShowSuccessModal(true);
                      } else {
                        alert('Failed to restore feedback: ' + (result.message || 'Unknown error'));
                      }
                    } catch (error) {
                      console.error('Error restoring feedback:', error);
                      alert('Error restoring feedback: ' + error.message);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                >
                  Restore
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative">
              <h2 className="text-xl font-bold mb-4 text-green-600">Success!</h2>
              <p className="text-gray-600 mb-6">Feedback restored successfully!</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative">
              <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
              <p className="text-gray-600 mb-6">Are you sure you want to permanently delete this feedback? This action cannot be undone.</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteItemId(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!deleteItemId) return;
                    handleDelete(deleteItemId);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Success Modal */}
        {showDeleteSuccessModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative">
              <h2 className="text-xl font-bold mb-4 text-red-600">Deleted!</h2>
              <p className="text-gray-600 mb-6">Feedback deleted successfully!</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDeleteSuccessModal(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
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

export default ArchivedFeedBackPage;
