// Singleton service to manage request state
class RequestStateService {
  constructor() {
    if (RequestStateService.instance) {
      return RequestStateService.instance;
    }
    RequestStateService.instance = this;

    this.listeners = new Set();
    this.currentData = new Map(); // Map of userId -> requests
  }

  // Update data for a specific user
  updateData(userId, request) {
    console.log('RequestState: Updating data for user:', userId, request);
    
    if (!this.currentData.has(userId)) {
      this.currentData.set(userId, new Map());
    }
    
    const userRequests = this.currentData.get(userId);
    userRequests.set(request.comreq_id, request);
    
    // Notify all listeners
    this.notifyListeners(userId);
  }

  // Get all requests for a user
  getUserRequests(userId) {
    console.log('RequestState: Getting data for user:', userId);
    const userRequests = this.currentData.get(userId);
    return userRequests ? Array.from(userRequests.values()) : [];
  }

  // Set initial data for a user
  setInitialData(userId, requests) {
    console.log('RequestState: Setting initial data for user:', userId, requests);
    const requestMap = new Map();
    requests.forEach(request => {
      requestMap.set(request.comreq_id, request);
    });
    this.currentData.set(userId, requestMap);
  }

  // Add a listener for updates
  addListener(callback) {
    console.log('RequestState: Adding listener');
    this.listeners.add(callback);
  }

  // Remove a listener
  removeListener(callback) {
    console.log('RequestState: Removing listener');
    this.listeners.delete(callback);
  }

  // Notify all listeners of updates
  notifyListeners(userId) {
    console.log('RequestState: Notifying listeners for user:', userId);
    const requests = this.getUserRequests(userId);
    this.listeners.forEach(callback => {
      try {
        callback(requests);
      } catch (error) {
        console.error('Error in listener callback:', error);
      }
    });
  }
}

export const requestStateService = new RequestStateService();
