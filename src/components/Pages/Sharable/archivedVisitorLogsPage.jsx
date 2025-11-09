import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import DatePicker from '../../common/DatePicker';
import Pagination from '../../common/Pagination';
import { formatPhilippineDate, formatPhilippineTime, formatPhilippineDateTime, formatFacebookRelativeTime } from '../../../utils/timeUtils.js';
const API_BASE = "https://villagelink.site/backend/api";

const ArchivedVisitorLogsPage = () => {
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchArchivedVisitorLogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/get_archived_visitorLogs.php`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (mounted) {
          const formattedData = (data.data || data).map(log => {
            const createdAt = new Date(log.created_at);
            const dateAdjusted = new Date(createdAt.getTime() + (24 * 60 * 60 * 1000)); // add 1 day
            const timeAdjusted = new Date(createdAt.getTime() + (8 * 60 * 60 * 1000)); // add 8 hours
            const updatedAt = log.updated_at ? new Date(log.updated_at) : null;
            const timeOutAdjusted = updatedAt ? new Date(updatedAt.getTime() + (8 * 60 * 60 * 1000)) : null;
            return {
              id: log.id,
              lastName: log.last_name,
              firstName: log.first_name,
              middleName: log.middle_name,
              visitorName: [log.first_name, log.last_name].filter(Boolean).join(' '),
              contact: log.id_number,
              date: formatPhilippineDate(dateAdjusted),
              time: formatPhilippineTime(timeAdjusted),
              timeOut: timeOutAdjusted ? formatPhilippineTime(timeOutAdjusted) : null,
              purpose: log.purpose_of_visit,
              address: log.address || '',
              createdAt: createdAt, // Store the original Date object for calculations
              updatedAt: updatedAt,
            };
          });
          setVisitorLogs(formattedData);
          setFilteredData(formattedData);
          setError('');
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to fetch archived visitor logs');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchArchivedVisitorLogs();
    return () => { mounted = false; };
  }, []);

  // Filter data based on search, purpose, time period, and specific date
  useEffect(() => {
    const now = new Date();
    const phNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));

    const filtered = visitorLogs.filter(item => {
      const searchLower = (searchTerm || '').toLowerCase();
      const fields = [item.visitorName, item.address, item.date, item.time, item.purpose, item.contact].filter(Boolean);
      const matchesSearch = fields.some(f => f.toString().toLowerCase().includes(searchLower));
      const matchesPurpose = purposeFilter === 'All' || item.purpose === purposeFilter;

      // Time period filter
      let matchesTimeFilter = true;
      if (timeFilter !== 'All') {
        const phCreatedAt = new Date(item.createdAt.getTime() + (8 * 60 * 60 * 1000));

        switch (timeFilter) {
          case 'Today':
            const today = formatPhilippineDate(phNow);
            matchesTimeFilter = item.date === today;
            break;
          case 'This Week':
            const startOfWeek = new Date(phNow);
            startOfWeek.setDate(phNow.getDate() - phNow.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            matchesTimeFilter = phCreatedAt >= startOfWeek;
            break;
          case 'This Month':
            const startOfMonth = new Date(phNow.getFullYear(), phNow.getMonth(), 1);
            matchesTimeFilter = phCreatedAt >= startOfMonth;
            break;
          case 'This Year':
            const startOfYear = new Date(phNow.getFullYear(), 0, 1);
            matchesTimeFilter = phCreatedAt >= startOfYear;
            break;
          default:
            matchesTimeFilter = true;
        }
      }

      // Specific date filter
      let matchesDateFilter = true;
      if (selectedDate) {
        const selectedDateStr = formatPhilippineDate(selectedDate);
        matchesDateFilter = item.date === selectedDateStr;
      }

      return matchesSearch && matchesPurpose && matchesTimeFilter && matchesDateFilter;
    });
    setFilteredData(filtered);
  }, [searchTerm, purposeFilter, timeFilter, selectedDate, visitorLogs]);

  // Calculate paginated data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, purposeFilter, timeFilter, selectedDate]);

  const openModal = (log) => {
    setSelectedLog(log);
  };

  const closeModal = () => {
    setSelectedLog(null);
    document.body.style.overflow = 'unset';
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const openRestoreConfirm = (log) => {
    setSelectedLog(log);
    setShowRestoreConfirm(true);
  };

  const closeRestoreConfirm = () => {
    setShowRestoreConfirm(false);
    setSelectedLog(null);
  };

  const handleRestore = async (id) => {
    try {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('table', 'visitorslogs');

      const response = await fetch(`${API_BASE}/restore.php`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (result.status === 'success') {
        // Remove the restored log from the local state
        setVisitorLogs(prev => prev.filter(log => log.id !== id));
        setFilteredData(prev => prev.filter(log => log.id !== id));
        setShowRestoreConfirm(false);
        setShowSuccessModal(true);
      } else {
        throw new Error(result.message || 'Failed to restore visitor log');
      }
    } catch (err) {
      console.error('Restore error:', err);
      alert('Failed to restore visitor log: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('table', 'visitorslogs');

      const response = await fetch(`${API_BASE}/delete_archived.php`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (result.status === 'success') {
        // Remove the deleted log from the local state
        setVisitorLogs(prev => prev.filter(log => log.id !== id));
        setFilteredData(prev => prev.filter(log => log.id !== id));
        setShowDeleteConfirm(false);
        setShowDeleteSuccessModal(true);
      } else {
        throw new Error(result.message || 'Failed to delete visitor log');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete visitor log: ' + err.message);
    }
  };

  const totalVisitors = visitorLogs.length;

  // Fixed today's visitors calculation - using Philippine timezone
  const todayVisitors = visitorLogs.filter(item => {
    const now = new Date();
    const phNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const today = formatPhilippineDate(phNow);
    return item.date === today;
  }).length;

  const uniquePurposes = [...new Set(visitorLogs.map(item => item.purpose))];

  // Calculate monthly visitors in Philippine timezone
  const monthlyVisitors = visitorLogs.filter(item => {
    const phCreatedAt = new Date(item.createdAt.getTime() + (8 * 60 * 60 * 1000));
    const now = new Date();
    const phNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const startOfMonth = new Date(phNow.getFullYear(), phNow.getMonth(), 1);
    return phCreatedAt >= startOfMonth;
  }).length;

  // Calculate weekly visitors in Philippine timezone
  const weeklyVisitors = visitorLogs.filter(item => {
    const phCreatedAt = new Date(item.createdAt.getTime() + (8 * 60 * 60 * 1000));
    const now = new Date();
    const phNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const startOfWeek = new Date(phNow);
    startOfWeek.setDate(phNow.getDate() - phNow.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return phCreatedAt >= startOfWeek;
  }).length;

  // Calculate yearly visitors in Philippine timezone
  const yearlyVisitors = visitorLogs.filter(item => {
    const phCreatedAt = new Date(item.createdAt.getTime() + (8 * 60 * 60 * 1000));
    const now = new Date();
    const phNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const startOfYear = new Date(phNow.getFullYear(), 0, 1);
    return phCreatedAt >= startOfYear;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-200 p-2 px-4 rounded-3xl mb-4 transition duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Archived Visitor Logs
          </h1>
          <p className="text-gray-600 text-lg">View archived visitor logs and entries</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Archived</p>
                <p className="text-2xl font-bold text-gray-900">{totalVisitors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Archived Today</p>
                <p className="text-2xl font-bold text-gray-900">{todayVisitors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-100">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m6 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Archived This Week</p>
                <p className="text-2xl font-bold text-gray-900">{weeklyVisitors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-indigo-100">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Archived This Month</p>
                <p className="text-2xl font-bold text-gray-900">{monthlyVisitors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-orange-100">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Archived This Year</p>
                <p className="text-2xl font-bold text-gray-900">{yearlyVisitors}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm p-1 mb-6">
          <label className="block text-xs font-medium text-gray-700/70 pl-3 pt-2 mb-2">Filter</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-3 mx-4 lg:mx-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search visitors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Purposes</option>
                {uniquePurposes.map(purpose => (
                  <option key={purpose} value={purpose}>{purpose}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Period</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="This Year">This Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specific Date</label>
              <div className="relative">
                <DatePicker
                  selected={selectedDate}
                  onChange={date => setSelectedDate(date)}
                  dateFormat="MM/d/yyyy"
                  placeholderText="MM/D/YYYY"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  isClearable
                  showPopperArrow={false}
                />
              </div>
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
            <h3 className="text-xl font-semibold mb-2">No archived visitor logs</h3>
            <p className="mb-6 text-sm text-gray-600">Archived logs will appear here.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {paginatedData.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{item.visitorName}</h3>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 self-start sm:self-end">
                        {item.purpose}
                      </span>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mt-1">{formatFacebookRelativeTime(item.createdAt)}</p>
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
                        Visitor Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purpose
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.visitorName}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.date} - {item.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.timeOut ? `${item.timeOut}` : '--'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.purpose}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => openModal(item)}
                            className="text-blue-600 hover:text-blue-900 hover:underline transition duration-200"
                          >
                            View Details
                          </button>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                          <button
                            onClick={() => {
                              setSelectedLog(item);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-red-600 hover:text-red-900 transition duration-200 ml-2"
                            title="Delete"
                          >
                            <FaTrash className="w-4 h-4" />
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

            {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedLog && (
          <div className="fixed inset-0 flex justify-center items-center z-[10002] p-4 bg-black/60 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative transform transition-all duration-300 scale-100">
              <div className="p-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Visitor Log</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to permanently delete this visitor log? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(selectedLog.id)}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition duration-200 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Success Modal */}
        {showDeleteSuccessModal && (
          <div className="fixed inset-0 flex justify-center items-center z-[10003] p-4 bg-black/60 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative transform transition-all duration-300 scale-100">
              <div className="p-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Deleted!</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Visitor log deleted successfully!
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteSuccessModal(false)}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition duration-200 text-sm font-medium"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Modal */}
        {selectedLog && (
          <div
            className="fixed inset-0 flex justify-center items-center z-[9999] p-2 sm:p-4 bg-black/60 duration-300 overflow-hidden"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] relative flex flex-col overflow-hidden transform transition-all duration-300 scale-100 mx-2"
            >
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 bg-white/95 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg transition-all duration-200 border border-gray-200"
                aria-label="Close modal"
              >
                &times;
              </button>

              <div className="overflow-y-auto max-h-[85vh] sm:max-h-[90vh]">
                <div className="flex flex-col lg:flex-row">
                    <div className="w-full lg:w-2/5 bg-gradient-to-br from-blue-200/10 to-blue-500/20 p-4 sm:p-6 flex flex-col items-center justify-center">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 text-center mt-3 sm:mt-4">
                      {selectedLog.firstName} {selectedLog.lastName}
                    </h2>

                    <div className="mt-3 sm:mt-4 space-y-2 text-center">
                      <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-600">
                        <p>ID number: </p>
                        <span className="font-medium text-xs sm:text-sm">{selectedLog.contact}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-xs text-gray-600">

                        <span className="text-xs font-bold">{selectedLog.address}</span>
                      </div>
                    </div>

                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 w-full">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Visited on</p>
                        <p className="text-sm font-semibold text-gray-700">{selectedLog.date}</p>
                        <p className="text-sm text-gray-600">{selectedLog.time}</p>
                      </div>
                      <div className="mt-2 text-center bg-blue-300/30 px-2 py-1 mx-16 rounded-full fixed-center">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full text-blue-800">
                          Purpose: {selectedLog.purpose}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-3/5 p-4 sm:p-6 bg-gray-50">
                    <div className="h-full flex flex-col">
                      <div className="mb-4 sm:mb-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Visitor Details
                        </h3>
                      </div>

                    <div className="flex-1 mb-4 sm:mb-6 overflow-y-auto">
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Last Name</h4>
                          <p className="text-gray-900">{selectedLog.lastName}</p>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">First Name</h4>
                        <p className="text-gray-900">{selectedLog.firstName}</p>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Middle Name</h4>
                          <p className="text-gray-900">{selectedLog.middleName}</p>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Address</h4>
                          <p className="text-gray-900">{selectedLog.address}</p>
                        </div>
                       </div>
                      </div>

                      {/* Restore Button */}
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => openRestoreConfirm(selectedLog)}
                          className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition duration-200 text-sm font-medium"
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restore Confirmation Modal */}
        {showRestoreConfirm && selectedLog && (
          <div className="fixed inset-0 flex justify-center items-center z-[10000] p-4 bg-black/60 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative transform transition-all duration-300 scale-100">
              <div className="p-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Restore Visitor Log</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to restore this visitor log? It will be moved back to the active visitor logs.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={closeRestoreConfirm}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRestore(selectedLog.id)}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200 text-sm font-medium"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 flex justify-center items-center z-[10001] p-4 bg-black/60 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative transform transition-all duration-300 scale-100">
              <div className="p-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Success!</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Visitor log restored successfully!
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowSuccessModal(false)}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200 text-sm font-medium"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default ArchivedVisitorLogsPage;
