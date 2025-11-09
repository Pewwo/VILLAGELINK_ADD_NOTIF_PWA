import React, { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaUsers, FaTimes, FaCamera, FaPhone, FaUserCircle } from 'react-icons/fa';
import CropImageModal from '../../partials/CropImageModal';
import { officialsPollingService } from '../../../services/officialsPolling';

const BASE_URL = 'https://villagelink.site/backend/api/officials';

const OfficialBoardPage = () => {
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [editContact, setEditContact] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState('');

  // Fetch officials data from API
  useEffect(() => {
    const fetchOfficials = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://villagelink.site/backend/api/officials/get_officials.php');
        if (!response.ok) {
          throw new Error('Failed to fetch officials data');
        }
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (jsonError) {
          console.error('Failed to parse JSON:', text);
          throw new Error('Invalid JSON response from server');
        }
        // Transform API data to match component expectations
        const transformedData = data.map(official => ({
          ...official,
          avatar: official.avatar, // API now returns full URL
          address: 'Barangay Office' // Default address since API doesn't provide it
        }));
        setOfficials(transformedData);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching officials:', err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchOfficials();

    // Setup polling for real-time updates
    const handleNewOfficial = (newOfficial) => {
      console.log('Admin: New/Updated official received:', newOfficial);
      
      // Transform the official data
      const transformedOfficial = {
        ...newOfficial,
        avatar: newOfficial.avatar ? `${BASE_URL}/${newOfficial.avatar}` : newOfficial.avatar,
        address: 'Barangay Office'
      };

      // Update the official in place if it exists, otherwise add it to the beginning
      setOfficials(prevData => {
        const existingIndex = prevData.findIndex(official => official.id === newOfficial.id);
        if (existingIndex !== -1) {
          // Update existing official
          const updatedData = [...prevData];
          updatedData[existingIndex] = transformedOfficial;
          return updatedData;
        } else {
          // Add new official to the beginning
          return [transformedOfficial, ...prevData];
        }
      });
    };

    console.log('Admin side: Adding listener for new_official');
    officialsPollingService.addListener('new_official', handleNewOfficial);
    
    // Only start polling if not already running
    if (!officialsPollingService.isPolling) {
      console.log('Admin side: Starting polling service');
      officialsPollingService.startPolling();
    } else {
      console.log('Admin side: Polling service already running, just adding listener');
    }

    return () => {
      officialsPollingService.removeListener('new_official', handleNewOfficial);
    };
  }, []);

  const openModal = (index) => {
    setModalIndex(index);
    const official = officials[index];
    setSelectedId(official.id);
    setEditName(official.name);
    setEditRole(official.role);
    setEditAvatar(official.avatar);
    setEditContact(official.contact);
    setPhoneNumber(official.contact ? official.contact.replace('+63', '') : '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalIndex(null);
    setSelectedId(null);
  };

  const saveModal = async () => {
    let missingFields = [];
    if (editName.trim() === '') missingFields.push('Name');
    const fullContact = '+63' + phoneNumber.trim();
    if (fullContact.trim() === '+63') missingFields.push('Contact');

    if (missingFields.length > 0) {
      setErrorMessage(`Missing fields: ${missingFields.join(', ')}`);
      setShowErrorModal(true);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('id', selectedId);
      formData.append('name', editName);
      formData.append('role', editRole);
      formData.append('contact', fullContact);

      // Append avatar file if a new file is selected
      if (editAvatarFile) {
        formData.append('image', editAvatarFile);
      } else if (typeof editAvatar === 'string' && editAvatar.trim() !== '') {
        // If avatar is a base64 string, do not send as avatar path
        if (editAvatar.startsWith('data:image')) {
          // Do not append avatar path, image is new upload handled by 'image' field
        } else {
          // If avatar is a string (full URL), extract relative path
          const relativeAvatar = editAvatar.replace(BASE_URL, '');
          formData.append('avatar', relativeAvatar);
        }
      }

      const response = await fetch('https://villagelink.site/backend/api/officials/update_officials.php', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Server error response:', text);
        setErrorMessage('Server error occurred. See console for details.');
        setShowErrorModal(true);
        return;
      }

      const result = await response.json();

        if (result.status === 'success') {
          // Update local state with the updated official
          const updatedOfficials = [...officials];
          const updatedOfficial = result.official;
          updatedOfficial.avatar = updatedOfficial.avatar ? `${BASE_URL}/${updatedOfficial.avatar}` : null;
          updatedOfficials[modalIndex] = updatedOfficial;
          setOfficials(updatedOfficials);
          
          // Force an immediate check for updates
          setTimeout(() => {
            console.log('Admin side: Triggering immediate update check after official update');
            officialsPollingService.checkForUpdates();
          }, 500); // Small delay to ensure backend has processed the update
          
          setSuccessMessage('Update successful!');
          setShowSuccessModal(true);
          closeModal();
        } else {
          throw new Error(result.message || 'Failed to update');
        }
    } catch (error) {
      console.error('Error updating official:', error);
      setErrorMessage('Failed to update: ' + error.message);
      setShowErrorModal(true);
    }
  };

  const setDefaultAvatar = () => {
    setEditAvatar(null);
    setEditAvatarFile(null);
    setSuccessMessage('Avatar set to default!');
    setShowSuccessModal(true);
  };

  const handleCropCancel = useCallback(() => {
    setShowCropModal(false);
    setImageSrc('');
    setEditAvatarFile(null);
  }, []);

  const handleCropConfirm = useCallback((blob, fileUrl) => {
    setEditAvatar(fileUrl);
    setEditAvatarFile(blob);
    setShowCropModal(false);
    setImageSrc('');
  }, []);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
            <span className="text-5xl text-blue-600"><FaUsers /></span>
          </div>
          <h1 className="text-5xl font-bold text-blue-950 mb-4">
            Board Of Directory Officials
          </h1>
          <p className="text-gray-700 text-md max-w-xl mx-auto">
            Meet our dedicated team of officials committed to serving our community with excellence and integrity.
          </p>
        </div>

        {/* Loading State */}
        {/* Removed loading and error states */}

      {/* Officials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-8">
        {officials.map(({ id, name, role, avatar, contact }, index) => (
          <div
            key={id}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-200"
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Card Content */}
            <div className="relative p-6 flex flex-col items-center text-center">
              {/* Avatar with Ring */}
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full blur-xl opacity-10 group-hover:opacity-50 transition-opacity duration-300"></div>
              {avatar && avatar !== 'null' && avatar !== '' ? (
                <img
                  src={avatar.startsWith('http') ? avatar : `${BASE_URL}${avatar}`}
                  alt={name}
                  className="relative w-24 h-24 rounded-full object-cover border-1 border-white shadow-lg"
                />
              ) : (
                <FaUserCircle className="relative w-24 h-24 rounded-full text-slate-200 bg-gray-300 shadow-lg" />
              )}
              </div>

              {/* Name and Role */}
              <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-950 transition-colors duration-300">
                {name || '\u00A0' /* non-breaking space for empty name */}
              </h3>
              <p className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full mb-4">
                {role}
              </p>

              {/* Contact */}
              <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                <FaPhone className="text-blue-600" />
                {contact || '\u00A0'}
              </p>

              {/* Action Button */}
              <button
                onClick={() => openModal(index)}
                className="flex items-center gap-2 bg-blue-950 text-blue-50 px-4 py-2 rounded-lg hover:bg-blue-800 transition-all duration-300 shadow hover:shadow-md transform hover:scale-105"
              >
                <FaEdit className="text-sm" />
                <span className="font-medium">View Details</span>
              </button>
            </div>
          </div>
        ))}
      </div>

        {/* Mobile-Responsive Modal */}
        {showModal && (
          <div className="fixed inset-0 flex justify-center items-center z-[9999] bg-black/50 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full mx-3 sm:mx-6 relative max-w-full sm:max-w-2xl lg:max-w-4xl h-[74vh] flex flex-col animate-[fadeIn_0.25s_ease-out]">

              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200 z-10"
                aria-label="Close modal"
              >
                <FaTimes className="text-gray-600 text-base" />
              </button>

              {/* Modal Header */}
              <div className="p-5 sm:p-7 border-b border-gray-200">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Official Details
                </h2>
                <p className="text-sm text-gray-500 mt-1">Manage and update official information</p>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-7">
                <div className="flex flex-col lg:flex-row gap-6">

                  {/* Avatar Section */}
                  <div className="lg:w-1/3 flex-shrink-0 flex-1 flex-col items-center justify-center">
                    <div className="relative mb-6 w-full mt-4 max-w-xs flex justify-center">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full blur-2xl opacity-20"></div>
                        {editAvatar ? (
                          <img
                            src={editAvatar}
                            alt={editName}
                            className="relative w-56 h-56 aspect-square rounded-full shadow-lg object-cover border-4 border-white"
                          />
                        ) : (
                          <FaUserCircle className="relative w-56 h-56 aspect-square text-slate-300 bg-gray-100 rounded-full shadow-lg border-4 border-white" />
                        )}
                        <label
                          htmlFor="fileInput"
                          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-blue-600/50 text-white rounded-full opacity-0 cursor-pointer transition-opacity duration-300 group-hover:opacity-100"
                        >
                          <FaCamera className="text-sm" />
                          Change Photo
                        </label>
                      </div>

                      <div className="flex flex-col items-center">
                        <input
                          type="file"
                          accept="image/*"
                          id="fileInput"
                          className="hidden"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setImageSrc(event.target.result);
                                setShowCropModal(true);
                              };
                              reader.readAsDataURL(file);
                              // Temporarily store, will be replaced by cropped if confirmed
                              setEditAvatarFile(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="items-center text-center space-y-2">
                        <button
                            onClick={setDefaultAvatar}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
                          >
                            Remove photo
                        </button>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="lg:w-2/3 space-y-5">

                    {/* Name Field */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all"
                        placeholder="Enter full name"
                      />
                    </div>

                    {/* Role Field */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                      <span className="block text-base text-gray-800 font-medium">{editRole}</span>
                    </div>

                    {/* Contact Field */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">+63</span>
                        <input
                          type="tel"
                          value={phoneNumber}
                          maxLength="10"
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all"
                          placeholder="Enter contact number"
                        />
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-5 sm:p-7 border-t border-gray-200 flex justify-end gap-3">
                      <button
                        onClick={saveModal}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-3xl hover:bg-blue-700 transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 flex justify-center items-center z-[10000] bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-md lg:max-w-lg mx-4">
              <h3 className="text-base sm:text-lg font-bold text-red-600 mb-4">Validation Error</h3>
              <p className="text-gray-700 mb-6 text-sm sm:text-base">{errorMessage}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 flex justify-center items-center z-[10000] bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-md lg:max-w-lg mx-4">
              <h3 className="text-base sm:text-lg font-bold text-blue-600 mb-4">Update Successful</h3>
              <p className="text-gray-700 mb-6 text-sm sm:text-base">{successMessage}</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Crop Image Modal */}
        <CropImageModal
          isOpen={showCropModal}
          imageSrc={imageSrc}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      </div>
    </div>
  );
};

export default OfficialBoardPage;
