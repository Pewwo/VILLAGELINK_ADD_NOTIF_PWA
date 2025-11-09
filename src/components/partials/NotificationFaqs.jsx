import React, { useState, useEffect, useRef } from "react";
import { FiHelpCircle } from "react-icons/fi";
import { faqsPollingService } from "../services/faqsPolling.js";

export const NotificationFaqs = () => {
  const [faqs, setFaqs] = useState([]);
  const [newFaqsCount, setNewFaqsCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Listen for new or updated FAQs from polling service
  useEffect(() => {
    const handleNewFaq = (faq) => {
      setFaqs((prev) => [faq, ...prev.filter(f => f.faq_id !== faq.faq_id)]);
      setNewFaqsCount((prev) => prev + 1);
    };

    faqsPollingService.on("new_faq", handleNewFaq);
    faqsPollingService.startPolling(10000); // poll every 10 seconds

    return () => {
      faqsPollingService.off("new_faq", handleNewFaq);
      faqsPollingService.stopPolling();
    };
  }, []);

  // Handle dropdown toggle
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) setNewFaqsCount(0); // reset count when opening
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* FAQ Bell */}
      <button
        onClick={toggleDropdown}
        className="relative flex items-center focus:outline-none"
      >
        <FiHelpCircle size={24} className="text-white hover:text-gray-200" />
        {newFaqsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {newFaqsCount > 9 ? "9+" : newFaqsCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg z-50 border border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">FAQ Updates</h3>
          </div>

          {faqs.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">No FAQs available</div>
          ) : (
            faqs.map((faq) => (
              <div
                key={faq.faq_id}
                className={`p-4 border-b border-gray-100 ${
                  new Date(faq.created_at) > new Date(Date.now() - 10000)
                    ? "bg-green-50"
                    : new Date(faq.updated_at) > new Date(Date.now() - 10000)
                    ? "bg-yellow-50"
                    : ""
                }`}
              >
                <p className="font-medium text-gray-900">{faq.question}</p>
                <p className="text-sm text-gray-600 mt-1">{faq.answer}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(faq.created_at) > new Date(Date.now() - 10000)
                    ? "🆕 New FAQ"
                    : new Date(faq.updated_at) > new Date(Date.now() - 10000)
                    ? "🔁 Updated"
                    : ""}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
