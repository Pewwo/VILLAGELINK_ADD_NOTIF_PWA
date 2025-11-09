import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBullhorn, FaEnvelope, FaPhoneAlt, FaQuestionCircle, FaUsers } from 'react-icons/fa';
import { MdMenu } from 'react-icons/md';
import { MdOutlineFeedback } from "react-icons/md";
import { requestPollingService } from '../../services/requestPolling';
import { feedbackPollingService } from '../../services/feedbackPolling';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNewRequests, setHasNewRequests] = useState(false);
  const [hasNewFeedback, setHasNewFeedback] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  // Get viewed items from localStorage (user-specific)
  const getViewedRequests = () => {
    const userId = localStorage.getItem('userId');
    const key = userId ? `viewedLogs_${userId}` : 'viewedLogs';
    try {
      const viewed = localStorage.getItem(key);
      return viewed ? JSON.parse(viewed) : [];
    } catch (e) {
      console.error('Error parsing viewedLogs', e);
      localStorage.removeItem(key);
      return [];
    }
  };

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

  // Check if there are any new items that haven't been viewed
  const checkForNewItems = () => {
    const viewedRequests = getViewedRequests();
    const viewedFeedback = getViewedFeedback();

    // Check requests - any request within 24 hours not viewed
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    // For requests, we need to check the current data from the polling service
    if (requestPollingService.currentData && requestPollingService.currentData.length > 0) {
      const newRequests = requestPollingService.currentData.filter(request => {
        const requestDate = new Date(request.created_at);
        return requestDate > twentyFourHoursAgo && !viewedRequests.includes(String(request.comreq_id));
      });
      setHasNewRequests(newRequests.length > 0);
    }

    // For feedback, we need to check the current data from the polling service
    if (feedbackPollingService.currentData && feedbackPollingService.currentData.length > 0) {
      const newFeedback = feedbackPollingService.currentData.filter(feedback => {
        const feedbackDate = new Date(feedback.submitted_at);
        return feedbackDate > twentyFourHoursAgo && !viewedFeedback.includes(String(feedback.feedback_id));
      });
      setHasNewFeedback(newFeedback.length > 0);
    }
  };

  useEffect(() => {
    // Check for new items on mount
    checkForNewItems();

    // Listen for new requests
    const handleNewRequest = (request) => {
      console.log('Sidebar: New request received');
      checkForNewItems();
    };

    // Listen for new feedback
    const handleNewFeedback = (feedback) => {
      console.log('Sidebar: New feedback received');
      checkForNewItems();
    };

    // Add listeners
    requestPollingService.addListener('new_request', handleNewRequest);
    feedbackPollingService.addListener('new_feedback', handleNewFeedback);

    // Set up periodic check every 30 seconds
    const interval = setInterval(checkForNewItems, 30000);

    return () => {
      requestPollingService.removeListener('new_request', handleNewRequest);
      feedbackPollingService.removeListener('new_feedback', handleNewFeedback);
      clearInterval(interval);
    };
  }, []);

  return (
     <aside
      className={`bg-gray-900 top-14 text-white fixed z-40 h-screen p-3 flex flex-col gap-1 transition-all duration-300 overflow-y-auto
        hidden md:flex
        ${isExpanded ? 'w-70' : 'w-16'}`}
    >
      {/* Hamburger Button */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify p-2 rounded hover:bg-gray-700 mb-4"
        title="Menu"
        aria-label="Menu"
      >
        <MdMenu size={24} />
        {isExpanded && <span className="whitespace-nowrap ml-2">Menu</span>}
      </button>

      {/* Navigation */}
      <nav className="flex flex-col gap-4 flex-grow">
        <Link to="/reslayout" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Announcements">
          <FaBullhorn size={18} />
          {isExpanded && <span className="whitespace-nowrap">Announcements</span>}
        </Link>
        <Link to="/reslayout/requests" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Request and Complaints">
          <FaEnvelope size={18} />
          {isExpanded && <span className="whitespace-nowrap">Request and Complaints</span>}
        </Link>
        <Link to="/reslayout/sos" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="SOS">
          <FaPhoneAlt size={18} />
          {isExpanded && <span className="whitespace-nowrap">SOS</span>}
        </Link>
        <Link to="/reslayout/officials" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Officials Board">
          <FaUsers size={18} />
          {isExpanded && <span className="whitespace-nowrap">Officials Board</span>}
        </Link>
        <Link to="/reslayout/faqs" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group"  title="FAQs">
          <FaQuestionCircle size={18} />
          {isExpanded && <span className="whitespace-nowrap">FAQs</span>}
        </Link>
        <Link to="/reslayout/feedback" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Feedback">
          <MdOutlineFeedback size={18} />
          {isExpanded && <span className="whitespace-nowrap">Feedback</span>}
        </Link>
      </nav>
      {(user.role === 'President' || user.role === 'Vice President' || user.role === 'Secretary' || user.role === 'Admin') && (
        <Link to={user.role === 'President' ? '/Pre_VPLayout' : user.role === 'Vice President' ? '/Pre_VPLayout' : user.role === 'Secretary' ? '/SecLayout' : '/spLayout'} className="flex items-center gap-3 hover:bg-gray-700 p-2 mb-15 rounded mt-auto" title={`Switch to ${user.role} View`}>
          <img src="https://cdn-icons-png.flaticon.com/128/17740/17740840.png" alt={`Switch to ${user.role} View`} className="w-5 h-5 filter invert" />
          {isExpanded && <span className="whitespace-nowrap">Switch to {user.role} View</span>}
        </Link>
      )}
    </aside>
  );
};

export default Sidebar;
