// src/utils/distanceCalculator.js

/**
 * Calculates distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Validate inputs
  if (
    !lat1 ||
    !lon1 ||
    !lat2 ||
    !lon2 ||
    isNaN(parseFloat(lat1)) ||
    isNaN(parseFloat(lon1)) ||
    isNaN(parseFloat(lat2)) ||
    isNaN(parseFloat(lon2))
  ) {
    return Infinity;
  }

  // Parse inputs to ensure they're numbers
  const latitude1 = parseFloat(lat1);
  const longitude1 = parseFloat(lon1);
  const latitude2 = parseFloat(lat2);
  const longitude2 = parseFloat(lon2);

  // Earth's radius in kilometers
  const R = 6371;

  // Convert latitude and longitude from degrees to radians
  const dLat = ((latitude2 - latitude1) * Math.PI) / 180;
  const dLon = ((longitude2 - longitude1) * Math.PI) / 180;

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((latitude1 * Math.PI) / 180) *
      Math.cos((latitude2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return distance;
};

/**
 * Find outlets within a given radius
 * @param {Object} centerOutlet - The center outlet
 * @param {Array} outlets - Array of all outlets
 * @param {number} radius - Radius in kilometers (default: 5)
 * @returns {Array} Array of outlets within the radius
 */
export const findOutletsWithinRadius = (centerOutlet, outlets, radius = 5) => {
  if (
    !centerOutlet ||
    !centerOutlet.latitude ||
    !centerOutlet.longitude ||
    !Array.isArray(outlets)
  ) {
    return [];
  }

  return outlets.filter((outlet) => {
    // Skip the center outlet itself
    if (outlet.id === centerOutlet.id) return false;

    // Skip outlets without coordinates
    if (!outlet.latitude || !outlet.longitude) return false;

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
  if (!Array.isArray(outlets) || !latitude || !longitude) {
    return [];
  }

  return outlets
    .filter((outlet) => outlet.latitude && outlet.longitude)
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
