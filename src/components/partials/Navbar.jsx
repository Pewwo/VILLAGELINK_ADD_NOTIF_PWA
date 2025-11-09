import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../common/Avatar';
import { MdLogout, MdAccountCircle } from 'react-icons/md';
import { FaBullhorn, FaEnvelope, FaPhoneAlt, FaQuestionCircle, FaUsers } from 'react-icons/fa';
import { MdOutlineFeedback } from "react-icons/md";
import logo from '../../assets/Logo.png';
import { NotificationBell } from './NotificationBell';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profilePic, setProfilePic] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`https://villagelink.site/backend/api/get_profile.php?id=${userId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await res.json();
        if (data.status === 'success') {
          const user = data.data;
          const backendBaseUrl = 'https://villagelink.site/backend/';
          setProfilePic(user.profile_picture ? backendBaseUrl + user.profile_picture : '');
          const nameParts = user.name ? user.name.split(' ') : [];
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.length > 2 ? nameParts[2] : (nameParts[1] || ''));
          setEmail(user.email || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
    setIsMobileMenuOpen(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
    setIsMobileMenuOpen(false);
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="fixed top-0 w-full lg:px-16 px-6 flex flex-wrap items-center lg:py-0 py-2 bg-amber-950 shadow-md z-50">
      <div className='w-full container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 md:h-14 h-12'>

        <div className='flex-1 flex justify-between items-center'>
          {/* Logo Section */}
          <Link to="/reslayout" className='flex items-center gap-1 sm:gap-2'>
            <img src={logo} alt="VillageLink Logo" className='h-9'/>
            <div><p className='text-white px-0 top-1'>VillageLink</p></div>
          </Link>

          {/* Notification Bell and Profile Icon with Dropdown */}
          <div className='hidden md:flex items-center gap-2 relative' ref={dropdownRef}>
            <NotificationBell />
            <div ref={dropdownRef}>
              <button onClick={toggleDropdown} className='flex items-center focus:outline-none'>
                {profilePic ? (
                  <Avatar
                    profilePic={profilePic}
                    firstName={firstName}
                    lastName={lastName}
                    size={32}
                  />
                ) : (
                  <Avatar
                    firstName={firstName}
                    lastName={lastName}
                    size={32}
                  />
                )}
              </button>
              {isDropdownOpen && (
                <div className="absolute right-2 mt-1 w-70 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                    {profilePic ? (
                      <Avatar
                        profilePic={profilePic}
                        firstName={firstName}
                        lastName={lastName}
                        size={48}
                      />
                    ) : (
                      <Avatar
                        firstName={firstName}
                        lastName={lastName}
                        size={48}
                      />
                    )}
                  <div>
                    <p className="font-semibold text-gray-900">{firstName} {lastName}</p>
                    <p className="text-sm text-gray-600">{email}</p>
                    <Link
                      to="/reslayout/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full block text-left text-blue-600 hover:text-blue-800 text-sm rounded-md mt-1 hover:underline"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
                <button
                  onClick={confirmLogout}
                   className="w-full flex items-center justify-center gap-1 px-4 py-2 text-red-500 hover:text-red-700 rounded-b-md font-semibold hover:underline"
                    >
                    <MdLogout size={18} />
                      Log out
                </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu toggle button with animated hamburger */}
          <div className='sm:hidden flex items-center'>
            <button 
              onClick={toggleMobileMenu} 
              aria-label="Toggle menu" 
              aria-expanded={isMobileMenuOpen} 
              className="flex flex-col justify-center items-center w-8 h-8 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 rounded"
            >
              <span className={`block h-0.5 w-6 bg-white rounded transform transition duration-300 ease-in-out origin-center ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
              <span className={`block h-0.5 w-6 bg-white rounded mt-1.5 mb-1.5 transition-opacity duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`block h-0.5 w-6 bg-white rounded transform transition duration-300 ease-in-out origin-center ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu links with dropdown animation and backdrop */}
      <div 
        className={`sm:hidden fixed top-14 right-4 w-64 bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 ease-in-out transform origin-top z-50
          ${isMobileMenuOpen ? 'max-h-screen opacity-100 pointer-events-auto scale-100' : 'max-h-0 opacity-0 pointer-events-none scale-95'}`}
        role="menu"
        aria-label="Mobile menu"
      >
          <ul className="flex flex-col pt-3 pb-3 gap-3 text-lg font-semibold px-4">
              <li><Link to="/reslayout" onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-base text-amber-950 hover:text-amber-700 transition-colors rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  role="menuitem"><FaBullhorn size={18} />Announcements
                  </Link>
                </li>
              <li><Link to="/reslayout/requests" onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-base text-amber-950 hover:text-amber-700 transition-colors rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  role="menuitem"><FaEnvelope size={18} />Request and Complaints
                  </Link>
                </li>
              <li><Link to="/reslayout/sos" onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-base text-amber-950 hover:text-amber-700 transition-colors rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  role="menuitem"><FaPhoneAlt size={18} />Emergency Logs
                  </Link>
              </li>
              <li><Link to="/reslayout/officials" onClick={() => setIsMobileMenuOpen(false)}
                  className='flex items-center gap-3 text-base text-amber-950 hover:text-amber-700 transition-colors rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500'
                  role="menuitem"><FaUsers size={18} />Officials Board
                  </Link>
                </li>
              <li><Link to="/reslayout/faqs" onClick={()  => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-base text-amber-950 hover:text-amber-700 transition-colors rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  role="menuitem"><FaQuestionCircle size={18} />FAQs
                  </Link>
              </li>
              <li><Link to="/reslayout/profile" onClick={() => setIsMobileMenuOpen(false)}
                  className='flex items-center gap-3 text-base text-amber-950 hover:text-amber-700 transition-colors rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500'
                  role="menuitem"><MdAccountCircle size={18} />Profile
                  </Link>
                </li>
              <li><Link to="/reslayout/feedback" onClick={() => setIsMobileMenuOpen(false)}
                  className='flex items-center gap-3 text-base text-amber-950 hover:text-amber-700 transition-colors rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500'
                  role="menuitem"><MdOutlineFeedback size={18} />Feedback
                  </Link>
                </li>
              {(user.role === 'President' || user.role === 'Vice President' || user.role === 'Secretary' || user.role === 'Admin') && (
                <li><Link to={user.role === 'President' ? '/Pre_VPLayout' : user.role === 'Vice President' ? '/Pre_VPLayout' : user.role === 'Secretary' ? '/SecLayout' : '/spLayout'} onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-base text-amber-950 hover:text-amber-700 transition-colors rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    role="menuitem">
                    <img src="https://cdn-icons-png.flaticon.com/128/17740/17740840.png" alt={`Switch to ${user.role} View`} className="w-5 h-5" />
                    Switch to {user.role}
                  </Link>
                </li>
              )}
              <li><button onClick={confirmLogout}
                  className='flex items-center gap-3 text-base text-amber-950 hover:text-amber-700 transition-colors rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500'
                  role="menuitem"><MdLogout size={18} />Log out
                  </button>
              </li>

          </ul>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-60">
          <div className="bg-white rounded-lg p-6 w-80 max-w-full shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Confirm Logout</h2>
            <p className="mb-6">Are you sure you want to log out?</p>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
              <button
                onClick={() => {
                  handleLogout();
                  setShowLogoutConfirm(false);
                  setIsDropdownOpen(false);
                }}
                className="px-4 py-2 rounded-3xl bg-red-600 text-white hover:bg-red-700"
              >
                Confirm
              </button>
              <button
                onClick={cancelLogout}
                className="px-4 py-2 rounded-3xl bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
