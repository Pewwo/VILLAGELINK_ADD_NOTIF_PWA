class EmergencyPollingService {
  constructor(interval = 2000) {
    if (EmergencyPollingService.instance) {
      return EmergencyPollingService.instance;
    }

    this.interval = interval;
    this.isPolling = false;
    this.listeners = new Map();
    this.currentData = [];
    this.lastFetchTime = null;

    EmergencyPollingService.instance = this;
  }

  async fetchEmergencies() {
    try {
      const response = await fetch('https://villagelink.site/backend/api/emergencies/get_emergency.php');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
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

      if (data.status === 'success' && Array.isArray(data.data)) {
        return data.data;
      } else {
        console.error("Invalid response format from backend:", data);
        return null;
      }
    } catch (error) {
      console.error('Error fetching emergencies:', error);
      return null;
    }
  }

  async poll() {
    while (this.isPolling) {
      try {
        const data = await this.fetchEmergencies();
        if (!data) continue;

        // Sort by created_at to ensure newest first
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // If this is our first poll, just store the data
        if (!this.lastFetchTime) {
          this.currentData = data;
          this.lastFetchTime = new Date();
          continue;
        }

        // Find new emergencies by comparing with current data
        const newEmergencies = data.filter(emergency => {
          // Check if this emergency exists in current data
          const existingEmergency = this.currentData.find(
            existing => existing.emergency_id === emergency.emergency_id
          );

          // If it doesn't exist, it's new
          if (!existingEmergency) {
            console.log('Found new emergency:', emergency);
            return true;
          }

          // If it exists but has been updated (status changed)
          if (existingEmergency && 
              existingEmergency.sos_status !== emergency.sos_status) {
            console.log('Found updated emergency:', emergency);
            return true;
          }

          return false;
        });

        if (newEmergencies.length > 0) {
          console.log(`Found ${newEmergencies.length} new/updated emergencies`);
          // Update current data first
          this.currentData = data;
          // Then notify listeners about each new emergency
          newEmergencies.forEach(emergency => {
            this.notifyListeners('new_emergency', emergency);
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
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  startPolling() {
    if (!this.isPolling) {
      console.log('Starting emergency polling service');
      this.isPolling = true;
      this.poll();
    }
  }

  stopPolling() {
    console.log('Stopping emergency polling service');
    this.isPolling = false;
  }
}

export const emergencyPollingService = new EmergencyPollingService();
