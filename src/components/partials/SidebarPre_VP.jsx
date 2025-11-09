import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBullhorn, FaEnvelope, FaPhoneAlt, FaQuestionCircle, FaUsers } from 'react-icons/fa';
import { MdLogout, MdAccountCircle, MdListAlt, MdMenu, MdClose } from 'react-icons/md';
import { MdOutlineFeedback } from "react-icons/md";

const SidebarPre_VP = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

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

      {/* Navigation Items */}
      <nav className="flex flex-col gap-4 flex-grow">
        <Link to="/Pre_VPLayout" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Announcements">
          <FaBullhorn size={18} />
          {isExpanded && <span className="whitespace-nowrap">Announcements</span>}
        </Link>
        <Link to="/Pre_VPLayout/requests" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Request and Complaints">
          <FaEnvelope size={18} />
          {isExpanded && <span className="whitespace-nowrap">Request and Complaints</span>}
        </Link>
        <Link to="/Pre_VPLayout/emergencyLogs" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Emergency Logs">
          <FaPhoneAlt size={18}/>
          {isExpanded && <span className="whitespace-nowrap">Emergency Logs</span>}
        </Link>
        <Link to="/Pre_VPLayout/visitorLogs" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="Visitor Logs">
          <MdListAlt size={18}/>
          {isExpanded && <span className="whitespace-nowrap">Visitor Logs</span>}
        </Link>
        <Link to="/Pre_VPLayout/officials" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="Officials Board">
          <FaUsers size={18}/>
           {isExpanded && <span className="whitespace-nowrap">Officials Board</span>}
        </Link>
        <Link to="/Pre_VPLayout/feedback" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="Feedback">
          <MdOutlineFeedback size={18}/>
          {isExpanded && <span className="whitespace-nowrap">Feedback</span>}
        </Link>
      </nav>
      {user.role === 'President' && (
        <Link to="/reslayout" className="flex items-center gap-3 hover:bg-gray-700 p-2 mb-15 rounded mt-auto" title="Switch to Resident View">
          <img src="https://cdn-icons-png.flaticon.com/128/17740/17740840.png" alt="Switch to Resident View" className="w-5 h-5 filter invert" />
          {isExpanded && <span className="whitespace-nowrap">Switch to Resident Account</span>}
        </Link>
      )}
    </aside>
  );
};

export default SidebarPre_VP;
