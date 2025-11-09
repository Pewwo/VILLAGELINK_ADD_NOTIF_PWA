import React, { useState, useEffect } from 'react';
import { FaSearch, FaUserCircle, FaBell } from 'react-icons/fa';
import { pollingService } from '../../../services/polling';
import Pagination from '../../common/Pagination';
import { formatFacebookRelativeTime, isNewInPhilippineTime } from '../../../utils/timeUtils';

const API_BASE = "https://villagelink.site/backend/api";

const AnnouncementPageRes = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;



  // Helper function to check if announcement is new (within 24 hours)
  const isNewAnnouncement = (dateString) => {
    return isNewInPhilippineTime(dateString);
  };

  const categories = ["All", "Meeting", "Alert", "Event", "Notice", "Tips"];

  // ✅ Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_BASE}/announcements.php`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const text = await res.text();

      if (text.startsWith("<")) {
        throw new Error("Backend returned HTML instead of JSON:\n" + text);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid JSON from backend:\n" + text);
      }

      // ✅ Ensure announcements is always an array
      if (Array.isArray(data)) {
        setAnnouncements(data);
      } else {
        console.error("Backend did not return an array:", data);
        setAnnouncements([]);
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setAnnouncements([]); // fallback
    } finally {
      setLoading(false);
    }
  };

  // Polling integration
  useEffect(() => {
    const handleNewAnnouncement = (newAnnouncement) => {
      console.log('User: New announcement received:', newAnnouncement);
      
      // Force a fresh fetch instead of just updating state
      fetchAnnouncements().then(() => {
        console.log('Announcements refreshed after new update');
      });
    };

    pollingService.addListener('new_announcement', handleNewAnnouncement);
    pollingService.startPolling();

    return () => {
      pollingService.removeListener('new_announcement', handleNewAnnouncement);
    };
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // ✅ Filter announcements safely
  const filteredAnnouncements = Array.isArray(announcements)
    ? announcements.filter((a) => {
        const matchesCategory =
          selectedCategory === "All" || a.category === selectedCategory;
        const matchesSearch =
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.content.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
    : [];

  // Calculate paginated data
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAnnouncements = filteredAnnouncements.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Toggle expand/collapse
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };





  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Community Announcements
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Stay updated with the latest news, events, and important notices from your community
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 max-w-2xl mx-auto w-full">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="justify-center flex flex-wrap gap-2 mt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-3 rounded-full text-sm font-medium transition-all duration-300 min-h-[44px] ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Announcements */}
        {loading ? (
          <p className="text-center text-gray-600">Loading announcements...</p>
        ) : paginatedAnnouncements.length > 0 ? (
          <div className="flex flex-col items-center gap-6">
            {paginatedAnnouncements.map((announcement) => (
          <div
            key={announcement.ann_id}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 max-w-2xl w-full mx-auto"
          >
                {/* Content Section */}
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <FaUserCircle className="text-2xl text-slate-400" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {announcement.author || "Community Board"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFacebookRelativeTime(announcement.created_at)}
                      </p>
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                    {announcement.title}
                  </h3>
                  <p
                    className={`text-gray-700 ${
                      expandedId !== announcement.ann_id ? "line-clamp-3" : ""
                    }`}
                  >
                    {announcement.content}
                  </p>
                  {announcement.content.length > 150 && (
                    <button
                      onClick={() => toggleExpand(announcement.ann_id)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-4 inline-block min-h-[44px] leading-10"
                    >
                      {expandedId === announcement.ann_id ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>

                {/* Image Section */}
              {announcement.image && (
                  <div className="relative overflow-hidden rounded-b-2xl w-full" style={{ aspectRatio: '16/9' }}>
                    <img
                      src={`https://villagelink.site/backend/${announcement.image}`}
                      alt={announcement.title}
                      className="w-full h-full object-cover transition-transform duration-300 rounded-b-2xl hover:scale-105"
                      onError={(e) => {
                        e.target.src = 'src/assets/villageLinkLogo.png';
                      }}
                    />
                    <div className="absolute top-4 right-4">
                      <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-blue-800">
                        {announcement.category}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FaBell className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No announcements found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        )}


      </div>
    </div>
  );
};

export default AnnouncementPageRes;
