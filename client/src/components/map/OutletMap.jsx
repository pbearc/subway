// src/components/map/OutletMap.jsx

import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "../../contexts/GoogleMapsContext";
import api from "../../services/api";
import MarkerInfoWindow from "./MarkerInfoWindow";

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Center of Kuala Lumpur
const center = {
  lat: 3.139003,
  lng: 101.686855,
};

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
  return R * c; // Distance in km
};

const OutletMap = forwardRef(
  ({ onOutletSelect, hideSearchFilter = true }, ref) => {
    const { isLoaded, loadError, mapInstance, setMapInstance } =
      useGoogleMaps();

    const [outlets, setOutlets] = useState([]);
    const [operatingHours, setOperatingHours] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredOutlet, setHoveredOutlet] = useState(null);
    const [selectedOutlet, setSelectedOutlet] = useState(null);
    const [activeCircle, setActiveCircle] = useState(null);
    const [highlightedOutlets, setHighlightedOutlets] = useState([]);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      selectOutletFromExternal: (outlet) => {
        handleOutletSelect(outlet, true);
      },
      showRadius: (outlet) => {
        showRadiusCircle(outlet);
      },
      hideRadius: () => {
        clearRadiusCircle();
      },
      isRadiusActive: () => Boolean(activeCircle),
    }));

    // Format time safely
    const formatTime = useCallback((timeString) => {
      if (!timeString) return "N/A";
      if (typeof timeString === "string" && timeString.includes(":")) {
        return timeString.slice(0, 5);
      }
      return timeString;
    }, []);

    // Get today's operating hours as a formatted string
    const getTodayHours = useCallback(
      (outletId) => {
        if (!outletId) return "Hours not available";

        const hours = operatingHours[outletId];
        if (!hours || hours.length === 0) return "Hours not available";

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
      },
      [operatingHours, formatTime]
    );

    // Check if an outlet is currently open
    const isOutletOpen = useCallback(
      (outletId) => {
        if (!outletId) return "Unknown";

        const hours = operatingHours[outletId];
        if (!hours || hours.length === 0) return "Unknown";

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
      },
      [operatingHours]
    );

    // Fetch outlets data
    useEffect(() => {
      const fetchOutlets = async () => {
        try {
          setLoading(true);
          const data = await api.getAllOutlets();

          // Process data with additional fields
          const processedData = data.map((outlet) => {
            if (!outlet || !outlet.latitude || !outlet.longitude) {
              return { ...outlet, hasIntersection: false };
            }

            const hasIntersection = data.some((otherOutlet) => {
              if (!otherOutlet || otherOutlet.id === outlet.id) return false;
              if (!otherOutlet.latitude || !otherOutlet.longitude) return false;

              const distance = calculateDistance(
                parseFloat(outlet.latitude),
                parseFloat(outlet.longitude),
                parseFloat(otherOutlet.latitude),
                parseFloat(otherOutlet.longitude)
              );

              return distance <= 5; // 5km radius
            });

            return {
              ...outlet,
              hasIntersection,
            };
          });

          setOutlets(processedData);

          // Pre-fetch operating hours
          const hoursData = {};
          for (const outlet of processedData) {
            try {
              if (!outlet || !outlet.id) continue;

              if (outlet.operating_hours && outlet.operating_hours.length > 0) {
                hoursData[outlet.id] = outlet.operating_hours;
              } else {
                const hours = await api.getOutletOperatingHours(outlet.id);
                hoursData[outlet.id] = hours;
              }
            } catch (err) {
              console.error(
                `Failed to fetch operating hours for outlet ${outlet?.id}:`,
                err
              );
            }
          }

          setOperatingHours(hoursData);
          setLoading(false);
        } catch (err) {
          setError(err.message);
          setLoading(false);
        }
      };

      fetchOutlets();
    }, []);

    // Get outlets within 5km radius
    const getOverlappingOutlets = useCallback(
      (outlet) => {
        if (!outlet || !outlet.latitude || !outlet.longitude) return [];

        return outlets.filter((o) => {
          if (!o || o.id === outlet.id) return false;
          if (!o.latitude || !o.longitude) return false;

          const distance = calculateDistance(
            parseFloat(outlet.latitude),
            parseFloat(outlet.longitude),
            parseFloat(o.latitude),
            parseFloat(o.longitude)
          );

          return distance <= 5; // 5km radius
        });
      },
      [outlets]
    );

    // Handle map load
    const onMapLoad = useCallback(
      (googleMap) => {
        setMapInstance(googleMap);
      },
      [setMapInstance]
    );

    // Handle mouse over marker
    const handleMouseOver = useCallback((outlet) => {
      setHoveredOutlet(outlet);
    }, []);

    // Handle mouse out marker
    const handleMouseOut = useCallback(() => {
      setHoveredOutlet(null);
    }, []);

    // Clear any existing radius circle
    const clearRadiusCircle = useCallback(() => {
      if (activeCircle) {
        activeCircle.setMap(null);
        setActiveCircle(null);
      }
      setHighlightedOutlets([]);
    }, [activeCircle]);

    // Draw radius circle around an outlet
    const showRadiusCircle = useCallback(
      (outlet) => {
        // Clear any existing circle first
        clearRadiusCircle();

        if (!mapInstance || !outlet || !outlet.latitude || !outlet.longitude)
          return;

        // Find overlapping outlets
        const overlappingOutlets = getOverlappingOutlets(outlet);
        const hasOverlaps = overlappingOutlets.length > 0;

        // Create the circle
        const circle = new window.google.maps.Circle({
          map: mapInstance,
          center: {
            lat: parseFloat(outlet.latitude),
            lng: parseFloat(outlet.longitude),
          },
          radius: 5000, // 5km in meters
          strokeColor: hasOverlaps ? "#ff6b6b" : "#4dabf7",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: hasOverlaps ? "#ff6b6b" : "#4dabf7",
          fillOpacity: 0.2,
        });

        setActiveCircle(circle);

        // Highlight overlapping outlets on map
        setHighlightedOutlets(overlappingOutlets.map((o) => o.id));
      },
      [clearRadiusCircle, getOverlappingOutlets, mapInstance]
    );

    // Handle marker click
    const handleOutletSelect = useCallback(
      (outlet, skipCallback = false) => {
        if (!outlet || !outlet.latitude || !outlet.longitude) return;

        // Update local state
        setSelectedOutlet(outlet);

        // Pan to the outlet location without zooming in
        if (mapInstance) {
          mapInstance.panTo({
            lat: parseFloat(outlet.latitude),
            lng: parseFloat(outlet.longitude),
          });
        }

        // If skipCallback is true, don't notify parent component (for internal use)
        if (skipCallback) {
          return;
        }

        // Add utility functions to the outlet object for the parent component
        const enhancedOutlet = {
          ...outlet,
          allOutlets: outlets,
          showRadius: (outletToShow) => showRadiusCircle(outletToShow),
          hideRadius: () => clearRadiusCircle(),
          isRadiusActive: () => Boolean(activeCircle),
          setRadiusCallback: (state) => setSelectedOutlet(state),
        };

        // Notify parent component
        onOutletSelect(enhancedOutlet);
      },
      [
        mapInstance,
        outlets,
        onOutletSelect,
        showRadiusCircle,
        clearRadiusCircle,
        activeCircle,
      ]
    );

    // Clean up on unmount
    useEffect(() => {
      return () => {
        if (activeCircle) {
          activeCircle.setMap(null);
        }
      };
    }, [activeCircle]);

    // Render loading and error states
    if (loadError) {
      return (
        <div className="flex justify-center items-center h-full text-red-500 p-4">
          <div className="bg-red-50 p-4 rounded-lg max-w-md">
            <h3 className="font-bold mb-2">Error Loading Map</h3>
            <p>Error loading Google Maps: {loadError.message}</p>
          </div>
        </div>
      );
    }

    if (!isLoaded) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading outlets data...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center h-full text-red-500 p-4">
          <div className="bg-red-50 p-4 rounded-lg max-w-md">
            <h3 className="font-bold mb-2">Error</h3>
            <p>{error}</p>
            <button
              className="mt-3 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative h-full w-full">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
          onLoad={onMapLoad}
          onClick={() => {
            // Clear radius when clicking elsewhere on the map
            clearRadiusCircle();
            setHoveredOutlet(null);
          }}
          options={{
            fullscreenControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            gestureHandling: "greedy", // Better for mobile
          }}
        >
          {outlets.map((outlet) => {
            if (!outlet || !outlet.latitude || !outlet.longitude) return null;

            const lat = parseFloat(outlet.latitude);
            const lng = parseFloat(outlet.longitude);

            if (isNaN(lat) || isNaN(lng)) return null;

            // Determine marker appearance
            const isHighlighted = highlightedOutlets.includes(outlet.id);
            const isSelected =
              selectedOutlet && selectedOutlet.id === outlet.id;
            let markerOptions = {};

            if (isSelected) {
              markerOptions = {
                icon: {
                  url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                  scaledSize: new window.google.maps.Size(38, 38),
                },
                zIndex: 1000, // Ensure it's on top
                animation: window.google.maps.Animation.BOUNCE,
              };
            } else if (isHighlighted) {
              markerOptions = {
                icon: {
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                },
                zIndex: 900,
              };
            }

            return (
              <React.Fragment key={outlet.id}>
                <Marker
                  position={{ lat, lng }}
                  onClick={() => handleOutletSelect(outlet)}
                  onMouseOver={() => handleMouseOver(outlet)}
                  onMouseOut={handleMouseOut}
                  {...markerOptions}
                />

                {hoveredOutlet && hoveredOutlet.id === outlet.id && (
                  <MarkerInfoWindow
                    outlet={outlet}
                    position={{ lat, lng }}
                    onClose={() => setHoveredOutlet(null)}
                    outletStatus={isOutletOpen(outlet.id)}
                    todayHours={getTodayHours(outlet.id)}
                  />
                )}
              </React.Fragment>
            );
          })}
        </GoogleMap>

        {/* Mobile-friendly zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2 md:hidden">
          <button
            onClick={() =>
              mapInstance?.setZoom((mapInstance?.getZoom() || 12) + 1)
            }
            className="bg-white rounded-full w-10 h-10 shadow-md flex items-center justify-center text-gray-700"
            aria-label="Zoom in"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
          <button
            onClick={() =>
              mapInstance?.setZoom((mapInstance?.getZoom() || 12) - 1)
            }
            className="bg-white rounded-full w-10 h-10 shadow-md flex items-center justify-center text-gray-700"
            aria-label="Zoom out"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }
);

OutletMap.propTypes = {
  onOutletSelect: PropTypes.func.isRequired,
  hideSearchFilter: PropTypes.bool,
};

OutletMap.displayName = "OutletMap";

export default OutletMap;
