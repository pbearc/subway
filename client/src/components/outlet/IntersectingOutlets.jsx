// src/components/outlet/IntersectingOutlets.jsx

import React from "react";
import PropTypes from "prop-types";

/**
 * Calculates distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

const IntersectingOutlets = ({ currentOutlet, intersectingOutlets }) => {
  if (!intersectingOutlets || intersectingOutlets.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 bg-gray-50 p-3 rounded border border-gray-200">
      <h3 className="font-semibold text-gray-700 flex items-center text-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        Overlapping 5KM Catchment Areas ({intersectingOutlets.length})
      </h3>
      <div className="mt-2">
        <ul className="space-y-1">
          {intersectingOutlets.map((outlet) => (
            <li key={outlet.id} className="text-gray-700 text-xs">
              {outlet.name}{" "}
              <span className="text-gray-500">
                (
                {calculateDistance(
                  parseFloat(currentOutlet.latitude),
                  parseFloat(currentOutlet.longitude),
                  parseFloat(outlet.latitude),
                  parseFloat(outlet.longitude)
                ).toFixed(2)}{" "}
                km away)
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        These outlets have 5KM catchment areas that overlap with this location.
      </p>
    </div>
  );
};

IntersectingOutlets.propTypes = {
  currentOutlet: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    latitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    longitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
  }).isRequired,
  intersectingOutlets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      latitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      longitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    })
  ).isRequired,
};

export default IntersectingOutlets;
