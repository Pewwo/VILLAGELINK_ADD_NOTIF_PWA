import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaEdit, FaSearch, FaTimes, FaTimes as FaClose, FaSpinner, FaCheck, FaTimes as FaX, FaUserCheck, FaArchive, FaUndo } from 'react-icons/fa';
import Avatar from '../../common/Avatar';

const API_BASE = "https://villagelink.site/backend/api";

const ArchivedAccountManagementPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [showNoResults, setShowNoResults] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [resultType, setResultType] = useState('success'); // 'success' or 'error'
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);

  const handleRestoreClick = (user) => {
    setSelectedUser(user);
    setShowConfirmModal(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteConfirmModal(true);
  };

  const confirmRestore = async () => {
    if (!selectedUser) return;

    setShowConfirmModal(false);
    setRestoring(true);

    try {
      const response = await fetch('https://villagelink.site/backend/api/restore.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'users',
          id: selectedUser.acc_id
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setResultMessage('User restored successfully!');
        setResultType('success');
        setShowResultModal(true);
        await fetchArchivedUsers();
      } else {
        setResultMessage('Failed to restore user: ' + (data.message || 'Unknown error'));
        setResultType('error');
        setShowResultModal(true);
      }
    } catch (err) {
      console.error('Error restoring user:', err);
      setResultMessage('Failed to restore user. Please try again.');
      setResultType('error');
      setShowResultModal(true);
    } finally {
      setRestoring(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    setDeleteConfirmModal(false);
    setDeleting(true);

    try {
      const response = await fetch('https://villagelink.site/backend/api/delete_archived.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'users',
          id: selectedUser.acc_id
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setResultMessage('User permanently deleted successfully!');
        setResultType('success');
        setShowResultModal(true);
        await fetchArchivedUsers();
      } else {
        setResultMessage('Failed to delete user: ' + (data.message || 'Unknown error'));
        setResultType('error');
        setShowResultModal(true);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setResultMessage('Failed to delete user. Please try again.');
      setResultType('error');
      setShowResultModal(true);
    } finally {
      setDeleting(false);
    }
  };

  // Fetch archived users from API on component mount
  useEffect(() => {
    fetchArchivedUsers();
  }, []);

  const fetchArchivedUsers = async () => {
    const BACKEND_BASE_URL = 'https://villagelink.site/backend/';
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('https://villagelink.site/backend/api/get_archived_users.php'); // Assuming this API exists
      const data = await response.json();

      if (data.status === "success") {
        const usersWithCoords = data.data.map(user => {
          let locationUrl = '';
          if (user.latitude && user.longitude) {
            locationUrl = `https://maps.google.com/?q=${user.latitude},${user.longitude}`;
          }
          const profile_picture = user.profile_picture
            ? (user.profile_picture.startsWith('https') ? user.profile_picture : BACKEND_BASE_URL + user.profile_picture)
            : '';
          return { ...user, locationUrl, profile_picture };
        });

        setUsers(usersWithCoords);
      } else {
        setError(data.message || 'Failed to fetch archived users');
      }
    } catch (err) {
      setError('Failed to connect to the server');
      console.error('Error fetching archived users:', err);
    } finally {
      setLoading(false);
    }
  };

  const roles = ['President', 'Vice President', 'Secretary', 'Security', 'Resident'];

  const isUserApproved = (user) => {
    return user.approve_status === 'Approved';
  };

  const stats = useMemo(() => {
    const pendingApprovals = users.filter(user => user.approve_status === 'Unapproved').length;
    const roleBreakdown = roles.reduce((acc, role) => {
      acc[role] = users.filter(user => user.role === role).length;
      return acc;
    }, {});

    return {
      pendingApprovals,
      roleBreakdown,
      totalUsers: users.length,
      approvedUsers: users.filter(user => user.approve_status === 'Approved').length,
      residents: roleBreakdown.Resident || 0
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
      let filtered = users;

      if (roleFilter) {
        filtered = filtered.filter(user => user.role === roleFilter);
      }

      if (approvalFilter) {
        if (approvalFilter === 'Approved') {
          filtered = filtered.filter(user => isUserApproved(user));
        } else if (approvalFilter === 'Unapproved') {
          filtered = filtered.filter(user => !isUserApproved(user));
        }
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(user =>
          user.name.toLowerCase().includes(query) ||
          user.phone_number.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.address.toLowerCase().includes(query)
        );
      }

      setShowNoResults(filtered.length === 0);
      return filtered;
    }, [searchQuery, roleFilter, approvalFilter, users]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredUsers.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, approvalFilter]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl mt-3 md:text-4xl font-semibold text-gray-900 mb-4 md:mb-6">Archived Account Management</h1>
        <div className="p-4 md:p-6 bg-gray-100 rounded-2xl min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading archived users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl mt-3 md:text-4xl font-semibold text-gray-900 mb-4 md:mb-6">Archived Account Management</h1>
        <div className="p-4 md:p-6 bg-gray-100 rounded-2xl min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Archived Users</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchArchivedUsers}
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
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-200 p-2 px-4 rounded-3xl mb-4 transition duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Archived Account Management
          </h1>
          <p className="text-gray-600 text-lg">Manage archived user accounts</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Archived Users</p>
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

        <div className="bg-white rounded-xl shadow-sm mb-3 pb-2">
          <label className="block text-xs font-medium text-gray-700/70 pl-3 pt-2 mb-2">Filter</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mx-4 sm:mx-6 lg:mx-10 mb-3 gap-4">
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
          </div>
        </div>

        {showNoResults ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No archived users found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <>
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
                          {user.phone_number}
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
                            <button
                              onClick={() => handleRestoreClick(user)}
                              disabled={restoring}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors duration-200"
                              title="Restore User"
                            >
                              <FaUndo className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
                              disabled={deleting}
                              className="text-red-600 hover:text-red-900 p-1 rounded transition-colors duration-200"
                              title="Permanently Delete User"
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
                      <p className="text-sm text-gray-500">{user.phone_number}</p>
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
                    <button
                      onClick={() => handleRestoreClick(user)}
                      disabled={restoring}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded transition-colors duration-200"
                      title="Restore User"
                    >
                      <FaUndo className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user)}
                      disabled={deleting}
                      className="text-red-600 hover:text-red-900 p-2 rounded transition-colors duration-200"
                      title="Permanently Delete User"
                    >
                      <FaTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Restore</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to restore {selectedUser?.first_name} {selectedUser?.last_name}?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRestore}
                  disabled={restoring}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {restoring ? 'Restoring...' : 'Restore'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-red-900 mb-4">Confirm Permanent Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to permanently delete {selectedUser?.first_name} {selectedUser?.last_name}? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result Modal */}
        {showResultModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                {resultType === 'success' ? (
                  <FaCheck className="text-green-500 text-2xl mr-3" />
                ) : (
                  <FaTimes className="text-red-500 text-2xl mr-3" />
                )}
                <h3 className={`text-lg font-semibold ${resultType === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                  {resultType === 'success' ? 'Success' : 'Error'}
                </h3>
              </div>
              <p className="text-gray-600 mb-6">{resultMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowResultModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivedAccountManagementPage;
