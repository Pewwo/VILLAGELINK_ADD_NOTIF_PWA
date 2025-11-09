import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../common/Avatar';
import DatePicker from '../../common/DatePicker';
import Pagination from '../../common/Pagination';
import { feedbackPollingService } from '../../../services/feedbackPolling';

const API_BASE = "https://villagelink.site/backend/api";
const BACKEND_BASE_URL = "https://villagelink.site/backend/";

const FeedBackDetailsPage = () => {
  console.log('🚀 FeedBackDetailsPage component loaded - VERSION 2.0');
  
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [starFilter, setStarFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [feedbackData, setFeedbackData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Debug error state changes
  useEffect(() => {
    console.log('Error state changed to:', error);
  }, [error]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveItemId, setArchiveItemId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get viewed feedback from localStorage (user-specific)
  const getViewedFeedback = () => {
    const userId = localStorage.getItem('userId');
    const key = userId ? `viewedFeedback_${userId}` : 'viewedFeedback';
    try {
      const viewed = localStorage.getItem(key);
      return viewed ? JSON.parse(viewed) : [];
    } catch (e) {
      console.error('Error parsing viewedFeedback', e);
      localStorage.removeItem(key);
      return [];
    }
  };

  // Mark feedback as viewed (user-specific)
  const markFeedbackAsViewed = (feedbackId) => {
    const userId = localStorage.getItem('userId');
    const key = userId ? `viewedFeedback_${userId}` : 'viewedFeedback';
    const viewed = getViewedFeedback();
    const idStr = String(feedbackId);
    if (!viewed.includes(idStr)) {
      viewed.push(idStr);
      localStorage.setItem(key, JSON.stringify(viewed));
    }
  };

  useEffect(() => {
    console.log('🔥 useEffect started - VERSION 2.0');
    let mounted = true;
    console.log('FeedBackDetailsPage: Component mounted');
    
    // Clear any existing error state
    setError('');
    setIsLoading(true);
    
    const fetchFeedbackData = async () => {
      console.log('=== FETCH FEEDBACK DATA START ===');
      try {
        setIsLoading(true);
        setError(''); // Clear any previous errors
        
        console.log('About to make fetch request...');
        const url = `${API_BASE}/get_feedback.php?t=${Date.now()}`;
        console.log('Fetching feedback data from:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          mode: 'cors',
        });
        
        console.log('Response received, status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
          console.log('Response not ok, throwing error');
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log('About to get response text...');
        const text = await response.text();
        console.log('Response text length:', text.length);
        console.log('Response text preview:', text.substring(0, 200) + '...');
        
        console.log('About to parse JSON...');
        let result;
        try {
          result = JSON.parse(text);
          console.log('JSON parsed successfully');
        } catch (jsonErr) {
          console.error('Failed to parse JSON:', jsonErr);
          console.error('Response text that failed to parse:', text);
          throw new Error('Invalid JSON response from server');
        }

        console.log('Parsed result type:', typeof result);
        console.log('Parsed result is array:', Array.isArray(result));
        console.log('Parsed result keys:', result ? Object.keys(result) : 'null');

        let feedbackData = [];
        
        // Handle both wrapped and direct array responses
        if (Array.isArray(result)) {
          console.log('Received direct array response with', result.length, 'items');
          feedbackData = result;
        } else if (result && result.status === 'success' && Array.isArray(result.data)) {
          console.log('Received wrapped response with', result.data.length, 'items');
          feedbackData = result.data;
        } else {
          console.error('Invalid response format:', result);
          throw new Error(result?.message || 'Invalid response format from server');
        }

        console.log('About to transform data...');
        if (mounted) {
          const transformedData = feedbackData.map(item => {
            const submittedAt = new Date(item.submitted_at);
            const now = new Date();
            const isNew = (now - submittedAt) < (24 * 60 * 60 * 1000) && !getViewedFeedback().includes(String(item.feedback_id)); // New if within last 24 hours and not viewed
            return {
              ...item,
              profile_picture: item.profile_picture
                ? (item.profile_picture.startsWith('http') ? item.profile_picture : BACKEND_BASE_URL + item.profile_picture)
                : '',
              isNew
            };
          });
          
          console.log('About to set state...');
          setFeedbackData(transformedData);
          setFilteredData(transformedData);
          setError('');
          console.log('Successfully loaded', transformedData.length, 'feedback entries');
          console.log('=== FETCH FEEDBACK DATA SUCCESS ===');
        } else {
          console.log('Component unmounted, not setting state');
        }
      } catch (err) {
        console.error('=== FETCH FEEDBACK DATA ERROR ===');
        console.error('Error fetching feedback data:', err);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        console.error('Error name:', err.name);
        if (mounted) {
          console.log('Setting error state:', err.message || 'Error');
          setError(err.message || 'Error');
          setFeedbackData([]);
          setFilteredData([]);
        } else {
          console.log('Component unmounted, not setting error state');
        }
      } finally {
        if (mounted) {
          console.log('Setting loading to false');
          setIsLoading(false);
        } else {
          console.log('Component unmounted, not setting loading to false');
        }
        console.log('=== FETCH FEEDBACK DATA FINALLY ===');
      }
    };

    // Initial fetch
    fetchFeedbackData();

    // Setup polling for real-time updates
    const handleNewFeedback = (newFeedback) => {
      console.log('Admin: New feedback received:', newFeedback);

      // Transform the profile picture URL and add isNew flag
      const submittedAt = new Date(newFeedback.submitted_at || new Date());
      const now = new Date();
      const isNew = (now - submittedAt) < (24 * 60 * 60 * 1000) && !getViewedFeedback().includes(String(newFeedback.feedback_id));

      const transformedFeedback = {
        ...newFeedback,
        profile_picture: newFeedback.profile_picture
          ? (newFeedback.profile_picture.startsWith('http') ? newFeedback.profile_picture : BACKEND_BASE_URL + newFeedback.profile_picture)
          : '',
        isNew
      };

      // Update the feedback in place if it exists, otherwise add it to the beginning
      setFeedbackData(prevData => {
        const existingIndex = prevData.findIndex(feedback => feedback.feedback_id === newFeedback.feedback_id);
        if (existingIndex !== -1) {
          // Update existing feedback
          const updatedData = [...prevData];
          updatedData[existingIndex] = transformedFeedback;
          return updatedData;
        } else {
          // Add new feedback to the beginning
          return [transformedFeedback, ...prevData];
        }
      });
    };

    // Add a small delay before setting up polling to avoid race conditions
    const setupPolling = () => {
      console.log('Admin side: Adding listener for new_feedback');
      feedbackPollingService.addListener('new_feedback', handleNewFeedback);
      
      // Only start polling if not already running
      if (!feedbackPollingService.isPolling) {
        console.log('Admin side: Starting polling service');
        feedbackPollingService.startPolling();
      } else {
        console.log('Admin side: Polling service already running, just adding listener');
      }
    };

    // Delay polling setup to avoid race conditions with initial fetch
    setTimeout(setupPolling, 1000);

    return () => {
      console.log('FeedBackDetailsPage: Component unmounting');
      mounted = false;
      feedbackPollingService.removeListener('new_feedback', handleNewFeedback);
    };
  }, []);

  // Filter data whenever feedbackData or filter criteria change
  useEffect(() => {
    console.log('Applying filters to feedback data');
    console.log('feedbackData length:', feedbackData.length);
    console.log('feedbackData:', feedbackData);
    
    const applyFilters = () => {
      if (!Array.isArray(feedbackData)) {
        console.error('feedbackData is not an array:', feedbackData);
        return;
      }
      
      const filtered = feedbackData.filter(item => {
        // Search filter
        const searchLower = (searchTerm || '').toLowerCase();
        const fields = [item.resident_name, item.feedback_context, item.submitted_at].filter(Boolean);
        const matchesSearch = fields.some(f => f.toString().toLowerCase().includes(searchLower));

        // Rating filters
        const matchesStar = starFilter ? item.rating === Number(starFilter) : true;
        const matchesRating = ratingFilter ? item.rating === Number(ratingFilter) : true;

        // Date filter
        let matchesDate = true;
        if (selectedDate) {
          const itemDate = new Date(item.submitted_at);
          const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
          const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
          matchesDate = selectedDateOnly.getTime() === itemDateOnly.getTime();
        }

        return matchesSearch && matchesStar && matchesRating && matchesDate;
      });

      setFilteredData(filtered);
    };

    try {
      applyFilters();
    } catch (error) {
      console.error('Error in filtering:', error);
      setError('Error filtering data: ' + error.message);
    }
  }, [searchTerm, starFilter, ratingFilter, selectedDate, feedbackData]); // Include all dependencies

  // Calculate paginated data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, starFilter, ratingFilter, selectedDate]);

  const openModal = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleArchive = (feedbackId) => {
    setArchiveItemId(feedbackId);
    setShowArchiveModal(true);
  };

  const confirmArchive = async () => {
    if (!archiveItemId) return;

    try {
      const response = await fetch(`${API_BASE}/archive.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'feedback',
          id: archiveItemId,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Remove the archived feedback from the state
        setFeedbackData(prevData => prevData.filter(item => item.feedback_id !== archiveItemId));
        setShowArchiveModal(false);
        setArchiveItemId(null);
        setShowSuccessModal(true);
      } else {
        alert('Failed to archive feedback: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error archiving feedback:', error);
      alert('Error archiving feedback: ' + error.message);
    }
  };

  const cancelArchive = () => {
    setShowArchiveModal(false);
    setArchiveItemId(null);
  };

  if (isLoading) {
    return <div className="text-center py-10 text-gray-600">Loading feedbacks...</div>;
  }

  if (error) {
    console.log('Rendering error state with error:', error);
    return (
      <div className="text-center py-10 text-red-600">
        Error loading feedbacks: {error}
        <br />
        <button 
          onClick={() => {
            setError('');
            // Direct API test
            console.log('🧪 Testing API directly...');
            fetch('https://villagelink.site/backend/api/get_feedback.php?t=' + Date.now(), {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              }
            })
            .then(response => {
              console.log('🧪 API Response status:', response.status);
              console.log('🧪 API Response ok:', response.ok);
              return response.text();
            })
            .then(text => {
              console.log('🧪 API Response text length:', text.length);
              console.log('🧪 API Response preview:', text.substring(0, 200));
              try {
                const data = JSON.parse(text);
                console.log('🧪 API Response parsed:', data);
                if (data.status === 'success' && Array.isArray(data.data)) {
                  console.log('🧪 Success! Found', data.data.length, 'feedback items');
                  setFeedbackData(data.data);
                  setFilteredData(data.data);
                  setError('');
                  setIsLoading(false);
                } else {
                  console.log('🧪 Invalid data format');
                }
              } catch (e) {
                console.error('🧪 JSON parse error:', e);
              }
            })
            .catch(err => {
              console.error('🧪 Fetch error:', err);
            });
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test API Directly
        </button>
        <button 
          onClick={() => {
            setError('');
            window.location.reload();
          }}
          className="mt-4 ml-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Feedback Details
              </h1>
              <p className="text-gray-600 text-lg">
                Detailed view of user feedback with filtering options
              </p>
            </div>
            <button
              onClick={() => {
                const user = JSON.parse(localStorage.getItem('user'));
                if (user) {
                  if (user.role === 'Admin') {
                    navigate('/spLayout/archivedFeedBack');
                  } else if (user.role === 'President' || user.role === 'Vice President') {
                    navigate('/Pre_VPLayout/archivedFeedBack');
                  } else if (user.role === 'Secretary') {
                    navigate('/SecLayout/archivedFeedBack');
                  }else if (user.role === 'Developer') {
                    navigate('/DevLayout/archivedFeedBack');
                }
              }
              }}
              className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-blue-900 transition duration-300"
            >
              View Archives
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700/70 mb-2">Filter</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-3 mx-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Search</label>
              <div className="relative">
                <input
                  id="search"
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
                id="status"
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
                onChange={date => setSelectedDate(date)}
                dateFormat="MMMM d, yyyy"
                placeholder="Filter by date..."
                className="w-full"
                isClearable
                showPopperArrow={false}
              />
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3" style={{ minHeight: '600px' }}>
          {paginatedData.map((item, index) => {
            const { resident_name, submitted_at, feedback_context, rating } = item;
            return (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col min-h-[135px] max-h-[160px]">
                <div className="flex justify-between items-center text-md text-black mb-2">
                  <div className="flex items-center space-x-2">
                    <Avatar fullName={resident_name} profilePic={item.profile_picture} size={40} />
                    <span className="font-bold">{resident_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="mr-1 font-semibold text-black">{rating ?? '0'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="gold" viewBox="0 0 24 24" stroke="gold" strokeWidth={2} className="w-2 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.286 7.034a1 1 0 00.95.69h7.39c.969 0 1.371 1.24.588 1.81l-5.98 4.34a1 1 0 00-.364 1.118l2.287 7.034c.3.921-.755 1.688-1.54 1.118l-5.98-4.34a1 1 0 00-1.176 0l-5.98 4.34c-.784.57-1.838-.197-1.539-1.118l2.287-7.034a1 1 0 00-.364-1.118l-5.98-4.34c-.783-.57-.38-1.81.588-1.81h7.39a1 1 0 00.95-.69l2.286-7.034z" />
                    </svg>
                    <span>{new Date(submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                {feedback_context.length <= 150 && (
                  <div className="p-1 mt-1 whitespace-pre-wrap text-ellipsis overflow-clip text-md text-gray-700">
                    {feedback_context}
                  </div>
                )}
                {feedback_context.length > 150 && (
                  <div className="flex flex-col justify-between flex-1">
                    <div className="p-1 mt-1 mb-3 overflow-hidden max-h-[3.5rem] whitespace-pre-wrap text-ellipsis overflow-clip">
                      {feedback_context}
                    </div>
                    <button
                      className="relative text-blue-600 hover:text-blue-400 text-sm self-end"
                      onClick={() => {
                        openModal(item);
                        markFeedbackAsViewed(item.feedback_id);
                        setFeedbackData(prev => prev.map(feedback =>
                          feedback.feedback_id === item.feedback_id ? { ...feedback, isNew: false } : feedback
                        ));
                      }}
                    >
                      View More
                      {item.isNew && (
                        <span className="absolute -top-1 -right-3 h-3 w-3 bg-red-500 rounded-full"></span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
                    Archive
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
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
                        onClick={() => {
                          openModal(item);
                          markFeedbackAsViewed(item.feedback_id);
                          setFeedbackData(prev => prev.map(feedback =>
                            feedback.feedback_id === item.feedback_id ? { ...feedback, isNew: false } : feedback
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleArchive(item.feedback_id)}
                        className="text-red-600 hover:underline hover:text-red-900 transition duration-200"
                      >
                        Archive
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
      </div>

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

        {/* Archive Confirmation Modal */}
        {showArchiveModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative">
              <h2 className="text-xl font-bold mb-4">Confirm Archive</h2>
              <p className="text-gray-600 mb-6">Are you sure you want to archive this feedback? This action cannot be undone.</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelArchive}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmArchive}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
                >
                  Archive
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
              <p className="text-gray-600 mb-6">Feedback archived successfully!</p>
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
    </div>
  );
};

export default FeedBackDetailsPage;

