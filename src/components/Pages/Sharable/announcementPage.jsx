import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaPlus,
  FaUserCircle,
  FaTimes,
  FaBell,
  FaArchive,
  FaEllipsisH,
} from "react-icons/fa";
import { pollingService } from "../../../services/polling";
import Pagination from "../../common/Pagination";
import { formatFacebookRelativeTime } from "../../../utils/timeUtils";

// 🌐 Hosted backend (primary source of truth)
const HOSTED_API = "https://villagelink.site/backend/api";

// 🖥️ Local backend (for syncing or offline mode)
const LOCAL_API = "http://localhost:8000";

// Detect environment - since backend is hosted, use HOSTED_API for local app as well
const API_BASE = HOSTED_API;

const CommunityBoard = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // 🔔 Notification states
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);



  // Ellipsis dropdown states
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const ellipsisDropdownRef = useRef(null);



  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  const categories = ["All", "Meeting", "Alert", "Event", "Notice", "Tips"];



  // Format timestamps using Facebook-style relative time in Philippine timezone
  const formatTimestamp = (dateString) => {
    return formatFacebookRelativeTime(dateString);
  };

  // ✅ Fetch announcements from API_BASE
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/announcements.php`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();

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
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔔 Load unread count from localStorage
  useEffect(() => {
    const savedCount = localStorage.getItem("unreadCountAdmin");
    if (savedCount) setUnreadCount(parseInt(savedCount, 10));
  }, []);

  // 🔔 Persist unread count
  useEffect(() => {
    localStorage.setItem("unreadCountAdmin", unreadCount);
  }, [unreadCount]);

  // Polling service setup
  useEffect(() => {
    const handleNewAnnouncement = (newAnnouncement) => {
      console.log("New announcement detected:", newAnnouncement);
      setUnreadCount((prev) => prev + 1);
      fetchAnnouncements();
    };

    pollingService.addListener("new_announcement", handleNewAnnouncement);
    pollingService.startPolling();

    return () => {
      pollingService.removeListener("new_announcement", handleNewAnnouncement);
    };
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Filters
  const filteredAnnouncements = announcements.filter((a) => {
    const matchesCategory =
      selectedCategory === "All" || a.category === selectedCategory;
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
  const paginatedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const toggleExpand = (id) =>
    setExpandedId(expandedId === id ? null : id);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setUnreadCount(0);
  };



  const toggleEllipsisDropdown = (ann_id) => {
    setOpenDropdownId(openDropdownId === ann_id ? null : ann_id);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ellipsisDropdownRef.current && !ellipsisDropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  // Modal controls
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingAnnouncement(null);
    setTitle("");
    setContent("");
    setCategory("");
    setImageFile(null);
    setImagePreview(null);
  };

  const openEditModal = (announcement) => {
    setIsEditing(true);
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setCategory(announcement.category);
    setImageFile(null);
    setImagePreview(announcement.image ? `https://villagelink.site/backend/${announcement.image}` : null);
    setIsModalOpen(true);
  };

  const handleImageChange = (_e) => {
    const file = _e.target.files[0];
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  // ✅ Create or Edit announcement (use API_BASE for environment detection)
  const handleSubmit = async () => {
    if (!title || !content || !category) {
      alert("Please fill in all fields.");
      return;
    }

    const formData = new FormData();
    formData.append('acc_id', '1');
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    if (isEditing && editingAnnouncement) {
      formData.append('announcement_id', editingAnnouncement.ann_id);
    }

    try {
      const endpoint = isEditing ? `${API_BASE}/update_announcement.php` : `${API_BASE}/create_announcement.php`;
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("HTTP Error:", response.status, errorText);
        alert(`❌ HTTP Error ${response.status}: ${errorText}`);
        return;
      }

      const data = await response.json();

      if (!data.success) {
        alert("❌ " + (data.message || `Failed to ${isEditing ? 'update' : 'create'} announcement`));
        return;
      }

      if (isEditing) {
        // Update the announcement in the list
        setAnnouncements((prev) =>
          prev.map((ann) =>
            ann.ann_id === editingAnnouncement.ann_id
              ? { ...ann, title, content, category, image: data.image || ann.image }
              : ann
          )
        );
        alert("✅ Announcement updated successfully.");
      } else {
        const newAnnouncement = {
          ann_id: data.announcement_id,
          title,
          content,
          category,
          author: "Community Board",
          image: data.image || null,
          created_at: new Date().toISOString(),
        };

        setAnnouncements((prev) => [newAnnouncement, ...prev]);
        pollingService.checkForUpdates();
        alert("✅ Announcement posted successfully.");
      }

      closeModal();
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'posting'} announcement:`, err);
      alert(`❌ Could not ${isEditing ? 'update' : 'post'} announcement. Error: ${err.message}. Check if local backend server is running.`);
    }
  };

  // Handle archiving an announcement
  const handleArchive = async (announcement_id) => {
    try {
      const formData = new FormData();
      formData.append('table', 'announcements');
      formData.append('id', announcement_id);

      const response = await fetch(`${API_BASE}/archive.php`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.status === 'success') {
        // Remove the archived announcement from the list
        setAnnouncements(prev => prev.filter(ann => ann.ann_id !== announcement_id));
        alert('Announcement archived successfully');
      } else {
        alert('Failed to archive: ' + result.message);
      }
    } catch (error) {
      alert('Error archiving announcement: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Community Announcements
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Create, manage, and monitor your announcements
            </p>
          </div>

          {/* Archived Button and Bell */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/spLayout/archived-announcements')}
              className="text-gray-600 px-4 py-3 rounded-xl hover:bg-black/50 hover:text-white transition-all duration-300 flex items-center gap-2 shadow-lg"
              title="View Archived Announcements"
            >
              <FaArchive />
            </button>

            {/* 🔔 Bell */}
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className="relative p-2 hover:text-blue-600"
              >
                <FaBell className="text-3xl text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-3 border-b text-gray-800 font-semibold">
                    Recent Announcements
                  </div>
                  {announcements.slice(0, 5).length > 0 ? (
                    announcements.slice(0, 5).map((a) => (
                      <div
                        key={a.ann_id}
                        className="p-3 hover:bg-gray-50 border-b last:border-0"
                      >
                        <p className="font-medium text-gray-900">{a.title}</p>
                        <p className="text-sm text-gray-600">
                          {formatTimestamp(a.created_at)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-gray-500 text-sm text-center">
                      No announcements yet
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search & Create */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 max-w-2xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={openModal}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg"
              >
                <FaPlus />
                Create
              </button>
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
          <p className="text-center text-gray-600">Loading...</p>
        ) : paginatedAnnouncements.length > 0 ? (
          paginatedAnnouncements.map((a, index) => (
            <div
              key={`ann-${a.ann_id}-${index}`}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border mb-6 border-gray-100 max-w-2xl w-full mx-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FaUserCircle className="text-2xl text-slate-400" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {a.author || "Community Board"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTimestamp(a.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => toggleEllipsisDropdown(a.ann_id)}
                      className="px-3 py-2 bg-white text-black text-sm rounded-lg hover:bg-black/20 transition duration-200 "
                    >
                      <FaEllipsisH />
                    </button>

                    {openDropdownId === a.ann_id && (
                      <div className="absolute right-0  w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                        <button
                          onClick={() => {
                            openEditModal(a);
                            setOpenDropdownId(null);
                          }}
                          className="w-full text-left px-2 py-1.5 hover:bg-gray-50 border-b"
                        >
                          Edit Announcement
                        </button>
                        <button
                          onClick={() => {
                            handleArchive(a.ann_id);
                            setOpenDropdownId(null);
                          }}
                          className="w-full text-left px-2 py-1.5 hover:bg-gray-50 "
                        >
                          Archive
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {a.title}
                </h3>
                <p
                  className={`text-gray-700 ${
                    expandedId !== a.ann_id ? "line-clamp-3" : ""
                  }`}
                >
                  {a.content}
                </p>
                {a.content.length > 150 && (
                  <button
                    onClick={() => toggleExpand(a.ann_id)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm mt-2"
                  >
                    {expandedId === a.ann_id ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
              {a.image && (
                <div className="relative overflow-hidden rounded-b-2xl">
                  <img
                    src={`https://villagelink.site/backend/${a.image}`}
                    alt={a.title}
                    className="w-full h-64 object-cover hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-4 right-4 bg-white/80 px-3 py-1 rounded-full text-sm font-semibold text-blue-800">
                    {a.category}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 mt-10">
            No announcements found.
          </p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing ? "Edit Announcement" : "Create Announcement"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              <div className="p-6">
                <label className="block font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 mb-4 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />

                <label className="block font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 mb-4 border rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                />

                <label className="block font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 mb-4 border rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.slice(1).map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>

                <label className="block font-medium text-gray-700 mb-2">
                  Upload Image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 mb-4 border rounded-xl"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="rounded-xl mb-4 max-h-48 object-cover w-full"
                  />
                )}

                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 border py-3 rounded-xl hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default CommunityBoard;
