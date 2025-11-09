import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaUndo } from 'react-icons/fa';
import RoutingMap from '../../partials/RoutingMap';
import Avatar from '../../common/Avatar';
import DatePicker from '../../common/DatePicker';
import Pagination from '../../common/Pagination';
import { formatPhilippineDate, formatPhilippineTime, formatPhilippineDateTime, formatFacebookRelativeTime } from '../../../utils/timeUtils.js';

const API_BASE = "https://villagelink.site/backend/api";
const BACKEND_BASE_URL = "https://villagelink.site/backend/";

const ArchivedEmergencyLogsPage = () => {
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [emergencyData, setEmergencyData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Utility: parse coords string like "lat,lon" => {lat, lng} or null
  const parseCoords = (coords) => {
    if (!coords || typeof coords !== 'string') return null;
    const parts = coords.split(',').map(p => p.trim());
    if (parts.length < 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  };

  // Fetch archived emergency data
  useEffect(() => {
    let mounted = true;

    const fetchArchivedEmergencyData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/get_archived_emergency.php`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (result.status === 'success' && Array.isArray(result.data)) {
          const formattedData = result.data.map(item => {
            const coords = item.realtime_coords || item.coordinates || '';
            const parsed = parseCoords(coords);
            const locationUrl = parsed ? `https://maps.google.com/?q=${parsed.lat},${parsed.lng}` : 'https://maps.google.com/?q=14.796179,121.040422';
            const relativeTime = item.created_at ? formatPhilippineDateTime(item.created_at) : '';
            const date = item.created_at ? formatPhilippineDate(item.created_at) : '';
            const time = item.created_at ? formatPhilippineTime(item.created_at) : '';
            return {
              id: item.emergency_id,
              acc_id: item.acc_id,
              name: (item.reporter_name || 'Unknown').replace(/,/g, '').split(' ').reverse().join(' '),
              profile_picture: item.profile_picture ? BACKEND_BASE_URL + item.profile_picture : '',
              avatar: '',
              contact: item.phone_number || '',
              address: item.address || '',
              date,
              time,
              relativeTime,
              status: item.sos_status || 'Ongoing',
              locationUrl,
              remarks: item.sos_remarks || '',
              created_at: item.created_at,
              realtime_coords: coords
            };
          });

          if (mounted) {
            setEmergencyData(formattedData);
            setFilteredData(formattedData);
            setError('');
          }
        } else {
          throw new Error(result.message || 'Failed to fetch archived emergency data');
        }
      } catch (err) {
        console.error('Error fetching archived emergency data:', err);
        if (mounted) {
          setError(err.message || 'Error');
          setEmergencyData([]);
          setFilteredData([]);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchArchivedEmergencyData();
    return () => { mounted = false; };
  }, []);

  // Filter data based on search, status, and date
  useEffect(() => {
    const filtered = emergencyData.filter(item => {
      const searchLower = (searchTerm || '').toLowerCase();
      const fields = [item.name, item.address, item.date, item.time, item.status, item.contact].filter(Boolean);
      const matchesSearch = fields.some(f => f.toString().toLowerCase().includes(searchLower));
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      // Date filtering logic
      let matchesDate = true;
      if (selectedDate) {
        const itemDate = new Date(item.created_at || item.date);
        const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        matchesDate = selectedDateOnly.getTime() === itemDateOnly.getTime();
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, selectedDate, emergencyData]);

  // Calculate paginated data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const openModal = (log) => {
    setSelectedLog(log);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationError('');
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get your current location');
          setCurrentLocation(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser');
      setCurrentLocation(null);
    }
  };

  const closeModal = () => {
    setSelectedLog(null);
    setCurrentLocation(null);
    setLocationError('');
  };

  const totalReports = emergencyData.length;
  const ongoingReports = emergencyData.filter(i => i.status === 'Ongoing').length;
  const completedReports = emergencyData.filter(i => i.status === 'Resolved').length;

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    const normalized = status.toLowerCase();
    if (normalized.includes('ongoing')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (normalized.includes('resolved')) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getModalStatusColor = (status) => {
    switch (status) {
      case 'Ongoing': return 'bg-yellow-500 text-white';
      case 'Resolved': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Handle restore emergency log
  const handleRestore = async (logId) => {
    try {
      const formData = new URLSearchParams();
      formData.append('table', 'emergencies');
      formData.append('id', logId);

      const response = await fetch(`${API_BASE}/restore.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Refresh the data
        const fetchResponse = await fetch(`${API_BASE}/get_archived_emergency.php`);
        const fetchResult = await fetchResponse.json();

        if (fetchResult.status === 'success' && Array.isArray(fetchResult.data)) {
          const formattedData = fetchResult.data.map(item => {
            const coords = item.realtime_coords || item.coordinates || '';
            const parsed = parseCoords(coords);
            const locationUrl = parsed ? `https://maps.google.com/?q=${parsed.lat},${parsed.lng}` : 'https://maps.google.com/?q=14.796179,121.040422';
            const relativeTime = item.created_at ? formatPhilippineDateTime(item.created_at) : '';
            const date = item.created_at ? formatPhilippineDate(item.created_at) : '';
            const time = item.created_at ? formatPhilippineTime(item.created_at) : '';
            return {
              id: item.emergency_id,
              acc_id: item.acc_id,
              name: (item.reporter_name || 'Unknown').replace(/,/g, '').split(' ').reverse().join(' '),
              profile_picture: item.profile_picture ? BACKEND_BASE_URL + item.profile_picture : '',
              avatar: '',
              contact: item.phone_number || '',
              address: item.address || '',
              date,
              time,
              relativeTime,
              status: item.sos_status || 'Ongoing',
              locationUrl,
              remarks: item.sos_remarks || '',
              created_at: item.created_at,
              realtime_coords: coords
            };
          });

          setEmergencyData(formattedData);
          setFilteredData(formattedData);
          setSelectedLog(null);
          setShowRestoreConfirm(false);
          setSuccessMessage('Emergency log restored successfully!');
          setShowSuccessModal(true);
        }
      } else {
        throw new Error(result.message || 'Failed to restore emergency log');
      }
    } catch (err) {
      console.error('Error restoring emergency log:', err);
      alert('Failed to restore emergency log: ' + err.message);
    }
  };

  const openRestoreConfirm = (log) => {
    setSelectedLog(log);
    setShowRestoreConfirm(true);
  };

  const closeRestoreConfirm = () => {
    setShowRestoreConfirm(false);
  };

  // Handle delete emergency log
  const handleDelete = async (logId) => {
    try {
      const formData = new URLSearchParams();
      formData.append('table', 'emergencies');
      formData.append('id', logId);

      const response = await fetch(`${API_BASE}/delete_archived.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Refresh the data
        const fetchResponse = await fetch(`${API_BASE}/get_archived_emergency.php`);
        const fetchResult = await fetchResponse.json();

        if (fetchResult.status === 'success' && Array.isArray(fetchResult.data)) {
          const formattedData = fetchResult.data.map(item => {
            const coords = item.realtime_coords || item.coordinates || '';
            const parsed = parseCoords(coords);
            const locationUrl = parsed ? `https://maps.google.com/?q=${parsed.lat},${parsed.lng}` : 'https://maps.google.com/?q=14.796179,121.040422';
            const relativeTime = item.created_at ? formatPhilippineDateTime(item.created_at) : '';
            const date = item.created_at ? formatPhilippineDate(item.created_at) : '';
            const time = item.created_at ? formatPhilippineTime(item.created_at) : '';
            return {
              id: item.emergency_id,
              acc_id: item.acc_id,
              name: (item.reporter_name || 'Unknown').replace(/,/g, '').split(' ').reverse().join(' '),
              profile_picture: item.profile_picture ? BACKEND_BASE_URL + item.profile_picture : '',
              avatar: '',
              contact: item.phone_number || '',
              address: item.address || '',
              date,
              time,
              relativeTime,
              status: item.sos_status || 'Ongoing',
              locationUrl,
              remarks: item.sos_remarks || '',
              created_at: item.created_at,
              realtime_coords: coords
            };
          });

          setEmergencyData(formattedData);
          setFilteredData(formattedData);
          setSelectedLog(null);
          setShowDeleteConfirm(false);
          setSuccessMessage('Emergency log deleted successfully!');
          setShowSuccessModal(true);
        }
      } else {
        throw new Error(result.message || 'Failed to delete emergency log');
      }
    } catch (err) {
      console.error('Error deleting emergency log:', err);
      alert('Failed to delete emergency log: ' + err.message);
    }
  };

  const openDeleteConfirm = (log) => {
    setSelectedLog(log);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
  };

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
            Archived Emergency Logs
          </h1>
          <p className="text-gray-600 text-lg">View archived emergency logs and SOS reports</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Archived</p>
                <p className="text-2xl font-bold text-gray-900">{totalReports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-yellow-100">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Archived Ongoing</p>
                <p className="text-2xl font-bold text-gray-900">{ongoingReports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Archived Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{completedReports}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700/70 mb-2">Filter</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-3 mx-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search reports..."
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Status</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Date</label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                placeholder="Filter by date..."
                dateFormat="MMMM d, yyyy"
                className="w-full"
                isClearable
              />
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {paginatedData.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {item.profile_picture ? (
                        <img
                          src={item.profile_picture}
                          alt={item.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <Avatar
                          firstName={item.name.split(' ')[0] || ''}
                          lastName={item.name.split(' ').slice(1).join(' ') || ''}
                          fullName={item.name}
                          alt={item.name}
                          size={40}
                        />
                      )}
                    </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.contact}</div>
                      </div>
                    </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-600 line-clamp-2">{item.address}</p>
                  <p className="text-sm text-gray-500 mt-1">{item.relativeTime}</p>
                </div>

                <div className="border-t pt-3 flex justify-center">
                  <button
                    onClick={() => openModal(item)}
                    className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-200 text-sm font-medium"
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
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

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
                            profilePic={item.profile_picture}
                            firstName={item.name.split(' ')[0] || ''}
                            lastName={item.name.split(' ').slice(1).join(' ') || ''}
                            fullName={item.name}
                            size={40}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.contact}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.relativeTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                      <button
                        onClick={() => openModal(item)}
                        className="text-blue-600 hover:text-blue-900 hover:underline transition duration-200 "
                      >
                        View Details
                      </button>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                      <button
                        onClick={() => openDeleteConfirm(item)}
                        className="text-red-600 hover:text-red-900 p-1 rounded transition duration-200"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        )}

        {/* Modal */}
        {selectedLog && (
          <div
            className="fixed inset-0 flex justify-center items-center z-[9999] p-2 sm:p-4 bg-black/60 transition-opacity duration-300"
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
                    <div className="relative mt-4">
                      <div className="shadow-xl border-4 border-white rounded-full inline-block relative">
                        <Avatar
                          profilePic={selectedLog.profile_picture}
                          firstName={selectedLog.name.split(' ')[0] || ''}
                          lastName={selectedLog.name.split(' ').slice(1).join(' ') || ''}
                          fullName={selectedLog.name}
                          alt={selectedLog.name}
                          size={140}
                        />
                        <div className={`absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-6 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-md font-semibold shadow-md ${getModalStatusColor(selectedLog.status)}`}>
                          {selectedLog.status}
                        </div>
                      </div>
                    </div>

                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 text-center mt-3 sm:mt-4">
                      {selectedLog.name}
                    </h2>

                    <div className="mt-3 sm:mt-4 space-y-2 text-center">
                      <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-600">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="font-medium text-xs sm:text-sm">{selectedLog.contact}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2 mb-3 text-xs text-gray-600">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs">{selectedLog.address}</span>
                      </div>
                    </div>

                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 w-full">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Reported on</p>
                        {(() => {
                          const formattedDateTime = selectedLog.created_at ? formatPhilippineDateTime(selectedLog.created_at) : '';
                          const [formattedDate, formattedTime] = formattedDateTime.split(' - ');
                          return (
                            <>
                              <p className="text-sm font-semibold text-gray-700">{formattedDate}</p>
                              <p className="text-sm text-gray-600">{formattedTime}</p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-3/5 p-4 sm:p-6 bg-gray-50">
                    <div className="h-full flex flex-col">
                      <div className="mb-4 sm:mb-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Emergency Location
                        </h3>
                      </div>

                      <div className="flex-1">
                        <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-gray-200">
                          <RoutingMap
                            startLocation={currentLocation}
                            endLocation={{
                              latitude: selectedLog.realtime_coords ? selectedLog.realtime_coords.split(',')[0].trim() : null,
                              longitude: selectedLog.realtime_coords ? selectedLog.realtime_coords.split(',')[1].trim() : null,
                            }}
                            endLocationLabel={selectedLog.address}
                            className="rounded-lg sm:rounded-xl h-48 sm:h-64"
                          />
                        </div>

                          {/* Display Remarks */}
                          <div className=" mt-6 mb-4 sm:mb-6">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Remarks
                          </h4>
                          <div className="bg-white rounded-lg mb-4 sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap
                              max-h-28 overflow-y-auto px-2 py-1 break-words scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                              {selectedLog.remarks || 'No remarks available'}
                            </p>
                          </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-3 mt-4">
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Restore Emergency Log</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to restore this emergency log? It will be moved back to the active emergency logs.
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedLog && (
          <div className="fixed inset-0 flex justify-center items-center z-[10000] p-4 bg-black/60 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative transform transition-all duration-300 scale-100">
              <div className="p-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Emergency Log</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to permanently delete this emergency log? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={closeDeleteConfirm}
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
                    Emergency log restored successfully!
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
};

export default ArchivedEmergencyLogsPage;
