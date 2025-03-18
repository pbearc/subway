// src/utils/formatters.js

/**
 * Days of the week in order starting from Sunday
 * @constant
 */
const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Outlet status constants
 * @constant
 */
const OUTLET_STATUS = {
  OPEN: "Open Now",
  CLOSED: "Closed Now",
  CLOSED_TODAY: "Closed Today",
  UNKNOWN: "Unknown",
};

/**
 * Generic formatting constants
 * @constant
 */
const FORMATS = {
  DEFAULT_UNKNOWN: "Unknown",
  HOURS_UNAVAILABLE: "Hours not available",
  CLOSED_TODAY: "Closed today",
};

/**
 * Format time string to a readable 12-hour format
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
  if (!address) return FORMATS.DEFAULT_UNKNOWN;

  const parts = address.split(",");

  if (parts.length >= 2) {
    return parts[parts.length - 2].trim();
  } else if (parts.length === 1) {
    return parts[0].trim();
  }

  return FORMATS.DEFAULT_UNKNOWN;
};

/**
 * Format distance in kilometers
 * @param {number} distance - Distance in kilometers
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted distance
 */
export const formatDistance = (distance, decimals = 2) => {
  if (typeof distance !== "number") return FORMATS.DEFAULT_UNKNOWN;

  return `${distance.toFixed(decimals)} km`;
};

/**
 * Gets the current day of the week
 * @returns {string} Current day name
 */
const getCurrentDay = () => {
  return DAYS_OF_WEEK[new Date().getDay()];
};

/**
 * Gets the current time in HH:MM:SS format
 * @returns {string} Current time
 */
const getCurrentTime = () => {
  return new Date().toTimeString().split(" ")[0];
};

/**
 * Finds today's hours from an array of operating hours
 * @param {Array} hours - Operating hours data
 * @returns {Object|null} Today's hours object or null if not found
 */
export const getTodayOperatingHours = (hours) => {
  if (!hours || !Array.isArray(hours) || hours.length === 0) {
    return null;
  }

  const currentDay = getCurrentDay();
  return hours.find((h) => h.day_of_week === currentDay) || null;
};

/**
 * Determine status of an outlet based on operating hours
 * @param {Array} hours - Operating hours data
 * @returns {string} Status ('Open Now', 'Closed Now', etc.)
 */
export const determineOutletStatus = (hours) => {
  const todayHours = getTodayOperatingHours(hours);

  if (!todayHours) return OUTLET_STATUS.UNKNOWN;
  if (todayHours.is_closed) return OUTLET_STATUS.CLOSED_TODAY;

  const currentTime = getCurrentTime();

  if (
    currentTime >= todayHours.opening_time &&
    currentTime <= todayHours.closing_time
  ) {
    return OUTLET_STATUS.OPEN;
  } else {
    return OUTLET_STATUS.CLOSED;
  }
};

/**
 * Get today's formatted operating hours
 * @param {Array} hours - Operating hours data
 * @returns {string} Today's hours as string
 */
export const getTodayHours = (hours) => {
  const todayHours = getTodayOperatingHours(hours);

  if (!todayHours) return FORMATS.HOURS_UNAVAILABLE;
  if (todayHours.is_closed) return FORMATS.CLOSED_TODAY;

  return `Today: ${formatTime(todayHours.opening_time)} - ${formatTime(
    todayHours.closing_time
  )}`;
};

/**
 * Format a full week of operating hours
 * @param {Array} hours - Operating hours data
 * @returns {Array} Formatted hours for the week
 */
export const formatWeekHours = (hours) => {
  if (!hours || !Array.isArray(hours) || hours.length === 0) {
    return DAYS_OF_WEEK.map((day) => ({
      day,
      hours: FORMATS.HOURS_UNAVAILABLE,
    }));
  }

  return DAYS_OF_WEEK.map((day) => {
    const dayHours = hours.find((h) => h.day_of_week === day);

    if (!dayHours) return { day, hours: FORMATS.HOURS_UNAVAILABLE };
    if (dayHours.is_closed) return { day, hours: FORMATS.CLOSED_TODAY };

    return {
      day,
      hours: `${formatTime(dayHours.opening_time)} - ${formatTime(
        dayHours.closing_time
      )}`,
      isToday: day === getCurrentDay(),
    };
  });
};

/**
 * Export all status and format constants for use in other files
 */
export const STATUS = OUTLET_STATUS;
export const FORMAT = FORMATS;
