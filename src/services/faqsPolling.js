class FaqsPollingService {
  constructor(interval = 2000) {
    if (FaqsPollingService.instance) {
      return FaqsPollingService.instance;
    }

    this.interval = interval;
    this.isPolling = false;
    this.listeners = new Map();
    this.currentData = [];
    this.lastFetchTime = null;

    FaqsPollingService.instance = this;
  }

  async fetchFaqs() {
    try {
      const response = await fetch('https://villagelink.site/backend/api/faqs/get_faqs.php');
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
      console.error('Error fetching FAQs:', error);
      return null;
    }
  }

  async poll() {
    while (this.isPolling) {
      try {
        const data = await this.fetchFaqs();
        if (!data) continue;

        // Sort by created_at to ensure newest first
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // If this is our first poll, just store the data
        if (!this.lastFetchTime) {
          this.currentData = data;
          this.lastFetchTime = new Date();
          continue;
        }

        // Find new or updated FAQs by comparing with current data
        const newFaqs = data.filter(faq => {
          // Check if this FAQ exists in current data
          const existingFaq = this.currentData.find(
            existing => existing.faq_id === faq.faq_id
          );

          // If it doesn't exist, it's new
          if (!existingFaq) {
            console.log('Found new FAQ:', faq);
            return true;
          }

          // If it exists but has been updated
          if (existingFaq && 
              (existingFaq.question !== faq.question || 
               existingFaq.answer !== faq.answer)) {
            console.log('Found updated FAQ:', faq);
            return true;
          }

          return false;
        });

        if (newFaqs.length > 0) {
          console.log(`Found ${newFaqs.length} new/updated FAQs`);
          // Update current data first
          this.currentData = data;
          // Then notify listeners about each new FAQ
          newFaqs.forEach(faq => {
            this.notifyListeners('new_faq', faq);
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
      console.log('Starting FAQs polling service');
      this.isPolling = true;
      this.poll();
    }
  }

  stopPolling() {
    console.log('Stopping FAQs polling service');
    this.isPolling = false;
  }
}

export const faqsPollingService = new FaqsPollingService();
