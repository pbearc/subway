// src/components/outlet/OutletDetails.jsx
import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import OperatingHours from "./OperatingHours";
import IntersectingOutlets from "./IntersectingOutlets";
import StatusIndicator from "../common/StatusIndicator";
import Button from "../common/Button";
import api from "../../services/api";
import { determineOutletStatus } from "../../utils/formatters";
import {
  findOutletsWithinRadius,
  sortOutletsByDistance,
} from "../../utils/distanceCalculator";
import Icon from "../common/Icon";

const OutletDetails = ({ outlet, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [operatingHours, setOperatingHours] = useState([]);
  const [error, setError] = useState(null);
  const [showingRadius, setShowingRadius] = useState(false);
  const [status, setStatus] = useState("Unknown");

  // Get outlets that are actually within 5km - using the utility function
  const intersectingOutlets = useMemo(() => {
    if (!outlet || !outlet.allOutlets) return [];

    // Get outlets within 5km radius
    const outletsInRadius = findOutletsWithinRadius(
      outlet,
      outlet.allOutlets,
      5
    );

    // Sort by distance from the current outlet
    return sortOutletsByDistance(
      outletsInRadius,
      parseFloat(outlet.latitude),
      parseFloat(outlet.longitude)
    );
  }, [outlet]);

  useEffect(() => {
    const fetchOperatingHours = async () => {
      if (!outlet) return;

      // First check if operating hours are already included in the outlet data
      if (outlet.operating_hours && outlet.operating_hours.length > 0) {
        setOperatingHours(outlet.operating_hours);
        setStatus(determineOutletStatus(outlet.operating_hours));
        setLoading(false);
        return;
      }

      // Otherwise fetch from API
      try {
        setLoading(true);
        const hours = await api.getOutletOperatingHours(outlet.id);
        setOperatingHours(hours);
        setStatus(determineOutletStatus(hours));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching operating hours:", error);
        setError("Could not load operating hours");
        setLoading(false);
      }
    };

    fetchOperatingHours();

    // Reset radius state when outlet changes
    setShowingRadius(false);

    // Set up a callback to update our state when the radius state changes in the map
    if (outlet && outlet.setRadiusCallback) {
      outlet.setRadiusCallback(false);
    }

    // Make sure to hide radius when component unmounts or outlet changes
    return () => {
      if (outlet && outlet.hideRadius) {
        outlet.hideRadius();
      }
    };
  }, [outlet?.id, outlet?.operating_hours]);

  // Update local state if map state changes (e.g., when clicking elsewhere)
  useEffect(() => {
    if (outlet && outlet.isRadiusActive) {
      // Check if radius state from map is different from local state
      const mapRadiusState = outlet.isRadiusActive();
      if (showingRadius !== mapRadiusState) {
        setShowingRadius(mapRadiusState);
      }
    }
  }, [outlet, showingRadius]);

  if (!outlet) return null;

  // Toggle 5km radius display
  const toggleRadiusDisplay = () => {
    if (showingRadius) {
      // Hide the radius
      if (outlet.hideRadius) {
        outlet.hideRadius();
      }
      setShowingRadius(false);
    } else {
      // Show the radius
      if (outlet.showRadius) {
        outlet.showRadius(outlet);
      }
      setShowingRadius(true);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Mobile close button in top right */}
      <div className="flex justify-end md:hidden pt-2 pr-2">
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 bg-white rounded-full p-2 hover:bg-gray-100 shadow-sm"
          aria-label="Close"
        >
          <Icon name="close" size={5} />
        </button>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-xl font-bold text-green-800">{outlet.name}</h2>
            <div className="mt-1">
              <StatusIndicator status={status} />
            </div>
          </div>

          {/* Only show this close button on desktop */}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl leading-none p-1 rounded-full hover:bg-gray-100 hidden md:block"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="mt-2">
          <p className="text-gray-700 text-sm">{outlet.address}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {outlet.waze_link && (
              <a
                href={outlet.waze_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm flex items-center bg-blue-50 px-2 py-1 rounded"
              >
                <Icon name="map" size={4} className="mr-1" />
                Open in Waze
              </a>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${outlet.latitude},${outlet.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm flex items-center bg-blue-50 px-2 py-1 rounded"
            >
              <Icon name="location" size={4} className="mr-1" />
              View on Google Maps
            </a>
          </div>
        </div>

        {/* 5km Radius Button - using blue color */}
        <div className="mt-4">
          <Button
            onClick={toggleRadiusDisplay}
            variant={showingRadius ? "danger" : "blue"}
            className={`py-2 px-3 text-sm shadow-sm ${
              !showingRadius
                ? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                : ""
            }`}
            icon={<Icon name="map" size={4} />}
            iconPosition="left"
          >
            {showingRadius ? "Hide 5KM Radius" : "Show 5KM Radius"}
          </Button>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-green-700">Operating Hours</h3>
          {loading ? (
            <p className="text-sm text-gray-500">Loading operating hours...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : (
            <OperatingHours hours={operatingHours} />
          )}
        </div>

        {/* Intersecting outlets - extracted to dedicated component */}
        {intersectingOutlets.length > 0 && (
          <IntersectingOutlets
            currentOutlet={outlet}
            intersectingOutlets={intersectingOutlets}
          />
        )}

        {/* Extra padding at the bottom for mobile devices with home indicators */}
        <div className="md:hidden h-8"></div>
      </div>
    </div>
  );
};

OutletDetails.propTypes = {
  outlet: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    address: PropTypes.string,
    latitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    longitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    waze_link: PropTypes.string,
    operating_hours: PropTypes.array,
    allOutlets: PropTypes.array,
    showRadius: PropTypes.func,
    hideRadius: PropTypes.func,
    isRadiusActive: PropTypes.func,
    setRadiusCallback: PropTypes.func,
  }),
  onClose: PropTypes.func.isRequired,
};

export default OutletDetails;
