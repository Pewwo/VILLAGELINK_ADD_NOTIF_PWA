import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdAccountCircle, MdMenu, MdOutlineFeedback } from 'react-icons/md';
import { FaListAlt } from 'react-icons/fa';
import { feedbackPollingService } from '../../services/feedbackPolling';

const SidebarDev = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNewFeedback, setHasNewFeedback] = useState(false);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

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

  // Check if there are any new feedback items that haven't been viewed
  const checkForNewFeedback = () => {
    const viewedFeedback = getViewedFeedback();

    // Check feedback - any feedback within 24 hours not viewed
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

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
    // Check for new feedback on mount
    checkForNewFeedback();

    // Listen for new feedback
    const handleNewFeedback = (feedback) => {
      console.log('SidebarDev: New feedback received');
      checkForNewFeedback();
    };

    // Add listener
    feedbackPollingService.addListener('new_feedback', handleNewFeedback);

    // Set up periodic check every 30 seconds
    const interval = setInterval(checkForNewFeedback, 30000);

    return () => {
      feedbackPollingService.removeListener('new_feedback', handleNewFeedback);
      clearInterval(interval);
    };
  }, []);

  return (
    <aside
      className={`bg-gray-900 text-white top-14 fixed z-40 h-screen p-3 flex flex-col gap-1 transition-all duration-300 overflow-hidden hidden md:flex
        ${isExpanded ? 'w-64' : 'w-16'}`}
    >
      {/* Hamburger Button */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify p-2 rounded hover:bg-gray-700 mb-4"
        title="Menu"
      >
        <MdMenu size={24} />
        {isExpanded && <span className="whitespace-nowrap ml-2">Menu</span>}
      </button>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-4">
        <Link to="/devLayout/accountmanagement" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="Account Management">
          <MdAccountCircle size={18}/>
          {isExpanded && <span className="whitespace-nowrap">Account Management</span>}
        </Link>
        <Link to="/devLayout/feedback" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="Feedback">
          <MdOutlineFeedback size={18}/>
          {isExpanded && <span className="whitespace-nowrap">Feedback</span>}
        </Link>
      </nav>
    </aside>
  );
};

export default SidebarDev;
