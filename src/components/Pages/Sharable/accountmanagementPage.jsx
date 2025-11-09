import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaEdit, FaSearch, FaTimes, FaTimes as FaClose, FaSpinner, FaCheck, FaTimes as FaX, FaUserCheck, FaArchive } from 'react-icons/fa';
import AccountUpdateMap from '../../partials/AccountMap';
import Avatar from '../../common/Avatar';

const API_BASE = "https://villagelink.site/backend/api";

const AccountManagementPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [showNoResults, setShowNoResults] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editedUser, setEditedUser] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [userToArchive, setUserToArchive] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [isArchiveSuccessModalOpen, setIsArchiveSuccessModalOpen] = useState(false);
  const [archivedUserName, setArchivedUserName] = useState('');

  const confirmArchive = async () => {
    if (!userToArchive) return;

    try {
      setArchiving(true);
      setIsArchiveModalOpen(false);

      const response = await fetch('https://villagelink.site/backend/api/archive.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'users',
          id: userToArchive.id
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setArchivedUserName(userToArchive.name);
        setIsArchiveSuccessModalOpen(true);
        await fetchUsers();
      } else {
        alert('Failed to archive user: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error archiving user:', err);
      alert('Failed to archive user. Please try again.');
    } finally {
      setArchiving(false);
      setUserToArchive(null);
    }
  };

  const closeArchiveModal = () => {
    setIsArchiveModalOpen(false);
    setUserToArchive(null);
  };

  // Fetch users from API on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const BACKEND_BASE_URL = 'https://villagelink.site/backend/';
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('https://villagelink.site/backend/api/accountmanagement/get_users.php');
      const data = await response.json();

      if (data.status === "success") {
        // Use the already parsed latitude and longitude from API, create locationUrl
        const usersWithCoords = data.data.map(user => {
          let locationUrl = '';
          if (user.latitude && user.longitude) {
            locationUrl = `https://maps.google.com/?q=${user.latitude},${user.longitude}`;
          }
          // Transform profile_picture to full URL if present
          const profile_picture = user.profile_picture
            ? (user.profile_picture.startsWith('https') ? user.profile_picture : BACKEND_BASE_URL + user.profile_picture)
            : '';
          return { ...user, locationUrl, profile_picture };
        });

        // Filter out the logged-in user from the list
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        const filteredUsers = loggedInUser ? usersWithCoords.filter(user => user.id !== loggedInUser.acc_id) : usersWithCoords;

        setUsers(filteredUsers);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to connect to the server');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const roles = ['President', 'Vice President', 'Secretary', 'Security', 'Resident'];

  // Helper function to determine if user is approved
  const isUserApproved = (user) => {
    // Use the actual approve_status from the API response
    return user.approve_status === 'Approved';
  };

  // Calculate enhanced stats
  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate actual recent users based on creation date (within last 7 days)
    const recentUsers = users.filter(user => {
      // Check for common creation date field names
      const creationDate = user.created_at || user.created_date || user.date_created || user.registration_date || user.created;

      if (creationDate) {
        try {
          // Handle different date formats more robustly
          let userDate;

          if (typeof creationDate === 'string') {
            // Handle various string date formats
            userDate = new Date(creationDate);

            // If the date is invalid, try parsing common formats
            if (isNaN(userDate.getTime())) {
              // Try ISO format or other common formats
              const formats = [
                creationDate,
                creationDate + (creationDate.includes('T') ? '' : 'T00:00:00'),
                creationDate.replace(' ', 'T')
              ];

              for (const format of formats) {
                const parsed = new Date(format);
                if (!isNaN(parsed.getTime())) {
                  userDate = parsed;
                  break;
                }
              }
            }
          } else if (typeof creationDate === 'number') {
            // Handle timestamp (could be in seconds or milliseconds)
            if (creationDate > 1e10) {
              // Likely milliseconds
              userDate = new Date(creationDate);
            } else {
              // Likely seconds
              userDate = new Date(creationDate * 1000);
            }
          } else {
            return false;
          }

          // Check if date is valid
          if (isNaN(userDate.getTime())) {
            console.warn('Invalid date found for user:', user.name, 'Date value:', creationDate);
            return false;
          }


          return isRecent;
        } catch (error) {
          console.warn('Error parsing date for user:', user.name, 'Date value:', creationDate, error);
          return false;
        }
      }

      return false;
    }).length;

    // Use actual approve_status from API for pending approvals count
    const pendingApprovals = users.filter(user => user.approve_status === 'Unapproved').length;

    const roleBreakdown = roles.reduce((acc, role) => {
      acc[role] = users.filter(user => user.role === role).length;
      return acc;
    }, {});

    return {
      pendingApprovals,
      roleBreakdown,
      totalUsers: users.length,
      activeUsers: users.length, // In real app, this would filter by active status
      approvedUsers: users.filter(user => user.approve_status === 'Approved').length,
      residents: roleBreakdown.Resident || 0
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
      let filtered = users;

      // Apply role filter first
      if (roleFilter) {
        filtered = filtered.filter(user => user.role === roleFilter);
      }

      // Apply approval filter
      if (approvalFilter) {
        if (approvalFilter === 'Approved') {
          filtered = filtered.filter(user => isUserApproved(user));
        } else if (approvalFilter === 'Unapproved') {
          filtered = filtered.filter(user => !isUserApproved(user));
        }
      }

      // Apply search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(user =>
          user.name.toLowerCase().includes(query) ||
          user.phone.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.address.toLowerCase().includes(query)
        );
      }

      setShowNoResults(filtered.length === 0);
      return filtered;
    }, [searchQuery, roleFilter, approvalFilter, users]);

  // Calculate paginated data
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, approvalFilter]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleArchive = async (user) => {
    if (!user) return;
    setUserToArchive(user);
    setIsArchiveModalOpen(true);
  };

  const handleApprove = async (user) => {
    if (!user) return;
    setUserToApprove(user);
    setIsApproveModalOpen(true);
  };

  const confirmApprove = async () => {
    if (!userToApprove) return;

    try {
      setApproving(true);
      setIsApproveModalOpen(false);

      // Call backend API to approve user
      const response = await fetch('https://villagelink.site/backend/api/accountmanagement/update_approved_status.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acc_id: userToApprove.id,
          approved_status: 'Approved'
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('User approved successfully:', userToApprove.name, 'ID:', userToApprove.id);
        alert(`User ${userToApprove.name} has been approved successfully!`);

        // Refresh the users list to get updated data
        await fetchUsers();
      } else {
        alert('Failed to approve user: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error approving user:', err);
      alert('Failed to approve user. Please try again.');
    } finally {
      setApproving(false);
      setUserToApprove(null);
    }
  };

  const closeApproveModal = () => {
    setIsApproveModalOpen(false);
    setUserToApprove(null);
  };

  const handleEdit = (user) => {
    console.log("handleEdit user data:", user);
    setSelectedUser(user);
    const firstname = user.first_name || '';
    const middlename = user.middle_name || '';
    const lastname = user.last_name || '';

    // Use the already parsed latitude and longitude from API
    const latitude = user.latitude || '';
    const longitude = user.longitude || '';

    // Construct locationUrl from latitude and longitude if available
    let locationUrl = user.locationUrl || '';
    if (!locationUrl && latitude && longitude) {
      locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    }

    setEditedUser({
      ...user,
      firstname,
      middlename,
      lastname,
      latitude,
      longitude,
      blk: user.blk || '',
      lot: user.lot || '',
      ph: user.ph || '',
      street: user.street || '',
      subdivision: user.subdivision || 'Residencia De Muzon',
      province: user.province || 'City of San Jose Del Monte, Bulacan',
      locationUrl,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const combinedName = `${editedUser.firstname || ''} ${editedUser.middlename || ''} ${editedUser.lastname || ''}`.trim();

      // Format coordinates like in signup page
      let coordinates = null;
      if (editedUser.latitude && editedUser.longitude) {
        coordinates = `${editedUser.latitude}, ${editedUser.longitude}`;
      }

      const response = await fetch('https://villagelink.site/backend/api/accountmanagement/update_user.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acc_id: editedUser.id,
          first_name: editedUser.firstname,
          middle_name: editedUser.middlename,
          last_name: editedUser.lastname,
          email: editedUser.email,
          role: editedUser.role,
          blk: editedUser.blk,
          lot: editedUser.lot,
          ph: editedUser.ph,
          street: editedUser.street,
          phone_number: editedUser.phone,
          coordinates: coordinates || null,
          approved_status: editedUser.approve_status || 'Unapproved',
          subdivision: editedUser.subdivision,
          province: editedUser.province
        })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the users list to get updated data
        await fetchUsers();
        setIsModalOpen(false);
      } else {
        alert('Failed to update user: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [userToApprove, setUserToApprove] = useState(null);

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setUserToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch('https://villagelink.site/backend/api/accountmanagement/delete_user.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acc_id: userToDelete.id
        })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the users list
        await fetchUsers();
        alert('User deleted successfully');
      } else {
        alert('Failed to delete user: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user. Please try again.');
    } finally {
      setDeleting(false);
      closeDeleteModal();
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl mt-3 md:text-4xl font-semibold text-gray-900 mb-4 md:mb-6">Account Management</h1>
        <div className="p-4 md:p-6 bg-gray-100 rounded-2xl min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl mt-3 md:text-4xl font-semibold text-gray-900 mb-4 md:mb-6">Account Management</h1>
        <div className="p-4 md:p-6 bg-gray-100 rounded-2xl min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Users</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Account Management
          </h1>
          <p className="text-gray-600 text-lg">Manage user accounts, roles, and permissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-yellow-100">
                <FaUserCheck className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100">
                <FaUserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm mb-3 pb-2">
          <label className="block text-xs font-medium text-gray-700/70 pl-3 pt-2 mb-2">Filter</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mx-4 sm:mx-6 lg:mx-10 mb-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, phone, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <FaSearch className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Approval</label>
              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Users</option>
                <option value="Approved">Approved</option>
                <option value="Unapproved">Unapproved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logs</label>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/spLayout/archivedAccountmanagement')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-900 transition-colors"
                >
                  Deleted Accounts
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {showNoResults ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.profile_picture ? (
                                <img className="h-10 w-10 rounded-full object-cover" src={user.profile_picture} alt="" />
                              ) : (
                                <Avatar name={user.name} size="40px" />
                              )}
                            </div>
                            <div className="ml-4">
                               <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isUserApproved(user)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {isUserApproved(user) ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {!isUserApproved(user) && (
                              <button
                                onClick={() => handleApprove(user)}
                                disabled={approving}
                                className="text-green-600 hover:text-green-900 p-1 rounded transition-colors duration-200"
                                title="Approve User"
                              >
                                <FaUserCheck className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(user)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors duration-200"
                              title="Edit User"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleArchive(user)}
                              disabled={archiving}
                              className="text-orange-600 hover:text-orange-900 p-1 rounded transition-colors duration-200"
                              title="Delete User"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {user.profile_picture ? (
                        <img className="h-12 w-12 rounded-full object-cover" src={user.profile_picture} alt="" />
                      ) : (
                        <Avatar name={user.name} size="48px" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-sm text-gray-500">{user.phone}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isUserApproved(user)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {isUserApproved(user) ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    {!isUserApproved(user) && (
                      <button
                        onClick={() => handleApprove(user)}
                        disabled={approving}
                        className="text-green-600 hover:text-green-900 p-2 rounded transition-colors duration-200"
                        title="Approve User"
                      >
                        <FaUserCheck className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded transition-colors duration-200"
                      title="Edit User"
                    >
                      <FaEdit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(user)}
                      disabled={deleting}
                      className="text-red-600 hover:text-red-900 p-2 rounded transition-colors duration-200"
                      title="Delete User"
                    >
                      <FaTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Edit Modal */}
        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 flex justify-center items-center z-[9999] p-2 sm:p-4 bg-black/60 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-full lg:max-w-6xl max-h-[95vh] relative flex flex-col overflow-hidden">
              {/*Header */}
              <div className="bg-amber-950 text-white p-5 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Account Information</h2>
                <button
                  onClick={handleCancel}
                  className="text-white hover:text-gray-300 transition-colors duration-200"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Column 1: User Profile */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">User Profile</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={editedUser.firstname}
                          onChange={(e) => setEditedUser({...editedUser, firstname: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                        <input
                          type="text"
                          placeholder='--'
                          value={editedUser.middlename}
                          onChange={(e) => setEditedUser({...editedUser, middlename: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={editedUser.lastname || ''}
                          onChange={(e) => setEditedUser({...editedUser, lastname: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Contact Information & Address */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Contact Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            +63
                          </span>
                          <input
                            type="text"
                            value={editedUser.phone ? editedUser.phone.replace('+63', '') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                              const phoneNumber = value.length <= 10 ? value : value.slice(0, 10);

                              setEditedUser({...editedUser, phone: phoneNumber ? '+63' + phoneNumber : ''});

                              if (phoneNumber && phoneNumber.length !== 10) {
                                setPhoneError('Phone number must be exactly 11 digits');
                              } else {
                                setPhoneError('');
                              }
                            }}
                            placeholder="9XXXXXXXXX"
                            maxLength={10}
                            className={`w-full px-3 py-2 border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              phoneError ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                        </div>
                        {phoneError && (
                          <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={editedUser.email || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setEditedUser({...editedUser, email: value});
                            if (value && !value.includes('@' && '.com')) {
                              setEmailError('Email must be a valid email address');
                            } else {
                              setEmailError('');
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            emailError ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {emailError && (
                          <p className="text-red-500 text-sm mt-1">{emailError}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                          value={editedUser.role || ''}
                          onChange={(e) => setEditedUser({...editedUser, role: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {roles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2 mt-8">Address Information</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
                          <input
                            type="number"
                            value={editedUser.blk || ''}
                            onChange={(e) => setEditedUser({...editedUser, blk: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Lot</label>
                          <input
                            type="number"
                            value={editedUser.lot || ''}
                            onChange={(e) => setEditedUser({...editedUser, lot: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                          <input
                            type="number"
                            value={editedUser.ph || ''}
                            onChange={(e) => setEditedUser({...editedUser, ph: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                          <input
                            type="text"
                            value={editedUser.street || ''}
                            onChange={(e) => setEditedUser({...editedUser, street: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subdivision</label>
                        <input
                          type="text"
                          disabled
                          value={editedUser.subdivision || 'Residencia De Muzon'}
                          onChange={(e) => setEditedUser({...editedUser, subdivision: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                        <input
                          type="text"
                          disabled
                          value={editedUser.province || 'City of San Jose Del Monte, Bulacan'}
                          onChange={(e) => setEditedUser({...editedUser, province: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Location Coordinates */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Location</h3>
                    <div className="bg-gray-50 rounded-lg p-4 h-96">
                      <AccountUpdateMap
                        address={`${editedUser.blk || ''} ${editedUser.lot || ''} ${editedUser.ph || ''} ${editedUser.street || ''}`.trim()}
                        locationUrl={editedUser.locationUrl}
                        currentLocation={editedUser.latitude && editedUser.longitude ? [parseFloat(editedUser.latitude), parseFloat(editedUser.longitude)] : null}
                        onCoordinatesChange={(coords) => {
                          setEditedUser({
                            ...editedUser,
                            latitude: coords[0].toString(),
                            longitude: coords[1].toString()
                          });
                        }}
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Instructions:</strong> Click and drag on the map to set the exact location for this user. The coordinates will be automatically updated when you click on the map.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && userToDelete && (
          <div className="fixed inset-0 flex justify-center items-center z-[9999] p-2 sm:p-4 bg-black/60 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <FaTrash className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                    <p className="text-gray-600">This action cannot be undone.</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete <strong>{userToDelete.name}</strong>? This will permanently remove the user account and all associated data.
                </p>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeDeleteModal}
                    disabled={deleting}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {deleting ? 'Deleting...' : 'Delete User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Archive Confirmation Modal */}
        {isArchiveModalOpen && userToArchive && (
          <div className="fixed inset-0 flex justify-center items-center z-[9999] p-2 sm:p-4 bg-black/60 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <FaTrash className="w-8 h-8 text-orange-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                    <p className="text-gray-600">Move user to archived records.</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  Are you sure you want to archive <strong>{userToArchive.name}</strong>? This will move the user to archived records and they will no longer appear in the active user list.
                </p>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeArchiveModal}
                    disabled={archiving}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmArchive}
                    disabled={archiving}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {archiving ? 'Archiving...' : 'Archive User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approve Confirmation Modal */}
        {isApproveModalOpen && userToApprove && (
          <div className="fixed inset-0 flex justify-center items-center z-[9999] p-2 sm:p-4 bg-black/60 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <FaUserCheck className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Approve User</h3>
                    <p className="text-gray-600">Enable user login access.</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  Are you sure you want to approve <strong>{userToApprove.name}</strong>? This will enable them to log in to the system and access their account.
                </p>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeApproveModal}
                    disabled={approving}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmApprove}
                    disabled={approving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {approving ? 'Approving...' : 'Approve User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Archive Success Modal */}
        {isArchiveSuccessModalOpen && (
          <div className="fixed inset-0 flex justify-center items-center z-[9999] p-2 sm:p-4 bg-black/60 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <FaCheck className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Archive Successful</h3>
                    <p className="text-gray-600">User has been archived successfully.</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  <strong>{archivedUserName}</strong> has been moved to archived records and will no longer appear in the active user list.
                </p>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setIsArchiveSuccessModalOpen(false);
                      navigate('/spLayout/archivedAccountmanagement');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-900 transition-colors duration-200"
                  >
                    View Archived Accounts
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

export default AccountManagementPage;
                  
