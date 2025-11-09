import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { feedbackPollingService } from '../../../services/feedbackPolling';

const API_BASE = "https://villagelink.site/backend/api";

const BACKEND_BASE_URL = "https://villagelink.site/backend/";

const FeedBackPage = () => {
  const navigate = useNavigate();
  const [feedbackData, setFeedbackData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchFeedbackData = async () => {
      console.log('FeedBackPage: Fetching feedback data');
      try {
        setIsLoading(true);
        // Add cache-busting parameter and proper headers
        const url = `${API_BASE}/get_feedback.php?t=${Date.now()}`;
        console.log('Fetching from:', url);
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          }
        });
        console.log('Response status:', response.status);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const text = await response.text();
        console.log('Response text length:', text.length);
        console.log('Response preview:', text.substring(0, 100));
        
        let result;
        try {
          result = JSON.parse(text);
          console.log('Parsed result:', result);
          console.log('Result has status:', result.status);
          console.log('Result has data array:', Array.isArray(result.data));
        } catch (jsonErr) {
          console.error('Failed to parse JSON:', jsonErr, 'Response text:', text);
          throw new Error('Invalid JSON response from server');
        }

        if (result.status === 'success' && Array.isArray(result.data)) {
          if (mounted) {
            // Transform profile_picture to full URL
            const transformedData = result.data.map(item => ({
              ...item,
              profile_picture: item.profile_picture
                ? (item.profile_picture.startsWith('http') ? item.profile_picture : BACKEND_BASE_URL + item.profile_picture)
                : '',
            }));
            setFeedbackData(transformedData);
            setError('');
          }
        } else {
          throw new Error(result.message || 'Failed to fetch feedback data');
        }
      } catch (err) {
        console.error('Error fetching feedback data:', err);
        if (mounted) {
          setError(err.message || 'Error');
          setFeedbackData([]);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchFeedbackData();
    
    // Setup polling for real-time updates
    const handleNewFeedback = (newFeedback) => {
      console.log('Admin FeedBackPage: New feedback received:', newFeedback);
      // Force a fresh fetch to update counts and stats
      fetchFeedbackData();
    };

    console.log('FeedBackPage: Adding listener for new_feedback');
    feedbackPollingService.addListener('new_feedback', handleNewFeedback);
    
    // Only start polling if not already running
    if (!feedbackPollingService.isPolling) {
      console.log('FeedBackPage: Starting polling service');
      feedbackPollingService.startPolling();
    } else {
      console.log('FeedBackPage: Polling service already running, just adding listener');
    }
    
    return () => { 
      mounted = false;
      feedbackPollingService.removeListener('new_feedback', handleNewFeedback);
    };
  }, []);



  if (isLoading) {
    return <div className="text-center py-10 text-gray-600">Loading feedbacks...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        <div className="mb-4">Error loading feedbacks: {error}</div>
        <button 
          onClick={() => {
            setError('');
            window.location.reload();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Calculate counts for star ratings
  const totalReports = feedbackData.length;

  const countByRating = [5, 4, 3, 2, 1].reduce((acc, rating) => {
    acc[rating] = feedbackData.filter(item => parseInt(item.rating) === rating).length;
    return acc;
  }, {});

  // Calculate percentages for each star rating and adjust to ensure they sum to 100%
  const calculatePercentages = (counts, total) => {
    if (total === 0) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const percentages = {
      5: (counts[5] || 0) / total * 100,
      4: (counts[4] || 0) / total * 100,
      3: (counts[3] || 0) / total * 100,
      2: (counts[2] || 0) / total * 100,
      1: (counts[1] || 0) / total * 100,
    };
    const rounded = {
      5: Math.round(percentages[5]),
      4: Math.round(percentages[4]),
      3: Math.round(percentages[3]),
      2: Math.round(percentages[2]),
      1: Math.round(percentages[1]),
    };
    const sum = Object.values(rounded).reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      const maxKey = Object.keys(rounded).reduce((a, b) => rounded[a] > rounded[b] ? a : b);
      rounded[maxKey] += 100 - sum;
    }
    return rounded;
  };
  const percentages = calculatePercentages(countByRating, totalReports);
  const fiveStarPercentage = percentages[5];
  const fourStarPercentage = percentages[4];
  const threeStarPercentage = percentages[3];
  const twoStarPercentage = percentages[2];
  const oneStarPercentage = percentages[1];

  // Define colors for the bars: 5=green, 4=yellow-green, 3=yellow, 2=orange, 1=red
  const colors = ['green', '#9ACD32', '#FFD700', '#FF8C00', 'red'];


  return (
    
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Feedback Reports
          </h1>
            <p className="text-gray-600 text-lg">
              Collect, monitor, and analyze user feedback with ratings and comments
            </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mb-8">
          <div className="flex items-center space-x-4 bg-white rounded-lg p-4 shadow border-l-4 border-yellow-700">
            <div className="p-2 rounded bg-yellow-100/50 text-yellow-600 flex items-center space-x-1">
              <span className="font-bold text-lg">{totalReports}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Total feedback</p>
            </div>
          </div>
          
         <div className="flex items-center space-x-4 bg-white rounded-lg p-4 shadow border-l-4 border-yellow-700">
            <div className="p-2 rounded bg-yellow-100/50 text-yellow-600 flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="gold" viewBox="0 0 24 24" stroke="gold" strokeWidth={2} className="w-3 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.286 7.034a1 1 0 00.95.69h7.39c.969 0 1.371 1.24.588 1.81l-5.98 4.34a1 1 0 00-.364 1.118l2.287 7.034c.3.921-.755 1.688-1.54 1.118l-5.98-4.34a1 1 0 00-1.176 0l-5.98 4.34c-.784.57-1.838-.197-1.539-1.118l2.287-7.034a1 1 0 00-.364-1.118l-5.98-4.34c-.783-.57-.38-1.81.588-1.81h7.39a1 1 0 00.95-.69l2.286-7.034z" />
              </svg>
              <span className="font-bold text-lg">{fiveStarPercentage}%</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">5 Star Rating</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-white rounded-lg p-4 shadow border-l-4 border-yellow-700">
            <div className="p-2 rounded bg-yellow-100/50 text-yellow-600 flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="gold" viewBox="0 0 24 24" stroke="gold" strokeWidth={2} className="w-3 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.286 7.034a1 1 0 00.95.69h7.39c.969 0 1.371 1.24.588 1.81l-5.98 4.34a1 1 0 00-.364 1.118l2.287 7.034c.3.921-.755 1.688-1.54 1.118l-5.98-4.34a1 1 0 00-1.176 0l-5.98 4.34c-.784.57-1.838-.197-1.539-1.118l2.287-7.034a1 1 0 00-.364-1.118l-5.98-4.34c-.783-.57-.38-1.81.588-1.81h7.39a1 1 0 00.95-.69l2.286-7.034z" />
              </svg>
              <span className="font-bold text-lg">{fourStarPercentage}%</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">4 Star Rating</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-white rounded-lg p-4 shadow border-l-4 border-yellow-700">
            <div className="p-2 rounded bg-yellow-100/50 text-yellow-600 flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="gold" viewBox="0 0 24 24" stroke="gold" strokeWidth={2} className="w-3 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.286 7.034a1 1 0 00.95.69h7.39c.969 0 1.371 1.24.588 1.81l-5.98 4.34a1 1 0 00-.364 1.118l2.287 7.034c.3.921-.755 1.688-1.54 1.118l-5.98-4.34a1 1 0 00-1.176 0l-5.98 4.34c-.784.57-1.838-.197-1.539-1.118l2.287-7.034a1 1 0 00-.364-1.118l-5.98-4.34c-.783-.57-.38-1.81.588-1.81h7.39a1 1 0 00.95-.69l2.286-7.034z" />
              </svg>
              <span className="font-bold text-lg">{threeStarPercentage}%</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">3 Star Rating</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-white rounded-lg p-4 shadow border-l-4 border-yellow-700">
            <div className="p-2 rounded bg-yellow-100/50 text-yellow-600 flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="gold" viewBox="0 0 24 24" stroke="gold" strokeWidth={2} className="w-3 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.286 7.034a1 1 0 00.95.69h7.39c.969 0 1.371 1.24.588 1.81l-5.98 4.34a1 1 0 00-.364 1.118l2.287 7.034c.3.921-.755 1.688-1.54 1.118l-5.98-4.34a1 1 0 00-1.176 0l-5.98 4.34c-.784.57-1.838-.197-1.539-1.118l2.287-7.034a1 1 0 00-.364-1.118l-5.98-4.34c-.783-.57-.38-1.81.588-1.81h7.39a1 1 0 00.95-.69l2.286-7.034z" />
              </svg>
              <span className="font-bold text-lg">{twoStarPercentage}%</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">2 Star Rating</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-white rounded-lg p-4 shadow border-l-4 border-yellow-700">
            <div className="p-2 rounded bg-yellow-100/50 text-yellow-600 flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="gold" viewBox="0 0 24 24" stroke="gold" strokeWidth={2} className="w-3 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.286 7.034a1 1 0 00.95.69h7.39c.969 0 1.371 1.24.588 1.81l-5.98 4.34a1 1 0 00-.364 1.118l2.287 7.034c.3.921-.755 1.688-1.54 1.118l-5.98-4.34a1 1 0 00-1.176 0l-5.98 4.34c-.784.57-1.838-.197-1.539-1.118l2.287-7.034a1 1 0 00-.364-1.118l-5.98-4.34c-.783-.57-.38-1.81.588-1.81h7.39a1 1 0 00.95-.69l2.286-7.034z" />
              </svg>
              <span className="font-bold text-lg">{oneStarPercentage}%</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">1 Star Rating</p>
            </div>
          </div>
        </div>

        <div className="mb-3 flex justify-end">
          <button
            onClick={() => navigate('../feedBackDetails')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-800 transition duration-200"
          >
            View Feedbacks
          </button>
        </div>

        {/* Graph */}
        <div className="bg-white rounded-xl shadow-sm mb-6 p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Feedback Distribution</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={[
              { name: '5 Star', value: fiveStarPercentage },
              { name: '4 Star', value: fourStarPercentage },
              { name: '3 Star', value: threeStarPercentage },
              { name: '2 Star', value: twoStarPercentage },
              { name: '1 Star', value: oneStarPercentage },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {[
                  { name: '5 Star', value: fiveStarPercentage },
                  { name: '4 Star', value: fourStarPercentage },
                  { name: '3 Star', value: threeStarPercentage },
                  { name: '2 Star', value: twoStarPercentage },
                  { name: '1 Star', value: oneStarPercentage },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        
      </div>
    </div>
  );
};

export default FeedBackPage;
