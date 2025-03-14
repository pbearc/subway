import React, { useState, useEffect, useCallback } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Circle,
  InfoWindow,
} from "@react-google-maps/api";
import api from "../services/api";

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
  const [intersections, setIntersections] = useState({});
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Get the Google Maps API key from environment variables
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // 5km in meters
  const radiusSize = 5000;

  // Ensure latitude and longitude are valid numbers
  const validateCoordinates = (data) => {
    return data
      .map((outlet) => {
        // Ensure latitude and longitude are converted to numbers and validated
        const lat = parseFloat(outlet.latitude);
        const lng = parseFloat(outlet.longitude);

        // Check if coordinates are valid numbers
        const validLat = !isNaN(lat) && lat !== null;
        const validLng = !isNaN(lng) && lng !== null;

        return {
          ...outlet,
          latitude: validLat ? lat : null,
          longitude: validLng ? lng : null,
          hasValidCoordinates: validLat && validLng,
        };
      })
      .filter((outlet) => outlet.hasValidCoordinates);
  };

  // Calculate intersections between outlets
  const calculateIntersections = (outletData) => {
    const intersectionMap = {};

    outletData.forEach((outlet, i) => {
      intersectionMap[outlet.id] = [];

      outletData.forEach((otherOutlet, j) => {
        if (i === j) return; // Skip same outlet

        // Calculate distance between two points using Haversine formula
        const distance = calculateDistance(
          outlet.latitude,
          outlet.longitude,
          otherOutlet.latitude,
          otherOutlet.longitude
        );

        // If distance is less than 2 * radius (10km), they intersect
        if (distance < (2 * radiusSize) / 1000) {
          intersectionMap[outlet.id].push(otherOutlet.id);
        }
      });
    });

    return intersectionMap;
  };

  // Haversine formula to calculate distance between two coordinates in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  // Handle marker click
  const handleMarkerClick = (outlet) => {
    // If clicking the same outlet, deselect it
    if (selectedMarker && selectedMarker.id === outlet.id) {
      setSelectedMarker(null);
      onOutletSelect(null); // Clear selection in parent component
      return;
    }

    // Select the new outlet
    setSelectedMarker(outlet);

    const hasIntersection = intersections[outlet.id]?.length > 0;

    onOutletSelect({
      ...outlet,
      hasIntersection,
      intersectingWithIds: intersections[outlet.id] || [],
      allOutlets: outlets,
    });
  };

  // Close info window and clear selected marker
  const handleCloseInfoWindow = () => {
    setSelectedMarker(null);
    onOutletSelect(null); // Clear selection in parent component
  };

  // Handle map click (to deselect markers when clicking elsewhere)
  const handleMapClick = useCallback(() => {
    if (selectedMarker) {
      setSelectedMarker(null);
      onOutletSelect(null); // Clear selection in parent component
    }
  }, [selectedMarker, onOutletSelect]);

  // Handle map load event
  const handleMapLoad = useCallback((map) => {
    setMapsLoaded(true);
  }, []);

  // Fetch outlets data from API
  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        setLoading(true);
        const data = await api.getAllOutlets();

        // Process and validate the data
        const validOutlets = validateCoordinates(data);

        if (validOutlets.length === 0) {
          setError("No outlets with valid coordinates found");
        } else {
          setOutlets(validOutlets);
          setIntersections(calculateIntersections(validOutlets));
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOutlets();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        Loading outlets data...
      </div>
    );
  if (error) return <div className="text-red-500">Error: {error}</div>;

  if (!googleMapsApiKey) {
    return (
      <div className="text-red-500 p-4 bg-red-50 rounded">
        <h3 className="font-bold">Google Maps API Key Missing</h3>
        <p>
          Please set the REACT_APP_GOOGLE_MAPS_API_KEY environment variable.
        </p>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={googleMapsApiKey}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        options={{
          styles: [
            {
              featureType: "poi.business",
              stylers: [{ visibility: "off" }], // Hide business POIs to make the map cleaner
            },
          ],
        }}
        onLoad={handleMapLoad}
        onClick={handleMapClick} // Important: This handles clicks on the map itself
      >
        {mapsLoaded &&
          outlets.map((outlet) => {
            if (!outlet.hasValidCoordinates) return null;

            const hasIntersection = intersections[outlet.id]?.length > 0;
            const isSelected =
              selectedMarker && selectedMarker.id === outlet.id;

            return (
              <React.Fragment key={outlet.id}>
                <Marker
                  position={{
                    lat: outlet.latitude,
                    lng: outlet.longitude,
                  }}
                  onClick={() => handleMarkerClick(outlet)}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    scaledSize:
                      mapsLoaded && window.google && window.google.maps
                        ? new window.google.maps.Size(32, 32)
                        : undefined,
                  }}
                />

                {/* Only show circle if this outlet is selected */}
                {isSelected && (
                  <Circle
                    center={{
                      lat: outlet.latitude,
                      lng: outlet.longitude,
                    }}
                    radius={radiusSize}
                    options={{
                      strokeColor: hasIntersection ? "#ff6b6b" : "#4dabf7",
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                      fillColor: hasIntersection ? "#ff6b6b" : "#4dabf7",
                      fillOpacity: 0.2,
                    }}
                  />
                )}

                {isSelected && (
                  <InfoWindow
                    position={{
                      lat: outlet.latitude,
                      lng: outlet.longitude,
                    }}
                    onCloseClick={handleCloseInfoWindow}
                  >
                    <div className="info-window">
                      <h3 className="font-medium text-lg">{outlet.name}</h3>
                      <p className="text-sm">{outlet.address}</p>
                      {hasIntersection && (
                        <p className="text-sm text-red-500 mt-1">
                          Overlaps with {intersections[outlet.id].length} other
                          outlet(s)
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
  );
};

export default OutletMap;
