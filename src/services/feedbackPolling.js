class FeedbackPollingService {
  constructor(interval = 2000) {
    if (FeedbackPollingService.instance) {
      return FeedbackPollingService.instance;
    }

    this.interval = interval;
    this.isPolling = false;
    this.listeners = new Map();
    this.currentData = [];
    this.lastFetchTime = null;

    FeedbackPollingService.instance = this;
  }

  async fetchFeedback() {
    try {
      console.log('Polling service: Fetching feedback data...');
      const url = `https://villagelink.site/backend/api/get_feedback.php?t=${Date.now()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        mode: 'cors',
      });
      
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

      // Handle both wrapped and direct array responses
      if (Array.isArray(data)) {
        // Direct array response
        console.log('Polling service: Received direct array response with', data.length, 'entries');
        return data;
      } else if (data.status === 'success' && Array.isArray(data.data)) {
        // Wrapped response
        console.log('Polling service: Received wrapped response with', data.data.length, 'entries');
        return data.data;
      } else {
        console.error("Invalid response format from backend:", data);
        return null;
      }
    } catch (error) {
      console.error('Polling service: Error fetching feedback:', error);
      return null;
    }
  }

  async poll() {
    while (this.isPolling) {
      try {
        const data = await this.fetchFeedback();
        if (!data) continue;

        // Sort by created_at to ensure newest first
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // If this is our first poll, just store the data
        if (!this.lastFetchTime) {
          this.currentData = data;
          this.lastFetchTime = new Date();
          continue;
        }

        // Find new feedback by comparing with current data
        const newFeedback = data.filter(feedback => {
          // Check if this feedback exists in current data
          const existingFeedback = this.currentData.find(
            existing => existing.feedback_id === feedback.feedback_id
          );

          // If it doesn't exist, it's new
          if (!existingFeedback) {
            console.log('Found new feedback:', feedback);
            return true;
          }

          return false;
        });

        if (newFeedback.length > 0) {
          console.log(`Found ${newFeedback.length} new feedback entries`);
          // Update current data first
          this.currentData = data;
          // Then notify listeners about each new feedback
          newFeedback.forEach(feedback => {
            this.notifyListeners('new_feedback', feedback);
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
    console.log(`Total listeners for ${event}:`, this.listeners.get(event).size);
  }

  removeListener(event, callback) {
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

  startPolling() {
    if (!this.isPolling) {
      console.log('Starting feedback polling service');
      this.isPolling = true;
      this.poll();
    } else {
      console.log('Feedback polling service already running');
    }
  }

  stopPolling() {
    console.log('Stopping feedback polling service');
    this.isPolling = false;
  }

  // Method to manually trigger a check for new feedback
  async checkForUpdates() {
    console.log('Manual check for feedback updates triggered');
    const data = await this.fetchFeedback();
    if (!data) return;

    // Sort by submitted_at to ensure newest first
    data.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

    // Find new feedback
    const newFeedback = data.filter(feedback => {
      const existingFeedback = this.currentData.find(
        existing => existing.feedback_id === feedback.feedback_id
      );

      return !existingFeedback || (
        existingFeedback && 
        new Date(feedback.submitted_at) > new Date(existingFeedback.submitted_at)
      );
    });

    if (newFeedback.length > 0) {
      console.log('Found new feedback on manual check:', newFeedback);
      this.currentData = data;
      console.log('About to notify listeners, current listener count:', this.listeners.get('new_feedback')?.size || 0);
      newFeedback.forEach(feedback => {
        this.notifyListeners('new_feedback', feedback);
      });
    } else {
      console.log('No new feedback found on manual check');
    }
  }
}

export const feedbackPollingService = new FeedbackPollingService();
