import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Center of Kuala Lumpur
const center = {
  lat: 3.139003,
  lng: 101.686855,
};

const OutletMap = ({ onOutletSelect }) => {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredOutlet, setHoveredOutlet] = useState(null);
  const [selectedOutlets, setSelectedOutlets] = useState([]);
  const [map, setMap] = useState(null);

  // Store circle references
  const circleRefs = useRef({});

  // Fetch outlets data from API
  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        setLoading(true);
        const data = await api.getAllOutlets();
        setOutlets(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOutlets();
  }, []);

  // Helper to calculate distance between two points
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
    return outlets.filter((o) => {
      if (o.id === outlet.id) return false;

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
    setMap(googleMap);
  };

  // Handle mouse over marker
  const handleMouseOver = (outlet) => {
    setHoveredOutlet(outlet);
  };

  // Handle mouse out marker
  const handleMouseOut = () => {
    setHoveredOutlet(null);
  };

  // Handle marker click
  const handleMarkerClick = (outlet) => {
    // Check if already selected
    const isSelected = selectedOutlets.some((o) => o.id === outlet.id);

    if (isSelected) {
      // If already selected, remove it and clear the circle
      setSelectedOutlets(selectedOutlets.filter((o) => o.id !== outlet.id));
      if (circleRefs.current[outlet.id]) {
        circleRefs.current[outlet.id].setMap(null);
        delete circleRefs.current[outlet.id];
      }
    } else {
      // Otherwise, add it and draw a circle
      setSelectedOutlets([...selectedOutlets, outlet]);

      if (map) {
        // Create circle manually instead of using the Circle component
        const overlappingOutlets = getOverlappingOutlets(outlet);
        const hasOverlaps = overlappingOutlets.length > 0;

        const circle = new window.google.maps.Circle({
          map: map,
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

        // Store reference to the circle
        circleRefs.current[outlet.id] = circle;
      }
    }

    // Update parent component
    onOutletSelect(outlet);
  };

  // Handle clear all circles
  const handleClearAllCircles = () => {
    // Remove all circles from the map
    Object.values(circleRefs.current).forEach((circle) => {
      circle.setMap(null);
    });

    // Clear the references and selected outlets
    circleRefs.current = {};
    setSelectedOutlets([]);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        Loading outlets data...
      </div>
    );
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {Object.keys(circleRefs.current).length > 0 && (
        <button
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 1000,
            padding: "8px 12px",
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            cursor: "pointer",
          }}
          onClick={handleClearAllCircles}
        >
          Clear All Circles
        </button>
      )}

      <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
          onLoad={onMapLoad}
        >
          {outlets.map((outlet) => {
            const lat = parseFloat(outlet.latitude);
            const lng = parseFloat(outlet.longitude);

            if (isNaN(lat) || isNaN(lng)) return null;

            return (
              <React.Fragment key={outlet.id}>
                <Marker
                  position={{ lat, lng }}
                  onClick={() => handleMarkerClick(outlet)}
                  onMouseOver={() => handleMouseOver(outlet)}
                  onMouseOut={handleMouseOut}
                />

                {hoveredOutlet && hoveredOutlet.id === outlet.id && (
                  <InfoWindow
                    position={{
                      lat: lat,
                      lng: lng + 0.006, // Offset to the right so it doesn't cover the marker
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
                        {outlet.name}
                      </h3>
                      <p style={{ fontSize: "14px", marginBottom: "5px" }}>
                        {outlet.address}
                      </p>

                      {getOverlappingOutlets(outlet).length > 0 && (
                        <p
                          style={{
                            color: "#ff6b6b",
                            fontSize: "14px",
                            marginTop: "5px",
                          }}
                        >
                          Overlaps with {getOverlappingOutlets(outlet).length}{" "}
                          other outlet(s)
                        </p>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </React.Fragment>
            );
          })}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default OutletMap;
