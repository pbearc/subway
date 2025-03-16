import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import api from "../services/api";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useGoogleMaps } from "../contexts/GoogleMapsContext";
import MapSearchFilter from "./MapSearchFilter";

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Center of Kuala Lumpur
const center = {
  lat: 3.139003,
  lng: 101.686855,
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
        // Just update UI without calling back to parent
        if (!outlet || !outlet.latitude || !outlet.longitude) return;
        setSelectedOutlet(outlet);

        if (mapInstance) {
          mapInstance.panTo({
            lat: parseFloat(outlet.latitude),
            lng: parseFloat(outlet.longitude),
          });
        }
      },

      showRadius: (outlet) => {
        showRadiusCircle(outlet);
      },
    }));

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

    // Check if an outlet is currently open
    const isOutletOpen = (outletId) => {
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
    };

    // Format time safely
    const formatTime = (timeString) => {
      if (!timeString) return "N/A";
      if (typeof timeString === "string" && timeString.includes(":")) {
        return timeString.slice(0, 5);
      }
      return timeString;
    };

    // Get today's operating hours as a formatted string
    const getTodayHours = (outletId) => {
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
    };

    // Calculate distance between two points
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

    // Get outlets within 5km radius
    const getOverlappingOutlets = (outlet) => {
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
    };

    // Handle map load
    const onMapLoad = (googleMap) => {
      setMapInstance(googleMap);
    };

    // Handle mouse over marker
    const handleMouseOver = (outlet) => {
      setHoveredOutlet(outlet);
    };

    // Handle mouse out marker
    const handleMouseOut = () => {
      setHoveredOutlet(null);
    };

    // Clear any existing radius circle
    const clearRadiusCircle = () => {
      if (activeCircle) {
        activeCircle.setMap(null);
        setActiveCircle(null);
      }
      setHighlightedOutlets([]);
    };

    // Draw radius circle around an outlet
    const showRadiusCircle = (outlet) => {
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
    };

    // Handle marker click
    const handleOutletSelect = (outlet) => {
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

      // Add utility functions to the outlet object for the parent component
      const enhancedOutlet = {
        ...outlet,
        allOutlets: outlets,
        showRadius: (outletToShow) => showRadiusCircle(outletToShow),
      };

      // Notify parent component
      onOutletSelect(enhancedOutlet);
    };

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
        <div className="flex justify-center items-center h-96 text-red-500">
          Error loading Google Maps: {loadError.message}
        </div>
      );
    }

    if (!isLoaded) {
      return (
        <div className="flex justify-center items-center h-96">
          Loading Google Maps...
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex justify-center items-center h-96">
          Loading outlets data...
        </div>
      );
    }

    if (error) {
      return <div className="text-red-500">Error: {error}</div>;
    }

    return (
      <div style={{ position: "relative", height: "100%", width: "100%" }}>
        {!hideSearchFilter && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 10,
              width: "100%",
            }}
          >
            <MapSearchFilter
              outlets={outlets}
              onOutletSelect={handleOutletSelect}
            />
          </div>
        )}

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
          onLoad={onMapLoad}
          onClick={() => {
            // Clear radius when clicking elsewhere on the map
            clearRadiusCircle();
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
              };
            } else if (isHighlighted) {
              markerOptions = {
                icon: {
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                },
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
                  <InfoWindow
                    position={{
                      lat: lat,
                      lng: lng,
                    }}
                    onCloseClick={() => setHoveredOutlet(null)}
                    options={{
                      pixelOffset: new window.google.maps.Size(0, -30),
                    }}
                  >
                    <div style={{ padding: "5px", maxWidth: "250px" }}>
                      <h3
                        style={{
                          fontWeight: "bold",
                          fontSize: "16px",
                          marginBottom: "5px",
                        }}
                      >
                        {outlet.name || "Unnamed Outlet"}
                      </h3>
                      <p style={{ fontSize: "14px", marginBottom: "5px" }}>
                        {outlet.address || "No address available"}
                      </p>

                      {/* Status indicator */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginTop: "8px",
                          fontSize: "14px",
                        }}
                      >
                        <div
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            backgroundColor:
                              isOutletOpen(outlet.id) === "Open Now"
                                ? "#10b981"
                                : "#ef4444",
                            marginRight: "6px",
                          }}
                        ></div>
                        <span
                          style={{
                            color:
                              isOutletOpen(outlet.id) === "Open Now"
                                ? "#10b981"
                                : "#ef4444",
                            fontWeight: "500",
                          }}
                        >
                          {isOutletOpen(outlet.id)}
                        </span>
                      </div>

                      {/* Today's operating hours */}
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginTop: "4px",
                        }}
                      >
                        {getTodayHours(outlet.id)}
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </React.Fragment>
            );
          })}
        </GoogleMap>
      </div>
    );
  }
);

export default OutletMap;
