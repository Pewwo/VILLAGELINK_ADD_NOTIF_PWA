// src/services/officialsPolling.js
import EventEmitter from "../utils/EventEmitter.js";

class OfficialsPollingService extends EventEmitter {
  constructor() {
    super();
    this.interval = null;
    this.lastCheck = null;
    this.apiUrl = "https://villagelink.site/backend/api/officials_polling.php";
  }

  async fetchOfficials() {
    try {
      const response = await fetch(this.apiUrl);
      const data = await response.json();

      if (data.status !== "success" || !Array.isArray(data.officials)) return;

      const latestOfficial = data.officials[0];
      if (!latestOfficial) return;

      // Compare timestamps to detect new or updated officials
      if (!this.lastCheck || new Date(latestOfficial.updated_at) > new Date(this.lastCheck)) {
        this.lastCheck = latestOfficial.updated_at;
        this.emit("new_official", latestOfficial);
        console.log("🟢 New or updated official detected:", latestOfficial);
      }
    } catch (error) {
      console.error("Officials polling error:", error);
    }
  }

  startPolling(intervalMs = 10000) {
    if (this.interval) return;
    this.fetchOfficials(); // Run immediately
    this.interval = setInterval(() => this.fetchOfficials(), intervalMs);
  }

  stopPolling() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export const officialsPollingService = new OfficialsPollingService();
