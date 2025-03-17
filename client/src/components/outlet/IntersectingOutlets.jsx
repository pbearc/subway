// src/components/outlet/IntersectingOutlets.jsx

import React from "react";
import PropTypes from "prop-types";
import { calculateDistance } from "../../utils/distanceCalculator";
import { formatDistance } from "../../utils/formatters";
import Icon from "../common/Icon";

const IntersectingOutlets = ({ currentOutlet, intersectingOutlets }) => {
  if (!intersectingOutlets || intersectingOutlets.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 bg-gray-50 p-3 rounded border border-gray-200">
      <h3 className="font-semibold text-gray-700 flex items-center text-sm">
        <Icon name="location" size={4} className="mr-1" />
        Overlapping 5KM Catchment Areas ({intersectingOutlets.length})
      </h3>
      <div className="mt-2">
        <ul className="space-y-1">
          {intersectingOutlets.map((outlet) => {
            // Calculate the distance between the current outlet and this one
            const distance = calculateDistance(
              parseFloat(currentOutlet.latitude),
              parseFloat(currentOutlet.longitude),
              parseFloat(outlet.latitude),
              parseFloat(outlet.longitude)
            );

            return (
              <li key={outlet.id} className="text-gray-700 text-xs">
                {outlet.name}{" "}
                <span className="text-gray-500">
                  ({formatDistance(distance)} away)
                </span>
              </li>
            );
          })}
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
