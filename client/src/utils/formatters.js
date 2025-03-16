// src/utils/formatters.js

/**
 * Format time string to a readable format
 * @param {string} timeString - Time string in HH:MM:SS or HH:MM format
 * @returns {string} Formatted time string
 */
export const formatTime = (timeString) => {
  if (!timeString) return "";

  // If it's already in 12-hour format or doesn't have seconds, just return it
  if (!timeString.includes(":") || timeString.length <= 5) {
    return timeString;
  }

  // Convert from 24-hour format to 12-hour format
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${hour12}:${minutes} ${ampm}`;
};

/**
 * Extracts area name from an address
 * @param {string} address - Full address
 * @returns {string} Area name or 'Unknown'
 */
export const extractAreaFromAddress = (address) => {
  if (!address) return "Unknown";

  const parts = address.split(",");

  if (parts.length >= 2) {
    return parts[parts.length - 2].trim();
  } else if (parts.length === 1) {
    return parts[0].trim();
  }

  return "Unknown";
};

/**
 * Format distance in kilometers
 * @param {number} distance - Distance in kilometers
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted distance
 */
export const formatDistance = (distance, decimals = 2) => {
  if (typeof distance !== "number") return "Unknown";

  return `${distance.toFixed(decimals)} km`;
};

/**
 * Determine status of an outlet based on operating hours
 * @param {Array} hours - Operating hours data
 * @returns {string} Status ('Open Now', 'Closed Now', etc.)
 */
export const determineOutletStatus = (hours) => {
  if (!hours || !Array.isArray(hours) || hours.length === 0) return "Unknown";

  const now = new Date();
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const currentDay = days[now.getDay()];

  const todayHours = hours.find((h) => h.day_of_week === currentDay);
  if (!todayHours) return "Unknown";
  if (todayHours.is_closed) return "Closed Today";

  const currentTime = now.toTimeString().split(" ")[0];

  if (
    currentTime >= todayHours.opening_time &&
    currentTime <= todayHours.closing_time
  ) {
    return "Open Now";
  } else {
    return "Closed Now";
  }
};

/**
 * Get today's formatted operating hours
 * @param {Array} hours - Operating hours data
 * @returns {string} Today's hours as string
 */
export const getTodayHours = (hours) => {
  if (!hours || !Array.isArray(hours) || hours.length === 0) {
    return "Hours not available";
  }

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const currentDay = days[new Date().getDay()];
  const todayHours = hours.find((h) => h.day_of_week === currentDay);

  if (!todayHours) return "Hours not available";
  if (todayHours.is_closed) return "Closed today";

  return `Today: ${formatTime(todayHours.opening_time)} - ${formatTime(
    todayHours.closing_time
  )}`;
};
