// src/contexts/GoogleMapsContext.js
import React, { createContext, useContext, useState } from "react";
import { useLoadScript } from "@react-google-maps/api";

// Libraries to load with Google Maps
const libraries = ["places"];

// Create the context
const GoogleMapsContext = createContext(null);

// Custom hook for accessing the context
export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (context === null) {
    throw new Error("useGoogleMaps must be used within a GoogleMapsProvider");
  }
  return context;
};

// Provider component
export const GoogleMapsProvider = ({ children }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [mapInstance, setMapInstance] = useState(null);

  // Value to be provided to consumers
  const value = {
    isLoaded,
    loadError,
    mapInstance,
    setMapInstance,
  };

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
