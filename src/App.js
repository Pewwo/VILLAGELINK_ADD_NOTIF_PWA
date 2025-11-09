import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

import { SOCKET_CONFIG } from './config/socket';

function App() {
  const [announcements, setAnnouncements] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Establish Socket.IO connection
    const socketConnection = io(SOCKET_CONFIG.url, SOCKET_CONFIG.options);
    setSocket(socketConnection);

    // Listen for 'new_announcement' events from server
    socketConnection.on('new_announcement', (newAnnouncement) => {
      console.log('Received new announcement:', newAnnouncement);

      // Update React state with new data (add to beginning of list)
      setAnnouncements((prevAnnouncements) => [newAnnouncement, ...prevAnnouncements]);
    });

    // Cleanup on component unmount
    return () => {
      socketConnection.disconnect();
    };
  }, []);

  // Example function to simulate fetching initial data
  const fetchInitialAnnouncements = async () => {
    try {
      const response = await fetch('http://localhost/villagelink-backend/backend/api/announcements.php');
      const data = await response.json();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  useEffect(() => {
    fetchInitialAnnouncements();
  }, []);

  return (
    <div className="App">
      <h1>Real-Time Announcements</h1>
      <div className="announcements-list">
        {announcements.map((announcement) => (
          <div key={announcement.ann_id} className="announcement-item">
            <h3>{announcement.title}</h3>
            <p>{announcement.content}</p>
            <small>Category: {announcement.category}</small>
            <small>Created: {new Date(announcement.created_at).toLocaleString()}</small>
          </div>
        ))}
      </div>
      <p>Connected to Socket.IO server: {socket ? 'Yes' : 'No'}</p>
    </div>
  );
}

export default App;
