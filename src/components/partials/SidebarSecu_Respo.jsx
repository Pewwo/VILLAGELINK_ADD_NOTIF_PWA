import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBullhorn, FaEnvelope, FaPhoneAlt, FaQuestionCircle, FaUsers } from 'react-icons/fa';
import { MdLogout, MdAccountCircle, MdListAlt, MdMenu, MdClose } from 'react-icons/md';
import { MdOutlineFeedback } from "react-icons/md";

const SidebarSecu_Respo = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <aside
      className={`bg-gray-900 top-14 text-white fixed z-40 h-screen p-3 flex flex-col gap-1 transition-all duration-300 overflow-hidden hidden md:flex 
        ${isExpanded ? 'w-70' : 'w-16'}`}
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
        <Link to="/Secu_RespoLayout" className="relative flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Announcements">
          <FaBullhorn size={18} />
          {isExpanded && <span className="whitespace-nowrap">Announcements</span>}
        </Link>
        <Link to="/Secu_RespoLayout/emergencyLogs" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded group" title="Emergency Logs">
          <FaPhoneAlt size={18}/>
          {isExpanded && <span className="whitespace-nowrap">Emergency Logs</span>}
        </Link>
        <Link to="/Secu_RespoLayout/visitorLogs" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="Visitor Logs">
          <MdListAlt size={18}/>
          {isExpanded && <span className="whitespace-nowrap">Visitor Logs</span>}
        </Link>
        <Link to="/Secu_RespoLayout/officials" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded" title="Officials Board">
          <FaUsers size={18}/>
           {isExpanded && <span className="whitespace-nowrap">Officials Board</span>}
        </Link>
      </nav>
    </aside>
  );
};

export default SidebarSecu_Respo;
