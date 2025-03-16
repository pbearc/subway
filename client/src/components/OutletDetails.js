import React, { useState, useEffect } from "react";
import OperatingHours from "./OperatingHours";
import api from "../services/api";

const OutletDetails = ({ outlet, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [operatingHours, setOperatingHours] = useState([]);
  const [error, setError] = useState(null);
  const [showingRadius, setShowingRadius] = useState(false);

  // Haversine formula to calculate distance between two coordinates in km
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

  // Get outlets that are actually within 5km
  const getActualIntersectingOutlets = () => {
    if (!outlet || !outlet.allOutlets) return [];

    return (
      outlet.allOutlets
        .filter((o) => o.id !== outlet.id)
        .filter((o) => {
          const distance = calculateDistance(
            parseFloat(outlet.latitude),
            parseFloat(outlet.longitude),
            parseFloat(o.latitude),
            parseFloat(o.longitude)
          );
          return distance <= 5; // 5km radius
        })
        // Sort by distance - closest first
        .sort((a, b) => {
          const distA = calculateDistance(
            parseFloat(outlet.latitude),
            parseFloat(outlet.longitude),
            parseFloat(a.latitude),
            parseFloat(a.longitude)
          );
          const distB = calculateDistance(
            parseFloat(outlet.latitude),
            parseFloat(outlet.longitude),
            parseFloat(b.latitude),
            parseFloat(b.longitude)
          );
          return distA - distB;
        })
    );
  };

  useEffect(() => {
    const fetchOperatingHours = async () => {
      if (!outlet) return;

      // First check if operating hours are already included in the outlet data
      if (outlet.operating_hours && outlet.operating_hours.length > 0) {
        setOperatingHours(outlet.operating_hours);
        setLoading(false);
        return;
      }

      // Otherwise fetch from API
      try {
        setLoading(true);
        const hours = await api.getOutletOperatingHours(outlet.id);
        setOperatingHours(hours);
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

  // Get actual intersecting outlets with accurate distance calculation
  const intersectingOutlets = getActualIntersectingOutlets();

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
    <div className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-xl font-bold text-green-800">{outlet.name}</h2>
          {/* Removed ID display */}
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>
      </div>

      <div className="mt-2">
        <p className="text-gray-700 text-sm">{outlet.address}</p>
        <div className="flex flex-col space-y-2 mt-3">
          {outlet.waze_link && (
            <a
              href={outlet.waze_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              Open in Waze
            </a>
          )}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${outlet.latitude},${outlet.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-sm flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
            View on Google Maps
          </a>
        </div>
      </div>

      {/* 5km Radius Button - Removed border */}
      <div className="mt-4">
        <button
          onClick={toggleRadiusDisplay}
          className={`py-2 px-3 rounded text-sm flex items-center shadow ${
            showingRadius
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
          style={{ outline: "none", border: "none" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4"
            />
          </svg>
          {showingRadius ? "Hide 5KM Radius" : "Show 5KM Radius"}
        </button>
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

      {intersectingOutlets.length > 0 && (
        <div className="mt-4 bg-gray-50 p-3 rounded border border-gray-200">
          <h3 className="font-semibold text-gray-700 flex items-center text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
              {intersectingOutlets.map((o) => (
                <li key={o.id} className="text-gray-700 text-xs">
                  {o.name}{" "}
                  <span className="text-gray-500">
                    (
                    {calculateDistance(
                      parseFloat(outlet.latitude),
                      parseFloat(outlet.longitude),
                      parseFloat(o.latitude),
                      parseFloat(o.longitude)
                    ).toFixed(2)}{" "}
                    km away)
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            These outlets have 5KM catchment areas that overlap with this
            location.
          </p>
        </div>
      )}
    </div>
  );
};

export default OutletDetails;
