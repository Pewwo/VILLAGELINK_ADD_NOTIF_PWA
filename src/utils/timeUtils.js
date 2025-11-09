// 🕒 Utility functions for consistent time formatting in Philippine timezone (Asia/Manila, UTC+8)
// (Assumes backend server saves time in Indonesian timezone, UTC+7)

/**
 * Converts a date string from Indo time (UTC+7) to Philippine time (UTC+8)
 * @param {string|Date} dateString - The date to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted date string in Philippine timezone
 */
export const formatToPhilippineTime = (dateString, options = {}) => {
  const date = new Date(dateString);
  // Add 1 hour (3600000 ms) to convert UTC+7 → UTC+8
  const phTime = new Date(date.getTime() + (1 * 60 * 60 * 1000));
  return phTime.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    ...options
  });
};

/**
 * Formats a timestamp as a relative time string (e.g., "2 hours ago") in Philippine timezone
 */
export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  // Convert UTC+7 → UTC+8
  const phTime = new Date(date.getTime() + (1 * 60 * 60 * 1000));

  const now = new Date();
  // Current local PH time
  const phNow = new Date(now.getTime());

  const diffMs = phNow - phTime;
  const diffInHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};

/**
 * Formats a date for display in Philippine timezone
 */
export const formatPhilippineDate = (dateString) => {
  return formatToPhilippineTime(dateString, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formats a time for display in Philippine timezone
 */
export const formatPhilippineTime = (dateString) => {
  return formatToPhilippineTime(dateString, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Formats both date and time for display in Philippine timezone
 */
export const formatPhilippineDateTime = (dateString) => {
  const date = formatToPhilippineTime(dateString, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const time = formatToPhilippineTime(dateString, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return `${date} • ${time}`;
};

/**
 * Formats timestamp as Facebook-style relative time in Philippine timezone
 */
export const formatFacebookRelativeTime = (dateString) => {
  const date = new Date(dateString);
  // Use server time directly for relative calculation
  const phTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
  const now = new Date();
  const phNow = new Date(now.getTime());
  const diffMs = phNow - phTime;

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;

  if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;

  const monthDay = formatToPhilippineTime(dateString, {
    month: 'short',
    day: 'numeric'
  });
  const year = phTime.getFullYear();
  const time = formatToPhilippineTime(dateString, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `${monthDay}, ${year}`;
};

/**
 * Formats a timestamp from server time (UTC+7) to Philippine time (UTC+8) and provides both exact datetime and relative time display
 * @param {string|Date} serverTimestamp - The timestamp from the server (UTC+7)
 * @returns {object} Object with exactTime and relativeTime properties
 */
export const formatPhilippineTimeFromServer = (serverTimestamp) => {
  const serverDate = new Date(serverTimestamp);
  // Convert from server time (UTC+7) to Philippine time (UTC+8)
  const phTime = new Date(serverDate.getTime() + (8 * 60 * 60 * 1000));

  // Exact datetime in Philippine time
  const exactTime = phTime.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Relative time calculation
  const now = new Date();
  const phNow = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // Make the current time 7 hours less
  const diffMs = phNow - phTime;

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  let relativeTime;
  if (diffSec < 60) {
    relativeTime = 'just now';
  } else if (diffMin < 60) {
    relativeTime = `${diffMin} min ago`;
  } else if (diffHour < 24) {
    relativeTime = `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDay < 7) {
    relativeTime = `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
  } else {
    // For older dates, show month day, year
    const monthDay = phTime.toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric'
    });
    const year = phTime.getFullYear();
    relativeTime = `${monthDay}, ${year}`;
  }

  return {
    exactTime: `${exactTime} (PH Time)`,
    relativeTime
  };
};

/**
 * Checks if an announcement/date is new (within 24 hours) in Philippine timezone
 */
export const isNewInPhilippineTime = (dateString) => {
  const date = new Date(dateString);
  // Convert to PH time (UTC+8)
  const phTime = new Date(date.getTime() + (1 * 60 * 60 * 1000));
  const now = new Date();
  const phNow = new Date(now.getTime());
  const diffInHours = Math.floor((phNow - phTime) / (1000 * 60 * 60));
  return diffInHours < 24;
};
