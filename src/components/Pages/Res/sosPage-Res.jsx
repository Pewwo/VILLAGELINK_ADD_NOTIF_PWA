import React, { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

const SosPageRes = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  

  const [locationFound, setLocationFound] = useState(false);

  useEffect(() => {
    if (locationFound) {
      activateSOS();
    }
  }, [locationFound]);

  const locateUser = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates(`${latitude},${longitude}`);
        setLocationFound(true);
      },
      (error) => {
        setError('Unable to retrieve your location. Please allow location access.');
        alert('Unable to retrieve your location. Please allow location access.');
      }
    );
  };

  const activateSOS = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Use coordinates from Leaflet locate event
      if (!coordinates) {
        throw new Error('Current location not available. Please allow location access.');
      }

      // Get user ID from localStorage
      const acc_id = localStorage.getItem('userId');
      if (!acc_id) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('acc_id', acc_id);
      formData.append('realtime_coords', coordinates);
      formData.append('sos_remarks', remarks);
      formData.append('sos_status', 'ongoing');

      // Send to backend
      const response = await fetch('https://villagelink.site/backend/api/emergencies/create_emergency.php', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSuccess('SOS activated successfully! Emergency services have been notified.');
        setRemarks('');
        // Show success modal
        setShowSuccessModal(true);
      } else {
        throw new Error(result.message || 'Failed to activate SOS');
      }
    } catch (error) {
      console.error('Error activating SOS:', error);
      setError(error.message);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLocationFound(false);
    }
  };


  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSOSActivation = () => {
    if (isLoading) return;
    setShowConfirmModal(true);
    setCountdown(10); // Reset countdown when modal opens
  };

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    // Trigger locate on user confirmation
    locateUser();
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  // Countdown effect
  useEffect(() => {
    let timer;
    if (showConfirmModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (showConfirmModal && countdown === 0) {
      // Auto-click OK when countdown reaches 0
      handleConfirm();
    }
    return () => clearTimeout(timer);
  }, [showConfirmModal, countdown]);
  return (
    <div className="min-h-screen bg-gray-50 rounded-2xl py-8 px-4">
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full text-white shadow-lg">
            <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>EMERGENCY ALERT</span>
            </h3>
            <p className="mb-6 whitespace-pre-line">
              Are you sure you want to activate SOS?{'\n'}
              This will immediately notify emergency services with your current location.{'\n\n'}
              Only use this for genuine emergencies!
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-700 rounded-2xl hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-7 py-2 bg-blue-600 rounded-2xl hover:bg-blue-700 transition"
              >
                OK ({countdown})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">SOS Activated Successfully</h3>
              <p className="text-gray-600 mb-6">Emergency services have been notified with your location.</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-5">
          <h1 className="text-2xl md:text-5xl font-bold text-gray-900 mb-2">
            Emergency SOS
          </h1>
          <p className="text-lg text-gray-600">
            Immediate assistance when you need it most
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Warning Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-900 text-white p-6">
            <div className="text-center">
              <h2 className="text-lg font-bold mb-2">EMERGENCY ALERT</h2>
              <p className="text-red-100">Critical Response System</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Emergency Use Notice */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-amber-800">
                    This service is for <span className="font-bold">EMERGENCY USE ONLY</span>
                  </p>
                </div>
              </div>
            </div>

            {/* When to Use Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  When to activate SOS:
                </h3>
                <div className="space-y-3">
                  {[
                    'Medical emergencies requiring immediate assistance',
                    'Personal safety threats or security concerns',
                    'Fire emergencies or immediate danger',
                    'Any situation requiring urgent building management response'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2 mr-3"></div>
                      <p className="text-gray-700 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong>Important:</strong> Misuse of this emergency service may delay response to actual emergencies and disrupt building operations. Please use responsibly.
                </p>
              </div>

              {/* SOS Button */}
              <div className="text-center pt-6">
                

                {/* Status Messages */}
                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">
                    <p className="text-sm">{success}</p>
                  </div>
                )}

                {/* SOS Button */}
                <button
                  className={`group relative inline-flex items-center justify-center px-12 py-5 text-white text-xl font-bold rounded-full shadow-xl focus:outline-none focus:ring-4 transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                    isLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-300'
                  }`}
                  onClick={handleSOSActivation}
                  disabled={isLoading}
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="tracking-wider">ACTIVATE SOS</span>
                  <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  Emergency services will be dispatched immediately
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Available 24/7 • Direct connection to emergency response team
          </p>
        </div>
      </div>
    </div>
  );
};

export default SosPageRes;
