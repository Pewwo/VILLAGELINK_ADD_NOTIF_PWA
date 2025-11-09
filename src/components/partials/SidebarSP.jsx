import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBullhorn, FaEnvelope, FaPhoneAlt, FaQuestionCircle, FaUsers } from 'react-icons/fa';
import { MdLogout, MdAccountCircle, MdListAlt, MdMenu, MdClose } from 'react-icons/md';
import { MdOutlineFeedback } from "react-icons/md";

const SidebarSP = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <aside
      className={`bg-gray-900 text-white top-14 fixed z-40 h-screen p-3 flex flex-col gap-1 transition-all duration-300 overflow-y-auto hidden md:flex
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
      <nav className="flex flex-col gap-4 flex-grow">
        <Link to="/spLayout" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Announcements">
          <FaBullhorn size={18} />
          {isExpanded && <span className="whitespace-nowrap">Announcements</span>}
        </Link>
        <Link to="/spLayout/requests" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Request and Complaints">
          <FaEnvelope size={18} />
          {isExpanded && <span className="whitespace-nowrap">Request and Complaints</span>}
        </Link>
        <Link to="/spLayout/emergencyLogs" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Emergency Logs">
          <FaPhoneAlt size={18}/>
          {isExpanded && <span className="whitespace-nowrap">Emergency Logs</span>}
        </Link>
        <Link to="/spLayout/visitorLogs" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="Visitor Logs">
          <MdListAlt size={18}/>
          {isExpanded && <span className="whitespace-nowrap">Visitor Logs</span>}
        </Link>
        <Link to="/spLayout/accountmanagement" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="Account Management">
          <MdAccountCircle size={18}/>
          {isExpanded && <span className="whitespace-nowrap">Account Management</span>}
        </Link>
        <Link to="/spLayout/officials" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="Officials Board">
          <FaUsers size={18}/>
           {isExpanded && <span className="whitespace-nowrap">Officials Board</span>}
        </Link>
        <Link to="/spLayout/feedback" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="Feedback">
          <MdOutlineFeedback size={18}/>
          {isExpanded && <span className="whitespace-nowrap">Feedback</span>}
        </Link>
        <Link to="/spLayout/faqs" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="FAQs">
          <FaQuestionCircle size={18}/>
          {isExpanded && <span className="whitespace-nowrap">FAQs</span>}
        </Link>
      </nav>
      {user.role === 'Admin' && (
        <Link to="/reslayout" className="flex items-center gap-3 hover:bg-gray-700 p-2 mb-15 rounded mt-auto" title="Switch to Resident View">
          <img src="https://cdn-icons-png.flaticon.com/128/17740/17740840.png" alt="Switch to Resident View" className="w-5 h-5 filter invert" />
          {isExpanded && <span className="whitespace-nowrap">Switch to Resident View</span>}
        </Link>
      )}
    </aside>
  );
};

export default SidebarSP;
