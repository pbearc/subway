// src/components/map/OutletMap.jsx

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "../../contexts/GoogleMapsContext";
import api from "../../services/api";
import MarkerInfoWindow from "./MarkerInfoWindow";
import Loader from "../common/Loader";
import Button from "../common/Button";
import {
  calculateDistance,
  findOutletsWithinRadius,
} from "../../utils/distanceCalculator";
import { determineOutletStatus, getTodayHours } from "../../utils/formatters";

const MAP_CONSTANTS = {
  containerStyle: {
    width: "100%",
    height: "100%",
  },
  center: {
    lat: 3.139003,
    lng: 101.686855,
  },
  zoom: 12,
  radius: 5, // in km
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
    const [mapOptions, setMapOptions] = useState({
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      gestureHandling: "greedy",
      disableDefaultUI: false,
    });

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      // When selected from external source (like a list), center the map without zooming
      selectOutletFromExternal: (outlet) => {
        handleOutletSelect(outlet, true, true); // true for skipCallback, true for forceCenter
      },
      showRadius: (outlet) => showRadiusCircle(outlet),
      hideRadius: () => clearRadiusCircle(),
      isRadiusActive: () => Boolean(activeCircle),
    }));

    // Get today's operating hours
    const getOutletTodayHours = useCallback(
      (outletId) => {
        if (!outletId) return "Hours not available";
        const hours = operatingHours[outletId];
        if (!hours?.length) return "Hours not available";
        return getTodayHours(hours);
      },
      [operatingHours]
    );

    // Check if an outlet is open
    const getOutletStatus = useCallback(
      (outletId) => {
        if (!outletId) return "Unknown";
        const hours = operatingHours[outletId];
        if (!hours?.length) return "Unknown";
        return determineOutletStatus(hours);
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
            if (!outlet?.latitude || !outlet?.longitude) {
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

              return distance <= MAP_CONSTANTS.radius;
            });

            return { ...outlet, hasIntersection };
          });

          setOutlets(processedData);

          // Pre-fetch operating hours
          const hoursData = {};
          for (const outlet of processedData) {
            try {
              if (!outlet?.id) continue;

              if (outlet.operating_hours?.length > 0) {
                hoursData[outlet.id] = outlet.operating_hours;
              } else {
                const hours = await api.getOutletOperatingHours(outlet.id);
                hoursData[outlet.id] = hours;
              }
            } catch (err) {
              console.error(
                `Failed to fetch hours for outlet ${outlet?.id}:`,
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

    // Get outlets within radius
    const getOverlappingOutlets = useCallback(
      (outlet) => {
        if (!outlet?.latitude || !outlet?.longitude) return [];
        return findOutletsWithinRadius(outlet, outlets, MAP_CONSTANTS.radius);
      },
      [outlets]
    );

    // Handle map load
    const onMapLoad = useCallback(
      (googleMap) => {
        setMapInstance(googleMap);

        // Set the map bounds padding to create space for the InfoWindow
        if (googleMap) {
          googleMap.setOptions({
            paddingBottomRight: new window.google.maps.Point(0, 150), // Space for InfoWindow
          });
        }
      },
      [setMapInstance]
    );

    const handleMouseOver = useCallback((outlet) => {
      setHoveredOutlet(outlet);
    }, []);

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
        clearRadiusCircle();

        if (!mapInstance || !outlet?.latitude || !outlet?.longitude) return;

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
          radius: MAP_CONSTANTS.radius * 1000, // convert km to meters
          strokeColor: hasOverlaps ? "#ff6b6b" : "#4dabf7",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: hasOverlaps ? "#ff6b6b" : "#4dabf7",
          fillOpacity: 0.2,
        });

        setActiveCircle(circle);
        setHighlightedOutlets(overlappingOutlets.map((o) => o.id));
      },
      [clearRadiusCircle, getOverlappingOutlets, mapInstance]
    );

    // Handle marker click
    const handleOutletSelect = useCallback(
      (outlet, skipCallback = false, forceCenter = false) => {
        if (!outlet?.latitude || !outlet?.longitude) return;

        setSelectedOutlet(outlet);

        if (mapInstance) {
          const latLng = new window.google.maps.LatLng(
            parseFloat(outlet.latitude),
            parseFloat(outlet.longitude)
          );

          // Center map if:
          // 1. forceCenter is true (selected from list)
          // 2. Marker is outside the current map bounds
          const bounds = mapInstance.getBounds();
          if (forceCenter || !bounds || !bounds.contains(latLng)) {
            // Center the map on the marker without changing zoom level
            mapInstance.panTo({
              lat: parseFloat(outlet.latitude),
              lng: parseFloat(outlet.longitude),
            });

            // Don't change zoom level, keep current zoom
          }
        }

        if (skipCallback) return;

        // Add utility functions to the outlet object for the parent component
        const enhancedOutlet = {
          ...outlet,
          allOutlets: outlets,
          showRadius: (outletToShow) => showRadiusCircle(outletToShow),
          hideRadius: () => clearRadiusCircle(),
          isRadiusActive: () => Boolean(activeCircle),
          setRadiusCallback: (state) => setSelectedOutlet(state),
        };

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

    if (!isLoaded || loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <Loader type="spinner" size="medium" text="Loading..." />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center h-full text-red-500 p-4">
          <div className="bg-red-50 p-4 rounded-lg max-w-md">
            <h3 className="font-bold mb-2">Error</h3>
            <p>{error}</p>
            <Button
              variant="danger"
              size="small"
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative h-full w-full">
        <GoogleMap
          mapContainerStyle={MAP_CONSTANTS.containerStyle}
          center={MAP_CONSTANTS.center}
          zoom={MAP_CONSTANTS.zoom}
          onLoad={onMapLoad}
          onClick={() => {
            clearRadiusCircle();
            setHoveredOutlet(null);
          }}
          options={mapOptions}
        >
          {outlets.map((outlet) => {
            if (!outlet?.latitude || !outlet?.longitude) return null;

            const lat = parseFloat(outlet.latitude);
            const lng = parseFloat(outlet.longitude);

            if (isNaN(lat) || isNaN(lng)) return null;

            // Determine marker appearance
            const isHighlighted = highlightedOutlets.includes(outlet.id);
            const isSelected = selectedOutlet?.id === outlet.id;

            let markerOptions = {};
            if (isSelected) {
              markerOptions = {
                icon: {
                  url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                  scaledSize: new window.google.maps.Size(38, 38),
                },
                zIndex: 1000,
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

                {hoveredOutlet?.id === outlet.id && (
                  <MarkerInfoWindow
                    outlet={outlet}
                    position={{ lat, lng }}
                    onClose={() => setHoveredOutlet(null)}
                    outletStatus={getOutletStatus(outlet.id)}
                    todayHours={getOutletTodayHours(outlet.id)}
                  />
                )}
              </React.Fragment>
            );
          })}
        </GoogleMap>
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
