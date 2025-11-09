import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Send, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { requestPollingService } from '../../../services/requestPolling';
import Avatar from '../../common/Avatar';
import SOSMap from '../../partials/SOSMap';
import Pagination from '../../common/Pagination';

const ReqAndCompRes = () => {
  const [viewMode, setViewMode] = useState('submit'); // 'submit' or 'view'

  // State for submission form
  const [category, setCategory] = useState('Complaint');
  const [files, setFiles] = useState([]);
  const [textFieldValue, setTextFieldValue] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // State for viewing submitted requests
  const [submittedData, setSubmittedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter states
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDate, setFilterDate] = useState('');



  // Submission details modal state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  // Close modal function
  const closeSubmissionModal = () => {
    setShowSubmissionModal(false);
    setSelectedSubmission(null);
  };

  // Setup polling service
  useEffect(() => {
    let isMounted = true;
    console.log('User: Setting up polling service');

    const handleRequestUpdate = async (request) => {
      if (!isMounted) return;
      const currentUserId = localStorage.getItem('userId');

      // If we received a specific request update, handle it immediately
      if (request && viewMode === 'view') {
        // Only log when we receive an actual update
        console.log('User: Received status update for request:', {
          id: request.comreq_id,
          newStatus: request.status
        });

        setSubmittedData(prevData => {
          return prevData.map(item => {
            // Match by both comreq_id and id since they might be swapped
            if (String(item.comreq_id) === String(request.comreq_id) || 
                String(item.comreq_id) === String(request.id) ||
                String(item.id) === String(request.comreq_id)) {
              return {
                ...item,
                status: request.status,
                remarks: request.remarks || item.remarks,
                updated_at: new Date().toISOString()
              };
            }
            return item;
          });
        });

        // Show notification for status update
        if (request.status && request.status !== 'Pending') {
          console.log(`Your request has been ${request.status.toLowerCase()}`);
        }
      }

      // Then fetch fresh data to ensure we're in sync
      try {
        const response = await fetch(`https://villagelink.site/backend/api/compreq/get_comreq_logs.php?acc_id=${currentUserId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        if (result.status === 'success' && isMounted) {
        const filteredData = result.data.filter(item => item.acc_id == currentUserId);

        // Transform data to include resident_name, contact_number, profile_picture
        const transformedData = filteredData.map(item => ({
          ...item,
          resident_name: `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown',
          contact_number: item.phone_number || '',
          profile_picture: item.profile_picture ? `https://villagelink.site/backend/${item.profile_picture}` : '',
          files: item.comreqs_upload ? item.comreqs_upload.split(',').filter(Boolean) : [],
        }));

        if (viewMode === 'view') {
          setSubmittedData(transformedData);
        }
        }
      } catch (error) {
        console.error('Error fetching updates:', error);
      }
    };

    // Start polling service and add listener
    requestPollingService.addListener('request_update', handleRequestUpdate);
    requestPollingService.startPolling();

    // Initial fetch
    if (viewMode === 'view') {
      handleRequestUpdate();
    }

    // Cleanup function
    return () => {
      console.log('User: Cleaning up polling service');
      isMounted = false;
      requestPollingService.removeListener('request_update', handleRequestUpdate);
      requestPollingService.stopPolling();
    };
  }, [viewMode, submittedData]); // Include submittedData since we use it for comparison

  // Handle initial data fetch for view mode
  useEffect(() => {
    if (viewMode === 'view') {
      console.log('User: View mode is My Submissions, fetching initial data');
      fetchSubmittedData();
      setCurrentPage(1);
    }
  }, [viewMode]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterCategory, filterDate]);

  const fetchSubmittedData = async () => {
    // Only show loading state on initial fetch
    if (!submittedData.length) {
      setLoading(true);
    }
    setError(null);
    
    const acc_id = localStorage.getItem('userId');
    try {
      const response = await fetch(`https://villagelink.site/backend/api/compreq/get_comreq_logs.php?acc_id=${acc_id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.status === 'success') {
        // Filter data to only show submissions by the logged-in user
        const filteredData = result.data.filter(item => item.acc_id == acc_id);

        // Transform data to include resident_name, contact_number, profile_picture
        const transformedData = filteredData.map(item => ({
          ...item,
          resident_name: `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown',
          contact_number: item.phone_number || '',
          profile_picture: item.profile_picture ? `https://villagelink.site/backend/${item.profile_picture}` : '',
          files: item.comreqs_upload ? item.comreqs_upload.split(',').filter(Boolean) : [],
        }));
        
        // Update local state
        setSubmittedData(transformedData);
        
        console.log('User: Initial data fetched and stored:', transformedData);
      } else {
        throw new Error(result.message || 'Failed to fetch submitted requests');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleTextFieldChange = (e) => {
    setTextFieldValue(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!textFieldValue || !category) {
      alert("Please fill in all fields.");
      return;
    }

    const acc_id = localStorage.getItem('userId');
    console.log("Submitting request with data:", {
      acc_id: acc_id,
      category,
      content: textFieldValue,
      files,
    });

    const formData = new FormData();
    formData.append("acc_id", acc_id);
    formData.append("category", category);
    formData.append("content", textFieldValue);

    files.forEach((file) => {
      formData.append("files[]", file);
    });

    try {
      const response = await fetch("https://villagelink.site/backend/api/compreq/save_comreq.php", {
        method: "POST",
        body: formData,
      });

      const rawResponse = await response.text();
      console.log("Response Status:", response.status);
      console.log("Response Headers:", response.headers);
      console.log("Raw response:", rawResponse);

      if (rawResponse.startsWith("<")) {
        throw new Error("Backend returned HTML instead of JSON:\n" + rawResponse);
      }

      let result;
      try {
        result = JSON.parse(rawResponse);
      } catch (e) {
        throw new Error("Invalid JSON from backend:\n" + rawResponse);
      }

      if (result.status === "success") {
        setIsSubmitted(true);
        setTextFieldValue("");
        setFiles([]);

        // Trigger polling service to check for updates
        requestPollingService.checkForUpdates();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Something went wrong.");
    }
  };

  // File preview functions
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

  const getFileType = (fileName) => {
    return fileName.split('.').pop().toLowerCase();
  };

  const getFileUrl = (filePath) => {
    const fileName = filePath.split('/').pop();
    return `https://villagelink.site/backend/api/compreq/compreq_uploads/${fileName}`;
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

  const FileContainer = ({ files }) => {
    const [previewFile, setPreviewFile] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
            <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] w-180 overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b bg-amber-950">
                <h3 className="text-lg font-semibold"></h3>
                <button
                  onClick={closePreview}
                  className="text-white hover:text-red-700 transition duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 overflow-auto max-h-[70vh]">
                {isImage(previewFile) && (
                  <img
                    src={getFileUrl(previewFile)}
                    alt={getFileName(previewFile)}
                    className="max-w-full max-h-[60vh] mx-auto object-contain"
                  />
                )}
                {isVideo(previewFile) && (
                  <video
                    src={getFileUrl(previewFile)}
                    controls
                    className="max-w-full max-h-[60vh] mx-auto"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
                {isDocument(previewFile) && (
                  <div className="flex flex-col items-center">
                    <iframe
                      src={getFileUrl(previewFile)}
                      className="w-full h-[60vh]"
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4 mr-1" />;
      case 'Resolved': return <CheckCircle className="w-4 h-4 mr-1" />;
      case 'Canceled': return <XCircle className="w-4 h-4 mr-1" />;
      default: return <Clock className="w-4 h-4 mr-1" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Canceled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter data
  const filteredData = submittedData.filter(item => {
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesDate = !filterDate || new Date(item.created_at).toDateString() === new Date(filterDate).toDateString();
    return matchesStatus && matchesCategory && matchesDate;
  });

  // Calculate paginated data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-5xl sm:text-5xl font-bold text-blue-950 mb-4 ">
          Requests & Complaints
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Submit your requests or complaints to the HOA Office
        </p>
        
        {/* Mode Toggle */}
        <div className="inline-flex bg-gray-100 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setViewMode('submit')}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center ${
              viewMode === 'submit' 
                ? 'bg-white text-blue-600 shadow-md' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Send className="w-4 h-4 mr-2" />
            Submit New
          </button>
          <button
            onClick={() => setViewMode('view')}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center ${
              viewMode === 'view' 
                ? 'bg-white text-blue-600 shadow-md' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            My Submissions
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        {viewMode === 'submit' ? (
          isSubmitted ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Submission Successful!</h3>
              <p className="text-gray-600 mb-8 text-lg">
                Your {category.toLowerCase()} has been submitted successfully and is now under review.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="px-8 py-3 bg-blue-800 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                Submit Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Category Selection */}
              <div className="space-y-2">
                <label className="block text-lg font-semibold text-gray-800">
                  Type of Submission
                </label>
                <select
                  value={category}
                  onChange={handleCategoryChange}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg bg-gray-50 hover:bg-white transition-colors duration-200"
                >
                  <option value="Complaint">Complaint</option>
                  <option value="Request">Request</option>
                </select>
              </div>

              {/* Text Field */}
              <div className="space-y-2">
                <label className="block text-lg font-semibold text-gray-800">
                  {category === 'Complaint' ? 'Complaint Details' : 'Request Details'}
                </label>
                <textarea
                  value={textFieldValue}
                  onChange={handleTextFieldChange}
                  placeholder={`Please describe your ${category.toLowerCase()} in detail...`}
                  rows={8}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg bg-gray-50 hover:bg-white transition-colors duration-200 resize-none"
                  required
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="block text-lg font-semibold text-gray-800">
                  Attachments (Optional)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-70 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200 p-6">
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="w-12 h-12 mb-4 text-gray-400" />
                      <p className="text-lg font-semibold text-gray-600 mb-2">
                        Click to upload files
                      </p>
                      <p className="text-sm text-gray-500 text-center">
                        Supported formats: PDF, JPG, PNG, MP4, DOC<br />
                        Maximum file size: 10MB each
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.mp4,.mov,.avi,.wmv,.doc,.docx"
                    />
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm font-semibold text-blue-800 mb-2">Selected files:</p>
                    <ul className="space-y-2">
                      {files.map((file, index) => (
                        <li key={index} className="flex items-center text-sm text-blue-700 bg-white rounded-lg p-3 shadow-sm">
                          <FileText className="w-4 h-4 mr-2" />
                          {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>


              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 px-4 bg-blue-800 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                <Send className="w-5 h-5 mr-3" />
                Submit {category}
              </button>
            </form>
          )
        ) : (
          <div>
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
                <p className="text-gray-600 text-lg">Loading your submissions...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-red-50 rounded-2xl">
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading Submissions</h3>
                <p className="text-red-600">{error}</p>
              </div>
            ) : submittedData.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Submissions Yet</h3>
                <p className="text-gray-600">You haven't submitted any requests or complaints yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <FileText className="w-6 h-6 mr-3 text-blue-600" />
                  My Submissions ({filteredData.length})
                </h2>

                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700/70 mb-2">Filter</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mx-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Canceled">Canceled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Category</label>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="All">All Categories</option>
                        <option value="Complaint">Complaint</option>
                        <option value="Request">Request</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Date Submitted</label>
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Submitted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((item) => (
                      <tr key={item.comreq_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.category === 'Complaint' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                            <span className="flex items-center">
                              {getStatusIcon(item.status)}
                              {item.status}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSubmission(item);
                              setShowSubmissionModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {paginatedData.map((item) => (
                  <div key={item.comreq_id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.category === 'Complaint' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {item.category}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        <span className="flex items-center">
                          {getStatusIcon(item.status)}
                          {item.status}
                        </span>
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mb-3">
                      Submitted: {formatDate(item.created_at)}
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedSubmission(item);
                          setShowSubmissionModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                />
              )}
              </div>
            )}
          </div>
        )}


    {/* Submission Details Modal */}
    {showSubmissionModal && selectedSubmission && (
      <div
        className="fixed inset-0 flex justify-center items-center z-[9999] p-2 sm:p-4
        bg-black/60 transition-opacity duration-300"
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl
          max-h-[85vh] sm:max-h-[90vh] relative flex flex-col overflow-hidden
          transform transition-all duration-300 scale-100 mx-2"
        >
          {/* Close Button - Repositioned for mobile */}
          <button
            onClick={closeSubmissionModal}
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
                      profilePic={selectedSubmission.profile_picture}
                      firstName={(selectedSubmission.resident_name || '').split(' ')[0] || ''}
                      lastName={(selectedSubmission.resident_name || '').split(' ').slice(1).join(' ') || ''}
                      fullName={selectedSubmission.resident_name || 'Unknown'}
                      alt={selectedSubmission.resident_name || 'Resident'}
                      size={140}
                    />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-6 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-md font-semibold shadow-md ${getStatusColor(selectedSubmission.status)}`}>
                    {selectedSubmission.status}
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 text-center mt-3 sm:mt-4">
                  {selectedSubmission.resident_name || 'Unknown'}
                </h2>

                <div className="mt-3 sm:mt-4 space-y-2 text-center">
                  <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-600">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="font-medium text-xs sm:text-sm">{selectedSubmission.contact_number || ''}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 mb-3 text-xs text-gray-600">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs">{selectedSubmission.address || ''}</span>
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
                        address={selectedSubmission.address}
                        locationUrl={`https://maps.google.com/?q=${selectedSubmission.coordinates || '14.796179,121.040422'}`}
                        className="rounded-lg sm:rounded-xl h-32 sm:h-48 lg:h-64 aspect-square"
                      />
                    </div>
                </div>

                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 w-full">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Reported on</p>
                    <p className="text-sm font-semibold text-gray-700">{formatDate(selectedSubmission.created_at)}</p>
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
                      {selectedSubmission.type || selectedSubmission.category}
                    </h3>
                  </div>

                  {/* Complaint Text - Auto-adjust height */}
                  <div className="flex-/2 mb-4 sm:mb-6">
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
                        {selectedSubmission.complainText || selectedSubmission.content}
                      </p>
                    </div>
                  </div>

                  {/* File Container */}
                  <div className="mb-4 sm:mb-6">
                    <FileContainer files={selectedSubmission.files || []} />
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
                      {selectedSubmission.remarks || 'No remarks available'}
                    </p>
                  </div>
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

export default ReqAndCompRes;
