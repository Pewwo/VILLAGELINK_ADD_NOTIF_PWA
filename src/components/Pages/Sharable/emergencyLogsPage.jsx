import React, { useState, useEffect } from 'react';
import RoutingMap from '../../partials/RoutingMap';
import Avatar from '../../common/Avatar';
import DatePicker from '../../common/DatePicker';
import { emergencyPollingService } from '../../../services/emergencyPolling';
import Pagination from '../../common/Pagination';
import { useNavigate, useLocation } from 'react-router-dom';


// Format date and time as "Month Day, Year - Time"
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  date.setHours(date.getHours() + 8); // add 8 hours
  const datePart = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${datePart} - ${timePart}`;
};

const API_BASE = "https://villagelink.site/backend/api";
const BACKEND_BASE_URL = "https://villagelink.site/backend/";

const EmergencyLogsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [emergencyData, setEmergencyData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [updateRemarks, setUpdateRemarks] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [remarksError, setRemarksError] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModalText, setMessageModalText] = useState('');
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get viewed logs from localStorage (user-specific)
  const getViewedLogs = () => {
    const userId = localStorage.getItem('userId');
    const key = userId ? `viewedEmergencyLogs_${userId}` : 'viewedEmergencyLogs';
    try {
      const viewed = localStorage.getItem(key);
      return viewed ? JSON.parse(viewed) : [];
    } catch (e) {
      console.error('Error parsing viewedEmergencyLogs', e);
      localStorage.removeItem(key);
      return [];
    }
  };

  // Mark log as viewed (user-specific)
  const markAsViewed = (logId) => {
    const userId = localStorage.getItem('userId');
    const key = userId ? `viewedEmergencyLogs_${userId}` : 'viewedEmergencyLogs';
    const viewed = getViewedLogs();
    const idStr = String(logId);
    if (!viewed.includes(idStr)) {
      viewed.push(idStr);
      localStorage.setItem(key, JSON.stringify(viewed));
    }
  };

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

  // Fetch emergency data and setup polling
  useEffect(() => {
    let mounted = true;

    const fetchEmergencyData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/emergencies/get_emergency.php`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        let result;
        try {
          result = JSON.parse(text);
        } catch (jsonErr) {
          console.error('Failed to parse JSON:', jsonErr, 'Response text:', text);
          throw new Error('Invalid JSON response from server');
        }

        if (result.status === 'success' && Array.isArray(result.data)) {
          const formattedData = result.data.map(item => {
            const coords = item.realtime_coords || item.coordinates || '';
            const parsed = parseCoords(coords);
            const locationUrl = parsed ? `https://maps.google.com/?q=${parsed.lat},${parsed.lng}` : 'https://maps.google.com/?q=14.796179,121.040422';
            const relativeTime = item.created_at ? formatDateTime(item.created_at) : (item.date && item.time ? `${item.date} • ${item.time}` : '');
            const date = item.date || '';
            const time = item.time || '';
            const createdAt = new Date(item.created_at);
            const now = new Date();
            const isNew = (now - createdAt) < (24 * 60 * 60 * 1000) && !getViewedLogs().includes(String(item.emergency_id)); // New if within last 24 hours and not viewed
            return {
              id: item.emergency_id,
              acc_id: item.acc_id,
              name: (item.name || item.reporter_name || 'Unknown').replace(/,/g, '').split(' ').reverse().join(' '),
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
              realtime_coords: coords,
              isNew
            };
          });

          if (mounted) {
            setEmergencyData(formattedData);
            setFilteredData(formattedData);
            setError('');
          }
        } else {
          throw new Error(result.message || 'Failed to fetch emergency data');
        }
      } catch (err) {
        console.error('Error fetching emergency data:', err);
        if (mounted) {
          setError(err.message || 'Error');
          setEmergencyData([]);
          setFilteredData([]);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    // Initial fetch
    fetchEmergencyData();

    // Setup polling for real-time updates
    const handleNewEmergency = (newEmergency) => {
      console.log('New/Updated emergency received:', newEmergency);
      fetchEmergencyData(); // Refresh the entire list
    };

    emergencyPollingService.addListener('new_emergency', handleNewEmergency);
    emergencyPollingService.startPolling();

    return () => {
      mounted = false;
      emergencyPollingService.removeListener('new_emergency', handleNewEmergency);
    };
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
    setUpdateStatus(log.status);
    setUpdateRemarks(log.remarks || '');

    // Mark the log as viewed (remove new indicator)
    markAsViewed(log.id);
    setEmergencyData(prev => prev.map(item =>
      item.id === log.id ? { ...item, isNew: false } : item
    ));

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
    setUpdateRemarks('');
    setUpdateStatus('');
    setShowUpdateForm(false);
  };

  const handleUpdateClick = () => {
    setShowUpdateForm(true);
    setUpdateStatus(selectedLog.status);
    setUpdateRemarks('');
  };

  const handleCancelUpdate = () => {
    setShowUpdateForm(false);
    setUpdateRemarks(selectedLog.remarks || '');
    setUpdateStatus(selectedLog.status);
  };

  const handleRemarksChange = (e) => setUpdateRemarks(e.target.value);
  const handleStatusUpdateChange = (e) => setUpdateStatus(e.target.value);

  // Save update to PHP API
  const handleSaveUpdate = async () => {
    if (!selectedLog) return;

    // Validate remarks before submission
    if (!updateRemarks.trim()) {
      setRemarksError('Remarks are required');
      return;
    }
    setRemarksError('');

    try {
      const statusMap = { 'Ongoing': 'Ongoing', 'Resolved': 'Resolved' };
      const mappedStatus = statusMap[updateStatus] || updateStatus;
      const payload = {
        emergency_id: selectedLog.id,
        sos_status: mappedStatus,
        sos_remarks: updateRemarks
      };

      console.log('Sending update payload to API:', payload);

      const response = await fetch(`${API_BASE}/emergencies/update_emergency.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        mode: 'cors',
        body: JSON.stringify(payload)
      });

      let result;
      try {
        const clone = response.clone();
        result = await clone.json();
      } catch (jsonErr) {
        const text = await response.text();
        console.error('Failed to parse JSON:', jsonErr, 'Response text:', text);
        throw new Error('Invalid JSON response from server');
      }
      console.log('Update response from API:', result);

      if (result.status === 'success') {
        // Update local state
        const updatedData = emergencyData.map(item =>
          item.id === selectedLog.id ? { ...item, status: mappedStatus, remarks: updateRemarks } : item
        );
        setEmergencyData(updatedData);
        setFilteredData(updatedData);
        setShowUpdateForm(false);
        setUpdateRemarks('');

        setMessageModalText('Update successful!');
        setShowMessageModal(true);
      } else {
        throw new Error(result.message || 'Failed to update');
      }
    } catch (err) {
      console.error('Error updating emergency:', err);
      setMessageModalText('Failed to update: ' + (err.message || 'Error'));
      setShowMessageModal(true);
    }
  };

  // Archive emergency log
  const handleArchive = async () => {
    if (!selectedLog) return;

    try {
      const payload = { table: 'emergencies', id: selectedLog.id };
      console.log('Sending archive payload to API:', payload);

      const response = await fetch(`${API_BASE}/archive.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.status === 'success') {
        // Remove the archived item from local state
        setEmergencyData(prev => prev.filter(item => item.id !== selectedLog.id));
        setFilteredData(prev => prev.filter(item => item.id !== selectedLog.id));
        setShowArchiveConfirm(false);
        setMessageModalText('Emergency log archived successfully!');
        setShowMessageModal(true);
      } else {
        throw new Error(result.message || 'Failed to archive');
      }
    } catch (error) {
      console.error('Error archiving emergency log:', error);
      setMessageModalText('Failed to archive: ' + error.message);
      setShowMessageModal(true);
    }
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Emergency Logs Management
          </h1>
          <p className="text-gray-600 text-lg">Manage and track all emergency logs and SOS reports</p>
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
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
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
                <p className="text-sm font-medium text-gray-600">Ongoing</p>
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
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{completedReports}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700/70 mb-2">Filter</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 md:ml-16 mb-3 mx-3 gap-3 sm:gap-4">
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

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Archives</label>
              <button
                onClick={() => {
                  const user = JSON.parse(localStorage.getItem('user'));
                  if (user) {
                    if (user.role === 'Admin') {
                      navigate('/spLayout/archivedEmergencyLogs');
                    } else if (user.role === 'President' || user.role === 'Vice President') {
                      navigate('/Pre_VPLayout/archivedEmergencyLogs');
                    } else if (user.role === 'Secretary') {
                      navigate('/SecLayout/archivedEmergencyLogs');
                    }else if (user.role === 'Security') {
                      navigate('/Secu_RespoLayout/archivedEmergencyLogs');
                    }
                  }
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                View Archives
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
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
            <h3 className="text-xl font-semibold mb-2">No emergency logs found</h3>
            <p className="mb-6 text-sm text-gray-600">Emergency reports will appear here.</p>
          </div>
        ) : (
          <>
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
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
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
                                alt={item.name}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openModal(item)}
                            className="relative text-blue-600 hover:text-blue-900 hover:underline transition duration-200"
                          >
                            View Details
                            {item.isNew && (
                              <span className="absolute -top-1 -right-3 h-3 w-3 bg-red-500 rounded-full"></span>
                            )}
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
          </>
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
                          const formattedDateTime = selectedLog.created_at ? formatDateTime(selectedLog.created_at) : '';
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
                          <div className="bg-white rounded-lg mb-14 sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap 
                              max-h-28 overflow-y-auto px-2 py-1 break-words scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                              {selectedLog.remarks || 'No remarks available'}
                            </p>
                          </div>
                          </div>

                          {showUpdateForm ? (
                            <div className="mt-4 space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Status
                                </label>
                                <select
                                  value={updateStatus}
                                  onChange={handleStatusUpdateChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="Ongoing">Ongoing</option>
                                  <option value="Resolved">Resolved</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Remarks <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                  value={updateRemarks}
                                  onChange={handleRemarksChange}
                                  placeholder="Enter remarks for this update..."
                                  rows={3}
                                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${
                                    remarksError
                                      ? 'border-red-500 focus:border-red-500'
                                      : 'border-gray-300 focus:border-transparent'
                                  }`}
                                />
                                {remarksError && (
                                  <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {remarksError}
                                  </p>
                                )}
                              </div>

                              <div className="flex justify-end space-x-3">
                                <button
                                  onClick={handleCancelUpdate}
                                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleSaveUpdate}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1 flex justify-end space-x-3">
                                {selectedLog.status !== 'Ongoing' && (
                                  <button
                                    onClick={() => setShowArchiveConfirm(true)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
                                  >
                                    Archive
                                  </button>
                                )}
                                {selectedLog.status !== 'Resolved' && (
                                  <button
                                    onClick={handleUpdateClick}
                                    disabled={String(selectedLog.acc_id) === localStorage.getItem('userId')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                  >
                                    Update
                                  </button>
                                )}
                            </div>
                          )}

                          {showMessageModal && (
                          <div className="fixed inset-0 flex justify-center items-center z-[10000] p-4 bg-black/60">
                            <div className="bg-white rounded-lg text-center shadow-lg max-w-xs w-full p-6 ">
                              <h2 className="text-lg font-semibold mb-4">
                                {messageModalText === 'Update successful!' ? 'Update failed' : 'Update successful!'}
                              </h2>
                              <div className="flex justify-center">
                                <button
                                  onClick={() => {
                                    setShowMessageModal(false);
                                    if (messageModalText === 'Update successful!') {
                                      closeModal();
                                    }
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                                >
                                  OK
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {showArchiveConfirm && (
                          <div className="fixed inset-0 flex justify-center items-center z-[10000] p-4 bg-black/60">
                            <div className="bg-white rounded-lg text-center shadow-lg max-w-sm w-full p-6">
                              <h2 className="text-lg font-semibold mb-4">Confirm Archive</h2>
                              <p className="text-gray-600 mb-6">Are you sure you want to archive this emergency log? This action cannot be undone.</p>
                              <div className="flex justify-center space-x-3">
                                <button
                                  onClick={() => setShowArchiveConfirm(false)}
                                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleArchive}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
                                >
                                  Archive
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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

export default EmergencyLogsPage;
