import React, { useState, useRef, useEffect } from "react";
import { FiBell } from "react-icons/fi";
import { useNotifications } from "../../contexts/NotificationContext";
import { formatToPhilippineTime } from "../../utils/timeUtils";

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, addOrUpdateNotification } =
    useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Example: simulate receiving new/updated FAQs
  useEffect(() => {
    const interval = setInterval(() => {
      const newFaq = {
        id: Math.floor(Math.random() * 1000),
        type: "faq",
        title: "FAQ Question " + Math.floor(Math.random() * 10),
        message: "FAQ Answer " + Math.floor(Math.random() * 10),
        timestamp: new Date(),
      };
      addOrUpdateNotification(newFaq);
    }, 10000); // every 10s
    return () => clearInterval(interval);
  }, [addOrUpdateNotification]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={toggleDropdown} className="relative flex items-center focus:outline-none">
        <FiBell size={24} className="text-white hover:text-gray-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  markAllAsRead();
                  setIsDropdownOpen(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">No notifications</div>
            ) : (
              notifications
                .slice(0, 10)
                .map((n) => (
                  <div
                    key={`${n.type}-${n.id}`}
                    className={`p-4 border-b border-gray-100 ${
                      !n.read
                        ? n.type === "faq"
                          ? "bg-green-50"
                          : "bg-blue-50"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{n.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatToPhilippineTime(n.timestamp)}
                        </p>
                        {n.type === "faq" && !n.read && (
                          <p className="text-xs text-yellow-600 mt-1 font-semibold">
                            (New/Updated)
                          </p>
                        )}
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => markAsRead(n.id, n.type)}
                          className="text-xs text-blue-600 hover:text-blue-800 ml-2"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
