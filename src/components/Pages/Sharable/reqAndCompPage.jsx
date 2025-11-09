import React, { useState, useEffect } from 'react';
import SOSMap from '../../partials/SOSMap';
import { requestPollingService } from '../../../services/requestPolling';
import Avatar from '../../common/Avatar';
import Pagination from '../../common/Pagination';
import { formatPhilippineDate } from '../../../utils/timeUtils';
import { useNavigate } from 'react-router-dom'; 

const ReqAndCompPage = () => {
   const navigate = useNavigate(); // Add this line
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [comreqData, setComreqData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateRemarks, setUpdateRemarks] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [remarksError, setRemarksError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get viewed logs from localStorage (user-specific)
  const getViewedLogs = () => {
    const userId = localStorage.getItem('userId');
    const key = userId ? `viewedReqAndCompLogs_${userId}` : 'viewedReqAndCompLogs';
    try {
      const viewed = localStorage.getItem(key);
      return viewed ? JSON.parse(viewed) : [];
    } catch (e) {
      console.error('Error parsing viewedReqAndCompLogs', e);
      localStorage.removeItem(key);
      return [];
    }
  };

  // Mark log as viewed (user-specific)
  const markAsViewed = (logId) => {
    const userId = localStorage.getItem('userId');
    const key = userId ? `viewedReqAndCompLogs_${userId}` : 'viewedReqAndCompLogs';
    const viewed = getViewedLogs();
    const idStr = String(logId);
    if (!viewed.includes(idStr)) {
      viewed.push(idStr);
      localStorage.setItem(key, JSON.stringify(viewed));
    }
  };

  // Fetch data from API
  const fetchComreqData = async () => {
    try {
      setLoading(true);
      requestPollingService.checkForUpdates(); // Trigger immediate check
      const response = await fetch('https://villagelink.site/backend/api/compreq/get_comreq_logs.php');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

        if (result.status === 'success') {
          // Transform API data to match the expected format
          const backendBaseUrl = 'https://villagelink.site/backend/';
          const transformedData = result.data.map(item => {
            console.log("Profile Picture from API:", item.profile_picture); // Debug log
            const createdAt = new Date(item.created_at);
            const now = new Date();
            const isNew = (now - createdAt) < (24 * 60 * 60 * 1000) && !getViewedLogs().includes(String(item.comreq_id)); // New if within last 24 hours and not viewed
            return {
              id: item.comreq_id,
              acc_id: item.acc_id,
              resident: `${item.first_name || ''} ${item.last_name || ''}`.trim() || (item.name || item.reporter_name || 'Unknown').replace(/,/g, '').split(' ').filter((_, index, arr) => index === 0 || index === arr.length - 1).join(' '),
              profile_picture: item.profile_picture ? backendBaseUrl + item.profile_picture : '',
              avatar: '',
              firstName: (item.name || 'Unknown').replace(/,/g, '').split(' ')[0] || '',
              lastName: (item.name || 'Unknown').replace(/,/g, '').split(' ').slice(1).join(' ') || '',
              address: item.address,
              type: item.category,
              date: formatPhilippineDate(new Date(item.created_at)),
              contact: item.phone_number,
              complainText: item.content,
              files: item.comreqs_upload ? item.comreqs_upload.split(',') : [],
              remarks: item.remarks || 'No remarks available',
              locationUrl: item.coordinates && typeof item.coordinates === 'number' ? `https://maps.google.com/?q=${item.coordinates.toFixed(6)}` : 'https://maps.google.com/?q=14.796179,121.040422',
              status: item.status,
              isNew
            };
          });

        console.log("Transformed Data:", transformedData); // Debugging log
        setComreqData(transformedData);
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize polling service
  useEffect(() => {
      const handleNewRequest = (request) => {
        console.log('Admin: New request received:', request);

        // Transform the request to match our data format
        const createdAt = new Date(request.created_at || new Date());
        const now = new Date();
        const isNew = (now - createdAt) < (24 * 60 * 60 * 1000) && !getViewedLogs().includes(String(request.comreq_id));

        const transformedRequest = {
          id: request.comreq_id,
          acc_id: request.acc_id,
          resident: `${request.first_name || ''} ${request.last_name || ''}`.trim() || (request.name || item.reporter_name || 'Unknown').replace(/,/g, '').split(' ').filter((_, index, arr) => index === 0 || index === arr.length - 1).join(' '),
          profile_picture: request.profile_picture ? `https://villagelink.site/backend/${request.profile_picture}` : '',
          avatar: '',
          firstName: request.first_name || '',
          lastName: request.last_name || '',
          address: request.address,
          type: request.category,
          date: formatPhilippineDate(new Date(request.created_at || new Date().toISOString())),
          contact: request.phone_number,
          complainText: request.content,
          files: request.comreqs_upload ? request.comreqs_upload.split(',').filter(Boolean) : [],
          remarks: request.remarks || 'No remarks available',
          locationUrl: request.coordinates ? `https://maps.google.com/?q=${request.coordinates}` : 'https://maps.google.com/?q=14.796179,121.040422',
          status: request.status || 'Pending',
          isNew
        };

      // Update UI immediately
      setComreqData(prevData => {
        // Check if this request already exists
        const existingIndex = prevData.findIndex(item =>
          item.id === transformedRequest.id || item.id === request.comreq_id
        );

        if (existingIndex !== -1) {
          // Update existing request
          return prevData.map((item, index) =>
            index === existingIndex ? { ...item, ...transformedRequest } : item
          );
        } else {
          // Add new request at the beginning
          return [transformedRequest, ...prevData];
        }
      });

      // If we have a selected item and it's the one being updated, update it too
      if (selectedItem && (selectedItem.id === request.comreq_id || selectedItem.id === request.id)) {
        setSelectedItem(prev => ({
          ...prev,
          status: request.status,
          remarks: request.remarks,
          updated_at: new Date().toISOString()
        }));
      }
    };

    const handleRequestUpdate = (request) => {
      console.log('Admin: Request update received:', request);

      // Transform the request to match our data format
      const transformedRequest = {
        id: request.comreq_id,
        acc_id: request.acc_id,
        resident: `${request.first_name || ''} ${request.last_name || ''}`.trim(),
        profile_picture: request.profile_picture ? `https://villagelink.site/backend/${request.profile_picture}` : '',
        firstName: request.first_name || '',
        lastName: request.last_name || '',
        address: request.address,
        type: request.category,
        date: formatPhilippineDate(new Date(request.created_at || new Date().toISOString())),
        contact: request.phone_number,
        complainText: request.content,
        files: request.comreqs_upload ? request.comreqs_upload.split(',').filter(Boolean) : [],
        remarks: request.remarks || 'No remarks available',
        locationUrl: request.coordinates ? `https://maps.google.com/?q=${request.coordinates}` : 'https://maps.google.com/?q=14.796179,121.040422',
        status: request.status || 'Pending'
      };

      // Update UI immediately
      setComreqData(prevData => {
        // Check if this request already exists
        const existingIndex = prevData.findIndex(item =>
          item.id === transformedRequest.id || item.id === request.comreq_id
        );

        if (existingIndex !== -1) {
          // Update existing request
          return prevData.map((item, index) =>
            index === existingIndex ? { ...item, ...transformedRequest } : item
          );
        } else {
          // Add new request at the beginning
          return [transformedRequest, ...prevData];
        }
      });

      // If we have a selected item and it's the one being updated, update it too
      if (selectedItem && (selectedItem.id === request.comreq_id || selectedItem.id === request.id)) {
        setSelectedItem(prev => ({
          ...prev,
          status: request.status,
          remarks: request.remarks,
          updated_at: new Date().toISOString()
        }));
      }
    };

    requestPollingService.addListener('new_request', handleNewRequest);
    requestPollingService.addListener('request_update', handleRequestUpdate);
    requestPollingService.startPolling();

    // Initial data fetch
    fetchComreqData();

    return () => {
      requestPollingService.removeListener('new_request', handleNewRequest);
      requestPollingService.removeListener('request_update', handleRequestUpdate);
    };
  }, [selectedItem?.id]);

  // Retry function for fetching data
  const retryFetch = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoading(true);
    // The useEffect will re-run due to retryCount change
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterStatus]);

    // Fetch data from API
    useEffect(() => {
  const fetchComreqData = async () => {
    try {
      setLoading(true);
      requestPollingService.checkForUpdates(); // Trigger immediate check
      const response = await fetch('https://villagelink.site/backend/api/compreq/get_comreq_logs.php');

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status === 'success') {
          // Transform API data to match the expected format
          const backendBaseUrl = 'https://villagelink.site/backend/';
          const transformedData = result.data.map(item => {
            console.log("Profile Picture from API:", item.profile_picture); // Debug log
            return {
              id: item.comreq_id,
              resident: `${item.first_name || ''} ${item.last_name || ''}`.trim() || (item.name || item.reporter_name || 'Unknown').replace(/,/g, '').split(' ').filter((_, index, arr) => index === 0 || index === arr.length - 1).join(' '),
              profile_picture: item.profile_picture ? backendBaseUrl + item.profile_picture : '',
              avatar: '',
              firstName: (item.name || 'Unknown').replace(/,/g, '').split(' ')[0] || '',
              lastName: (item.name || 'Unknown').replace(/,/g, '').split(' ').slice(1).join(' ') || '',
              address: item.address,
              type: item.category,
              date: formatPhilippineDate(new Date(item.created_at)),
              contact: item.phone_number,
              complainText: item.content,
              files: item.comreqs_upload ? item.comreqs_upload.split(',') : [],
              remarks: item.remarks || 'No remarks available', // Ensure remarks are included
              locationUrl: item.coordinates && typeof item.coordinates === 'number' ? `https://maps.google.com/?q=${item.coordinates.toFixed(6)}` : 'https://maps.google.com/?q=14.796179,121.040422',
              status: item.status
            };
          });

          console.log("Transformed Data:", transformedData); // Debugging log
          setComreqData(transformedData);
        } else {
          throw new Error(result.message || 'Failed to fetch data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComreqData();
  }, [retryCount]);





  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
  };

  const handleStatusChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredData = comreqData.filter((item) => {
    const matchesType = filterType === 'All' || item.type === filterType;
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    const matchesSearch = searchTerm === '' ||
      item.resident.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.complainText.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const openModal = (item) => {
    console.log("Selected Item:", item); // Debugging log
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setShowUpdateForm(false);
    setUpdateRemarks('');
    setUpdateStatus('');
  };

  const handleUpdateClick = () => {
    setShowUpdateForm(true);
    setUpdateStatus(selectedItem.status);
  };

  const handleSaveUpdate = async () => {
    // Validate remarks before submission
    if (!updateRemarks.trim()) {
      setRemarksError('Remarks are required');
      return;
    }

    // Clear any previous error
    setRemarksError('');

    try {
      // Create form data for the update
      const formData = new FormData();
      formData.append('comreq_id', selectedItem.id);
      formData.append('status', updateStatus);
      formData.append('remarks', updateRemarks);

      // Make API call to update the request/complaint
      const response = await fetch('https://villagelink.site/backend/api/compreq/update_comreq.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.status === 'success') {
        console.log('Admin: Selected item for update:', selectedItem);
        
        // Create updated request object matching the exact structure from the API
        const updatedRequest = {
          comreq_id: selectedItem.id,
          id: selectedItem.id,
          acc_id: selectedItem.acc_id,
          status: updateStatus,
          remarks: updateRemarks || '',
          category: selectedItem.type || selectedItem.category,
          content: selectedItem.complainText || selectedItem.content,
          first_name: selectedItem.firstName,
          last_name: selectedItem.lastName,
          created_at: selectedItem.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          phone_number: selectedItem.contact || selectedItem.phone_number,
          coordinates: selectedItem.coordinates || selectedItem.locationUrl?.split('q=')[1],
          comreqs_upload: selectedItem.files?.join(',') || selectedItem.comreqs_upload || '',
          profile_picture: selectedItem.profile_picture || '',
          // Debug info
          _source: 'admin_update',
          _debug: {
            originalId: selectedItem.id,
            originalComreqId: selectedItem.comreq_id,
            originalAccId: selectedItem.acc_id
          }
        };
        
        console.log('Admin: Sending update with exact data:', JSON.stringify(updatedRequest, null, 2));
        
        console.log('Admin: Sending update with exact data:', JSON.stringify(updatedRequest, null, 2));
        
        console.log('Admin: Sending update with data:', updatedRequest);
        console.log('Admin: Sending update with data:', updatedRequest);

        // Notify polling service about the update
        requestPollingService.notifyListeners('updated_request', updatedRequest);

        // Show success modal
        setShowSuccessModal(true);

        // Reset form
        setShowUpdateForm(false);
        setUpdateRemarks('');
        setRemarksError('');
      } else {
        throw new Error(result.message || 'Failed to update');
      }
    } catch (error) {
      console.error('Error updating request/complaint:', error);
      alert('Failed to update: ' + error.message);
    }
  };

  const handleCancelUpdate = () => {
    setShowUpdateForm(false);
    setUpdateRemarks('');
    setUpdateStatus(selectedItem.status);
  };

  const handleArchive = async () => {
    if (!selectedItem || !['Resolved', 'Canceled'].includes(selectedItem.status)) {
      return;
    }

    try {
      const response = await fetch('https://villagelink.site/backend/api/archive.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'comreqs',
          id: selectedItem.id
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Remove the archived item from the data
        setComreqData(prevData => prevData.filter(item => item.id !== selectedItem.id));
        setShowSuccessModal(true);
        closeModal();
      } else {
        throw new Error(result.message || 'Failed to archive');
      }
    } catch (error) {
      console.error('Error archiving request/complaint:', error);
      alert('Failed to archive: ' + error.message);
    }
  };

  const handleRemarksChange = (e) => {
    setUpdateRemarks(e.target.value);
  };

  const handleStatusUpdateChange = (e) => {
    setUpdateStatus(e.target.value);
  };

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

  // Helper function to generate page numbers with ellipsis
  const getPageNumbers = (currentPage, totalPages) => {
    const pages = [];
    const delta = 2; // Number of pages to show around current page

    // Always show first page
    if (1 < currentPage - delta) {
      pages.push(1);
      if (2 < currentPage - delta) {
        pages.push('...');
      }
    }

    // Show pages around current page
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      pages.push(i);
    }

    // Always show last page
    if (totalPages > currentPage + delta) {
      if (totalPages - 1 > currentPage + delta) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Request & Complaints Management
              </h1>
              <p className="text-gray-600 text-lg">
                Track, and resolve resident requests and complaints efficiently
              </p>
            </div>
            <button
                    onClick={() => {
                      const user = JSON.parse(localStorage.getItem('user'));
                      if (user) {
                        if (user.role === 'Admin') {
                          navigate('/spLayout/archivedRequests');
                        } else if (user.role === 'President' || user.role === 'Vice President') {
                          navigate('/Pre_VPLayout/archivedRequests');
                        } else if (user.role === 'Secretary') {
                          navigate('/SecLayout/archivedRequests');
                        }
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    View Archives
                  </button>
          </div>
        </div>

        {/* Stats Cards */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-3 md:ml-4 min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">Total Reports</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{comreqData.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-yellow-100 flex-shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 md:ml-4 min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">Pending</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {comreqData.filter(item => item.status === 'Pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-red-100 flex-shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 13" />
                </svg>
              </div>
              <div className="ml-3 md:ml-4 min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">Canceled</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {comreqData.filter(item => item.status === 'Canceled').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100 flex-shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 md:ml-4 min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">Resolved</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {comreqData.filter(item => item.status === 'Resolved').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <label className="block text-xs md:text-sm font-medium text-gray-700/70 mb-2">Filter</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-3 mx-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-3 md:pr-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Type</label>
              <select
                value={filterType}
                onChange={handleFilterChange}
                className="w-full px-3 md:px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
              >
                <option value="All">All Types</option>
                <option value="Request">Requests</option>
                <option value="Complaint">Complaints</option>
              </select>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={handleStatusChange}
                className="w-full px-3 md:px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Canceled">Canceled</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-6 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 text-lg">Loading data, please wait...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 text-center">
            <p className="text-red-600 font-medium">Error: {error}</p>
            <p className="text-gray-600 mt-2">The server is currently unavailable. Please try again later.</p>
            <button
              onClick={retryFetch}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {!loading && !error && paginatedData.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {item.profile_picture ? (
                        <img
                          src={item.profile_picture}
                          alt={item.resident}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <Avatar
                          firstName={item.resident.split(' ')[0] || ''}
                          lastName={item.resident.split(' ').slice(1).join(' ') || ''}
                          fullName={item.resident}
                          alt={item.resident}
                          size={40}
                        />
                      )}
                    </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.resident}</div>
                        <div className="text-sm text-gray-500">{item.contact}</div>
                      </div>
                    </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-600 line-clamp-2">{item.address}</p>
                  <p className="text-sm text-gray-500 mt-1">{item.date}</p>
                </div>

                <div className="border-t pt-3">
                  <button
                    onClick={() => {
                      openModal(item);
                      markAsViewed(item.id);
                      setComreqData(prev => prev.map(log =>
                        log.id === item.id ? { ...log, isNew: false } : log
                      ));
                    }}
                    className="relative w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 text-sm font-medium"
                  >
                    View Details
                    {item.isNew && (
                      <span className="absolute -top-1 -right-3 h-3 w-3 bg-red-500 rounded-full"></span>
                    )}
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
                            alt={item.resident} 
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
                        onClick={() => {
                          openModal(item);
                          markAsViewed(item.id);
                          setComreqData(prev => prev.map(log =>
                            log.id === item.id ? { ...log, isNew: false } : log
                          ));
                        }}
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

        {/* Modal */}
        {showModal && selectedItem && (
          <div
           className="fixed inset-0 flex justify-center items-center z-[9999] p-2 sm:p-4 bg-black/60 transition-opacity duration-300"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl
              max-h-[95vh] sm:max-h-[90vh] relative flex flex-col overflow-hidden
              transform transition-all duration-300 scale-100 mx-2"
            >
              {/* Close Button - Repositioned for mobile */}
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 bg-white/95 hover:bg-red-50
                text-gray-600 hover:text-red-600 rounded-full w-8 h-8 sm:w-10 sm:h-10
                flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg
                transition-all duration-200 border border-gray-200"
                aria-label="Close modal"
              >
                &times;
              </button>

              {/* Scrollable Content Container */}
              <div className="overflow-y-auto max-h-[85vh] sm:max-h-[90vh]">
                {/* Mobile-Responsive Layout */}
                <div className="flex flex-col lg:flex-row">
                  {/* Top Section - Resident Info (Stacked on mobile) */}
                  <div className="w-full lg:w-2/5 bg-gradient-to-br from-blue-200/10 to-blue-500/20
                    p-4 sm:p-6 flex flex-col items-center justify-center">
                    <div className="relative mt-4">
                      <div className="shadow-xl border-4 border-white rounded-full">
                        <Avatar
                          profilePic={selectedItem.profile_picture}
                          firstName={selectedItem.firstName}
                          lastName={selectedItem.lastName}
                          fullName={selectedItem.resident}
                          alt={selectedItem.resident}
                          size={140}
                        />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-6 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-md font-semibold shadow-md ${getModalStatusColor(selectedItem.status)}`}>
                        {selectedItem.status}
                      </div>
                    </div>

                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 text-center mt-3 sm:mt-4">
                      {selectedItem.resident}
                    </h2>

                    <div className="mt-3 sm:mt-4 space-y-2 text-center">
                      <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-600">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="font-medium text-xs sm:text-sm">{selectedItem.contact}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2 mb-3 text-xs text-gray-600">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs">{selectedItem.address}</span>
                      </div>


                       {/* Location - Responsive sizing */}
                      <h4 className="text-base sm:text-md font-semibold text-gray-700 sm:mb-3 flex items-center">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Location
                        </h4>
                        <div className="mt-4 sm:mt-1 pt-3 sm:pt-4 border-t border-gray-200 w-full">
                          <SOSMap
                            address={selectedItem.address}
                            locationUrl={selectedItem.locationUrl}
                            className="rounded-lg sm:rounded-xl h-32 sm:h-48 lg:h-64 aspect-square"
                          />
                        </div>
                    </div>

                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 w-full">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Reported on</p>
                        <p className="text-sm font-semibold text-gray-700">{selectedItem.date}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section - Details (Stacked on mobile) */}
                  <div className="w-full lg:w-3/5 p-4 sm:p-6 bg-gray-50">
                    <div className="h-full flex flex-col">
                      {/* Header */}
                      <div className="mb-4 sm:mb-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {selectedItem.type}
                        </h3>
                      </div>

                      {/* Complaint Text - Auto-adjust height */}
                      <div className="flex-1 mb-4 sm:mb-6">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          Description
                        </h4>
                        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
                         <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap
                          max-h-32 overflow-y-auto px-2 py-1 break-words scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                            {selectedItem.complainText}
                          </p>
                        </div>
                      </div>

                      {/* File Container */}
                      <div className="mb-4 sm:mb-6">
                        <FileContainer files={selectedItem.files} />
                      </div>

                      {/* Display Remarks */}
                      <div className="mb-4 sm:mb-6">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Remarks
                      </h4>
                      <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap
                          max-h-28 overflow-y-auto px-2 py-1 break-words scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                          {selectedItem.remarks || 'No remarks available'}
                        </p>
                      </div>
                      </div>

                      {showUpdateForm ? (
                        <div className="mt-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Update Status
                            </label>
                            <select
                              value={updateStatus}
                              onChange={handleStatusUpdateChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Canceled">Canceled</option>
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
                            {!['Resolved', 'Canceled'].includes(selectedItem.status) && (
                              <button
                                onClick={handleUpdateClick}
                                disabled={String(selectedItem.acc_id) === localStorage.getItem('userId')}
                                className={`px-4 py-2 text-white rounded-lg transition duration-200 ${
                                  String(selectedItem.acc_id) === localStorage.getItem('userId')
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                              >
                                Update
                              </button>
                            )}
                            {!['Pending'].includes(selectedItem.status) && (
                           <button
                            onClick={handleArchive}
                            disabled={!['Resolved', 'Canceled'].includes(selectedItem.status)}
                            className={`px-4 py-2 text-white rounded-lg transition duration-200 ${
                              !['Resolved', 'Canceled'].includes(selectedItem.status)
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                          >
                            Archive
                          </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div
            className="fixed inset-0 flex justify-center items-center z-[10000] p-4 bg-black/60"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-modal-title"
          >
            <div className="bg-white rounded-lg text-center shadow-lg max-w-xs w-full p-6">
              <h2 id="success-modal-title" className="text-lg font-semibold mb-4">
                Update successful!
              </h2>
              <div className="flex justify-center">
          <button
            onClick={() => {
              setShowSuccessModal(false);
              closeModal();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
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

export default ReqAndCompPage;
