const API_BASE = "https://villagelink.site/backend/api";

class PollingService {
  constructor(interval = 2000) {
    if (PollingService.instance) {
      return PollingService.instance;
    }
    PollingService.instance = this;

    this.interval = interval;
    this.listeners = new Map();
    this.isPolling = false;
    this.lastFetchTime = null;
    this.currentData = [];
  }

  startPolling() {
    if (this.isPolling) return;
    console.log('Starting polling service...');
    this.isPolling = true;
    this.poll();
  }

  stopPolling() {
    console.log('Stopping polling service...');
    this.isPolling = false;
  }

  async fetchAnnouncements() {
    try {
      const response = await fetch(`${API_BASE}/announcements.php`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const text = await response.text();
      if (text.startsWith("<")) {
        throw new Error("Backend returned HTML instead of JSON");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid JSON from backend");
      }

      if (!Array.isArray(data)) {
        throw new Error("Backend did not return an array");
      }

      return data;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return null;
    }
  }

  async poll() {
    while (this.isPolling) {
      try {
        const data = await this.fetchAnnouncements();
        if (!data) continue;

        // Sort by created_at to ensure newest first
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // If this is our first poll, just store the data
        if (!this.lastFetchTime) {
          this.currentData = data;
          this.lastFetchTime = new Date();
          continue;
        }

        // Find new announcements by comparing with current data
        const newAnnouncements = data.filter(announcement => {
          // Check if this announcement exists in current data
          const existingAnnouncement = this.currentData.find(
            existing => existing.ann_id === announcement.ann_id
          );

          // If it doesn't exist, it's new
          if (!existingAnnouncement) {
            console.log('Found new announcement:', announcement);
            return true;
          }

          // If it exists but has been updated
          if (existingAnnouncement && 
              new Date(announcement.created_at) > new Date(existingAnnouncement.created_at)) {
            console.log('Found updated announcement:', announcement);
            return true;
          }

          return false;
        });

        if (newAnnouncements.length > 0) {
          console.log(`Found ${newAnnouncements.length} new announcements`);
          // Update current data first
          this.currentData = data;
          // Then notify listeners about each new announcement
          newAnnouncements.forEach(announcement => {
            this.notifyListeners('new_announcement', announcement);
          });
        }

        this.lastFetchTime = new Date();
      } catch (error) {
        console.error('Polling error:', error);
      }

      // Wait for the interval
      await new Promise(resolve => setTimeout(resolve, this.interval));
    }
  }

  addListener(event, callback) {
    console.log('Adding listener for event:', event);
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  removeListener(event, callback) {
    console.log('Removing listener for event:', event);
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data) {
    console.log('Notifying listeners for event:', event, 'with data:', data);
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in listener callback:', error);
        }
      });
    }
  }

  // Method to manually trigger a check for new announcements
  async checkForUpdates() {
    console.log('Manual check for updates triggered');
    const data = await this.fetchAnnouncements();
    if (!data) return;

    // Sort by created_at to ensure newest first
    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Find new announcements
    const newAnnouncements = data.filter(announcement => {
      const existingAnnouncement = this.currentData.find(
        existing => existing.ann_id === announcement.ann_id
      );

      return !existingAnnouncement || (
        existingAnnouncement && 
        new Date(announcement.created_at) > new Date(existingAnnouncement.created_at)
      );
    });

    if (newAnnouncements.length > 0) {
      console.log('Found new announcements on manual check:', newAnnouncements);
      this.currentData = data;
      newAnnouncements.forEach(announcement => {
        this.notifyListeners('new_announcement', announcement);
      });
    }
  }
}

// Create and export a singleton instance
export const pollingService = new PollingService(1000); // Poll every second