// Socket configuration
export const SOCKET_CONFIG = {
  url: 'https://villagelink.site',  // Remove port number
  options: {
    transports: ['polling'],  // Use only polling for now
    path: '/socket.io/',
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
    forceNew: true,
    autoConnect: true,
    withCredentials: false,  // Disable credentials
    rejectUnauthorized: false
  }
};