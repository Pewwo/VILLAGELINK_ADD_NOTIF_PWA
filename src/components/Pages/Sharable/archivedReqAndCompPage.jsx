import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import SOSMap from '../../partials/SOSMap';
import Avatar from '../../common/Avatar';
import DatePicker from '../../common/DatePicker';
import Pagination from '../../common/Pagination';
import { formatPhilippineDate } from '../../../utils/timeUtils';

const API_BASE = "https://villagelink.site/backend/api";
const BACKEND_BASE_URL = "https://villagelink.site/backend/";

const ArchivedReqAndCompPage = () => {
  const [comreqData, setComreqData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchArchivedComreq = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/get_archived_comreq.php`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (mounted) {
          if (result.status === 'success') {
            const formattedData = result.data.map(comreq => ({
              id: comreq.comreq_id,
              acc_id: comreq.acc_id,
              resident: `${comreq.first_name || ''} ${comreq.last_name || ''}`.trim() || (comreq.name || comreq.reporter_name || 'Unknown').replace(/,/g, '').split(' ').filter((_, index, arr) => index === 0 || index === arr.length - 1).join(' '),
              profile_picture: comreq.profile_picture ? BACKEND_BASE_URL + comreq.profile_picture : '',
              firstName: (comreq.name || 'Unknown').replace(/,/g, '').split(' ')[0] || '',
              lastName: (comreq.name || 'Unknown').replace(/,/g, '').split(' ').slice(1).join(' ') || '',
              address: comreq.address,
              type: comreq.category,
              date: formatPhilippineDate(new Date(new Date(comreq.created_at).getTime() + 24 * 60 * 60 * 1000)),
              contact: comreq.phone_number,
              complainText: comreq.content,
              files: comreq.comreqs_upload ? comreq.comreqs_upload.split(',') : [],
              remarks: comreq.remarks || 'No remarks available',
              locationUrl: comreq.coordinates && typeof comreq.coordinates === 'number' ? `https://maps.google.com/?q=${comreq.coordinates.toFixed(6)}` : 'https://maps.google.com/?q=14.796179,121.040422',
              status: comreq.status
            }));
            setComreqData(formattedData);
            setFilteredData(formattedData);
            setError('');
          } else {
            throw new Error(result.message || 'Failed to fetch archived comreq');
          }
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to fetch archived comreq');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchArchivedComreq();
    return () => { mounted = false; };
  }, []);

  // Filter data based on search, type, status, and date
  useEffect(() => {
    const filtered = comreqData.filter(item => {
      const searchLower = (searchTerm || '').toLowerCase();
      const fields = [item.resident, item.address, item.complainText].filter(Boolean);
      const matchesSearch = fields.some(f => f.toString().toLowerCase().includes(searchLower));
      const matchesType = typeFilter ? item.type === typeFilter : true;
      const matchesStatus = statusFilter ? item.status === statusFilter : true;

      // Date filter
      let matchesDate = true;
      if (selectedDate) {
        const itemDate = new Date(item.date);
        const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        matchesDate = selectedDateOnly.getTime() === itemDateOnly.getTime();
      }

      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, typeFilter, statusFilter, selectedDate, comreqData]);

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

  const handleRestore = async (item) => {
    try {
      const response = await fetch(`${API_BASE}/restore.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table: 'comreqs', id: item.id }),
      });
      const result = await response.json();
      if (result.status === 'success') {
        // Remove the item from the list
        setComreqData(prev => prev.filter(comreq => comreq.id !== item.id));
        setFilteredData(prev => prev.filter(comreq => comreq.id !== item.id));
        setShowRestoreConfirm(false);
        setShowModal(false);
        setSuccessMessage('Item restored successfully');
        setShowSuccessModal(true);
      } else {
        alert('Failed to restore: ' + result.message);
      }
    } catch (error) {
      alert('Error restoring item: ' + error.message);
    }
  };

  const handleDelete = async (item) => {
    try {
      const response = await fetch(`${API_BASE}/delete_archived.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table: 'comreqs', id: item.id }),
      });
      const result = await response.json();
      if (result.status === 'success') {
        // Remove the item from the list
        setComreqData(prev => prev.filter(comreq => comreq.id !== item.id));
        setFilteredData(prev => prev.filter(comreq => comreq.id !== item.id));
        setShowDeleteConfirm(false);
        setShowModal(false);
        setSuccessMessage('Item deleted successfully');
        setShowSuccessModal(true);
      } else {
        alert('Failed to delete: ' + result.message);
      }
    } catch (error) {
      alert('Error deleting item: ' + error.message);
    }
  };

  const totalComreq = comreqData.length;

  // Calculate status counts
  const countByStatus = ['Pending', 'Canceled', 'Resolved'].reduce((acc, status) => {
    acc[status] = comreqData.filter(item => item.status === status).length;
    return acc;
  }, {});

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Canceled': return 'bg-red-100 text-red-800 border-red-200';
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Request': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Complaint': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getModalStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500 text-white';
      case 'Canceled': return 'bg-red-500 text-white';
      case 'Resolved': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // File container component
  const FileContainer = ({ files }) => {
    const [previewFile, setPreviewFile] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const getFileIcon = (fileName) => {
      const extension = fileName.split('.').pop().toLowerCase();
      switch (extension) {
        case 'pdf':
          return (
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          );
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
          return (
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          );
        case 'mp4':
        case 'mov':
        case 'avi':
        case 'wmv':
          return (
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          );
        case 'doc':
        case 'docx':
          return (
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          );
        default:
          return (
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          );
      }
    };

    const getFileName = (filePath) => {
      return filePath.split('/').pop();
    };

    const getFileUrl = (filePath) => {
      const fileName = filePath.split('/').pop();
      return `https://villagelink.site/backend/api/compreq/compreq_uploads/${fileName}`;
    };

    const getFileType = (fileName) => {
      return fileName.split('.').pop().toLowerCase();
    };

    const isImage = (fileName) => {
      const extension = getFileType(fileName);
      return ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
    };

    const isVideo = (fileName) => {
      const extension = getFileType(fileName);
      return ['mp4', 'mov', 'avi', 'wmv'].includes(extension);
    };

    const isDocument = (fileName) => {
      const extension = getFileType(fileName);
      return ['pdf', 'doc', 'docx'].includes(extension);
    };

    const handlePreview = (file) => {
      setPreviewFile(file);
      setShowPreview(true);
    };

    const closePreview = () => {
      setShowPreview(false);
      setPreviewFile(null);
    };

    if (files.length === 0) {
      return (
        <div className="bg-white rounded-lg sm:rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200 flex flex-col items-center justify-center h-48 sm:h-64">
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-500 text-sm text-center">No files submitted</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
        <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Submitted Files ({files.length})
        </h4>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {files.map((file, index) => (
            <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              {getFileIcon(file)}
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getFileName(file)}
                </p>
                <p className="text-xs text-gray-500">
                  Submitted by resident
                </p>
              </div>
              {isImage(file) || isVideo(file) || isDocument(file) ? (
                <button
                  onClick={() => handlePreview(file)}
                  className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition duration-200"
                >
                  Preview
                </button>
              ) : (
                <a
                  href={getFileUrl(file)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition duration-200"
                >
                  View
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Preview Modal */}
        {showPreview && previewFile && (
          <div className="fixed inset-0 flex justify-center items-center z-[9999] p-2 sm:p-4 bg-black/60 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] relative flex flex-col overflow-hidden transform transition-all duration-300 scale-100 mx-2">
              <button
                onClick={closePreview}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 bg-white/95 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg transition-all duration-200 border border-gray-200"
                aria-label="Close modal"
              >
                &times;
              </button>
              <div className="flex justify-between items-center p-4 sm:p-6 border-b bg-amber-950">
                <h3 className="text-lg sm:text-xl font-semibold"></h3>
              </div>
              <div className="p-4 sm:p-6 overflow-auto max-h-[70vh] sm:max-h-[75vh]">
                {isImage(previewFile) && (
                  <img
                    src={getFileUrl(previewFile)}
                    alt={getFileName(previewFile)}
                    className="w-full max-h-[60vh] object-contain rounded"
                  />
                )}
                {isVideo(previewFile) && (
                  <video
                    src={getFileUrl(previewFile)}
                    controls
                    className="w-full max-h-[60vh] rounded"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
                {isDocument(previewFile) && (
                  <div className="flex flex-col items-center">
                    <iframe
                      src={getFileUrl(previewFile)}
                      className="w-full h-[60vh] rounded"
                      title={getFileName(previewFile)}
                    />
                    <a
                      href={getFileUrl(previewFile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-200"
                    >
                      Download File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
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
            Archived Requests & Complaints
          </h1>
          <p className="text-gray-600 text-lg">View archived requests and complaints</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Archived</p>
                <p className="text-2xl font-bold text-gray-900">{totalComreq}</p>
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
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{countByStatus['Pending'] || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-red-100">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 13" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Canceled</p>
                <p className="text-2xl font-bold text-gray-900">{countByStatus['Canceled'] || 0}</p>
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
                <p className="text-2xl font-bold text-gray-900">{countByStatus['Resolved'] || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700/70 mb-2">Filter</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-3 mx-3 gap-3 sm:gap-4">
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="Request">Requests</option>
                <option value="Complaint">Complaints</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Canceled">Canceled</option>
                <option value="Resolved">Resolved</option>
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
            <h3 className="text-xl font-semibold mb-2">No archived requests & complaints</h3>
            <p className="mb-6 text-sm text-gray-600">Archived reports will appear here.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {paginatedData.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{item.resident}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mt-1">{item.date}</p>
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
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
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
                                profilePic={item.profile_picture}
                                firstName={item.resident.split(' ')[0] || ''}
                                lastName={item.resident.split(' ').slice(1).join(' ') || ''}
                                fullName={item.resident}
                                size={40}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.resident}</div>
                              <div className="text-sm text-gray-500">{item.contact}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {item.address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(item.type)}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.date}
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
                            onClick={() => { setSelectedItem(item); setShowDeleteConfirm(true); }}
                            className="text-red-600 hover:text-red-900 transition duration-200 ml-3"
                          >
                            <FaTrash />
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
            <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-4xl w-full relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute px-2 py-1 top-4 right-4 text-gray-600 hover:bg-amber-700/10 rounded-full hover:text-red-600 text-md font-bold"
                onClick={closeModal}
                aria-label="Close modal"
              >
                &#x2715;
              </button>
              <div className="flex items-center space-x-2 ml-2 mb-3">
                <Avatar fullName={selectedItem.resident} profilePic={selectedItem.profile_picture} size={40} />
                <h2 className="text-xl font-bold">{selectedItem.resident}</h2>
              </div>
              <div className="flex items-center mb-5 space-x-2 ml-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getModalStatusColor(selectedItem.status)}`}>
                  {selectedItem.status}
                </span>
                <span>{selectedItem.date}</span>
              </div>
              <p className="whitespace-pre-wrap mb-4 bg-gray-400/10 p-5 rounded-lg">{selectedItem.complainText}</p>
              <p className="whitespace-pre-wrap mb-4 bg-gray-400/10 p-5 rounded-lg">{selectedItem.remarks}</p>
              <FileContainer files={selectedItem.files} />
              <div className="flex justify-end mt-4 space-x-3">
                <button
                  onClick={() => setShowRestoreConfirm(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-900 transition duration-200"
                >
                  Restore
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Restore Confirmation Modal */}
        {showRestoreConfirm && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full relative">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Restore</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to restore this archived request/complaint? This action cannot be undone.
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
                Are you sure you want to permanently delete this archived request/complaint? This action cannot be undone.
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

export default ArchivedReqAndCompPage;
