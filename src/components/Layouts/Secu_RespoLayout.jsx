import React, { useState, useEffect } from 'react';
import { NavbarSecu_Respo } from '../partials/NavbarSecu_Respo';
import SidebarSecu_Respo from '../partials/SidebarSecu_Respo';
import { Outlet, useNavigate } from 'react-router-dom';
import { emergencyPollingService } from '../../services/emergencyPolling';

const Secu_RespoLayout = () => {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [newEmergency, setNewEmergency] = useState(null);
  const [audio, setAudio] = useState(null);
  const navigate = useNavigate();

  // Initialize audio on mount
  useEffect(() => {
    const initAudio = () => {
      try {
        const audioElement = new Audio('/sounds/SOS.mp3');
        audioElement.loop = true;
        audioElement.volume = 0.5; // Moderate volume

        // Add event listeners for debugging
        audioElement.addEventListener('canplaythrough', () => {
          console.log('Audio loaded successfully');
        });
        audioElement.addEventListener('error', (e) => {
          console.error('Audio load error:', e);
        });
        audioElement.addEventListener('play', () => {
          console.log('Audio started playing');
        });
        audioElement.addEventListener('pause', () => {
          console.log('Audio paused');
        });

        // Preload the audio
        audioElement.load();

        setAudio(audioElement);
        console.log('Audio element created, src:', audioElement.src);
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };
    initAudio();
  }, []);

  // Function to start the continuous alert sound
  const startBeep = async () => {
    try {
      if (!audio) {
        console.error('Audio not initialized, retrying in 500ms...');
        setTimeout(async () => {
          if (audio) {
            await startBeep();
          }
        }, 500);
        return;
      }

      // Check if audio is loaded
      if (audio.readyState < 2) {
        console.log('Audio not ready, waiting...');
        await new Promise((resolve) => {
          const onCanPlay = () => {
            audio.removeEventListener('canplaythrough', onCanPlay);
            resolve();
          };
          audio.addEventListener('canplaythrough', onCanPlay);
        });
      }

      audio.currentTime = 0; // Reset to beginning
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        await playPromise;
      }

      console.log('Alert sound started');
    } catch (error) {
      console.error('Error starting alert sound:', error);
      // Try to play without await if the promise fails
      try {
        audio.currentTime = 0;
        audio.play();
        console.log('Alert sound started (fallback)');
      } catch (fallbackError) {
        console.error('Fallback play also failed:', fallbackError);
      }
    }
  };

  // Function to stop the alert sound
  const stopBeep = () => {
    try {
      if (audio) {
        audio.pause();
        audio.currentTime = 0; // Reset to beginning
        console.log('Alert sound stopped');
      }
    } catch (error) {
      console.error('Error stopping alert sound:', error);
    }
  };

  useEffect(() => {
    const handleNewEmergency = async (emergency) => {
      console.log('New emergency detected in layout:', emergency);
      setNewEmergency(emergency);
      setShowEmergencyModal(true);
    };

    emergencyPollingService.addListener('new_emergency', handleNewEmergency);
    emergencyPollingService.startPolling();

    return () => {
      emergencyPollingService.removeListener('new_emergency', handleNewEmergency);
      stopBeep(); // Cleanup on unmount
    };
  }, []);

  // Play alert sound when modal opens
  useEffect(() => {
    if (showEmergencyModal && audio) {
      startBeep();
    }
  }, [showEmergencyModal, audio]);

  const closeEmergencyModal = () => {
    setShowEmergencyModal(false);
    setNewEmergency(null);
    stopBeep(); // Stop the beep when modal closes
  };

  const viewEmergencyDetails = () => {
    stopBeep(); // Stop the beep when viewing details
    closeEmergencyModal();
    navigate('/Secu_RespoLayout/emergencyLogs', {
      state: { openEmergencyModal: newEmergency }
    });
  };

  const formatEmergencyTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    date.setHours(date.getHours() + 8); // add 8 hours
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const parseCoords = (coords) => {
    if (!coords || typeof coords !== 'string') return null;
    const parts = coords.split(',').map(p => p.trim());
    if (parts.length < 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  };

  return (
    <div>
      <NavbarSecu_Respo className="fixed"/>
      <div className="flex">
        <SidebarSecu_Respo />
        <main className="flex-1/2 p-4 ml-auto mr-auto max-w-7xl pt-16">
          <Outlet />
        </main>
      </div>

      {/* Emergency Alert Modal */}
      {showEmergencyModal && newEmergency && (
        <div className="fixed inset-0 flex justify-center items-center z-[9999] p-4 bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] relative overflow-hidden">
            {/* Emergency Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-bold">EMERGENCY ALERT</h2>
              </div>
              <p className="text-red-100 text-sm mt-1">New emergency reported</p>
            </div>

            {/* Emergency Details */}
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resident</label>
                  <p className="text-gray-900 font-semibold">
                    {(newEmergency.name || newEmergency.reporter_name || 'Unknown').replace(/,/g, '').split(' ').reverse().join(' ')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <p className="text-gray-900">{newEmergency.phone_number || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-gray-900">{newEmergency.address || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Reported</label>
                  <p className="text-gray-900">{formatEmergencyTime(newEmergency.created_at)}</p>
                </div>

                {newEmergency.realtime_coords && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <a
                      href={`https://maps.google.com/?q=${newEmergency.realtime_coords}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={stopBeep} // Stop the beep when viewing on map
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      View on Map
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={viewEmergencyDetails}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Secu_RespoLayout;
