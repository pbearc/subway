// src/utils/distanceCalculator.js

/**
 * Earth's radius in kilometers
 * @constant
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Default radius for nearby search in kilometers
 * @constant
 */
const DEFAULT_RADIUS_KM = 5;

/**
 * Validates if a value is a valid coordinate number
 * @param {any} value - Value to validate
 * @returns {boolean} True if the value is a valid coordinate
 */
const isValidCoordinate = (value) => {
  return value !== null && value !== undefined && !isNaN(parseFloat(value));
};

/**
 * Converts degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
const degreesToRadians = (degrees) => {
  return (degrees * Math.PI) / 180;
};

/**
 * Calculates distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers or Infinity if inputs are invalid
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Validate inputs
  if (
    !isValidCoordinate(lat1) ||
    !isValidCoordinate(lon1) ||
    !isValidCoordinate(lat2) ||
    !isValidCoordinate(lon2)
  ) {
    return Infinity;
  }

  // Parse inputs to ensure they're numbers
  const latitude1 = parseFloat(lat1);
  const longitude1 = parseFloat(lon1);
  const latitude2 = parseFloat(lat2);
  const longitude2 = parseFloat(lon2);

  // Convert latitude and longitude from degrees to radians
  const dLat = degreesToRadians(latitude2 - latitude1);
  const dLon = degreesToRadians(longitude2 - longitude1);

  // Haversine formula
  const lat1Rad = degreesToRadians(latitude1);
  const lat2Rad = degreesToRadians(latitude2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c; // Distance in kilometers
};

/**
 * Checks if an outlet has valid coordinates
 * @param {Object} outlet - Outlet object
 * @returns {boolean} True if outlet has valid coordinates
 */
const hasValidCoordinates = (outlet) => {
  return (
    outlet &&
    isValidCoordinate(outlet.latitude) &&
    isValidCoordinate(outlet.longitude)
  );
};

/**
 * Find outlets within a given radius
 * @param {Object} centerOutlet - The center outlet
 * @param {Array} outlets - Array of all outlets
 * @param {number} [radius=DEFAULT_RADIUS_KM] - Radius in kilometers
 * @returns {Array} Array of outlets within the radius
 */
export const findOutletsWithinRadius = (
  centerOutlet,
  outlets,
  radius = DEFAULT_RADIUS_KM
) => {
  if (!hasValidCoordinates(centerOutlet) || !Array.isArray(outlets)) {
    return [];
  }

  return outlets.filter((outlet) => {
    // Skip the center outlet itself
    if (outlet.id === centerOutlet.id) return false;

    // Skip outlets without coordinates
    if (!hasValidCoordinates(outlet)) return false;

    const distance = calculateDistance(
      centerOutlet.latitude,
      centerOutlet.longitude,
      outlet.latitude,
      outlet.longitude
    );

    return distance <= radius;
  });
};

/**
 * Sort outlets by distance from a given point
 * @param {Array} outlets - Array of outlets
 * @param {number} latitude - Reference latitude
 * @param {number} longitude - Reference longitude
 * @returns {Array} Sorted array of outlets with distance
 */
export const sortOutletsByDistance = (outlets, latitude, longitude) => {
  if (
    !Array.isArray(outlets) ||
    !isValidCoordinate(latitude) ||
    !isValidCoordinate(longitude)
  ) {
    return [];
  }

  return outlets
    .filter(hasValidCoordinates)
    .map((outlet) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        outlet.latitude,
        outlet.longitude
      );

      return {
        ...outlet,
        distance,
      };
    })
    .sort((a, b) => a.distance - b.distance);
};
