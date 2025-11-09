const API_BASE = "https://villagelink.site/backend/api";

class RequestPollingService {
  constructor(interval = 2000) {
    if (RequestPollingService.instance) {
      return RequestPollingService.instance;
    }
    RequestPollingService.instance = this;

    this.interval = interval;
    this.listeners = new Map();
    this.isPolling = false;
    this.lastFetchTime = new Date().toISOString();
    this.currentData = [];
  }

  startPolling() {
    if (this.isPolling) return;
    console.log('Starting request polling service...');
    this.isPolling = true;
    this.poll();
  }

  stopPolling() {
    console.log('Stopping request polling service...');
    this.isPolling = false;
  }

  async fetchRequests() {
    try {
      const response = await fetch(`${API_BASE}/compreq/get_comreq_logs.php`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to fetch data');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching requests:', error);
      return null;
    }
  }

  async poll() {
    while (this.isPolling) {
      try {
        const data = await this.fetchRequests();
        if (!data) continue;

        // Sort by created_at to ensure newest first
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // If this is our first poll, just store the data
        if (!this.currentData.length) {
          this.currentData = data;
          continue;
        }

        // Find new requests
        const newRequests = data.filter(request => {
          const existingRequest = this.currentData.find(
            existing => existing.comreq_id === request.comreq_id
          );

          // If it doesn't exist, it's new
          if (!existingRequest) {
      return true;
    }

    // If it exists but has been updated
    if (existingRequest && 
        new Date(request.updated_at) > new Date(existingRequest.updated_at)) {
      return true;
    }

          return false;
        });

        if (newRequests.length > 0) {
          // Store old data for comparison
          const oldData = [...this.currentData];
          // Update current data
          this.currentData = data;
          // Then notify listeners about each new request
          newRequests.forEach(request => {
            const wasExisting = oldData.some(
              existing => existing.comreq_id === request.comreq_id
            );
            if (!wasExisting) {
              // New request
              this.notifyListeners('new_request', request);
            } else {
              // Updated request
              this.notifyListeners('updated_request', request);
            }
          });
        }

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

  // Method to manually trigger a check for new requests
  async checkForUpdates() {
    console.log('Manual check for updates triggered');
    const data = await this.fetchRequests();
    if (!data) return;

    // Sort by created_at to ensure newest first
    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Find new requests
    const newRequests = data.filter(request => {
      const existingRequest = this.currentData.find(
        existing => existing.comreq_id === request.comreq_id
      );

      return !existingRequest || (
        existingRequest && 
        new Date(request.updated_at) > new Date(existingRequest.updated_at)
      );
    });

    if (newRequests.length > 0) {
      console.log('Found new requests on manual check:', newRequests);
      const oldData = [...this.currentData];
      this.currentData = data;
      newRequests.forEach(request => {
        const wasExisting = oldData.some(
          existing => existing.comreq_id === request.comreq_id
        );
        if (!wasExisting) {
          this.notifyListeners('new_request', request);
        } else {
          this.notifyListeners('updated_request', request);
        }
      });
    }
  }
}

// Create and export a singleton instance
export const requestPollingService = new RequestPollingService(2000); // Poll every 2 seconds
