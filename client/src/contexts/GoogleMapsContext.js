// src/contexts/GoogleMapsContext.js

import React, { createContext, useContext, useState } from "react";
import { useLoadScript } from "@react-google-maps/api";

const libraries = ["places"];
const GoogleMapsContext = createContext(null);

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (context === null) {
    throw new Error("useGoogleMaps must be used within a GoogleMapsProvider");
  }
  return context;
};

export const GoogleMapsProvider = ({ children }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [mapInstance, setMapInstance] = useState(null);

  return (
    <GoogleMapsContext.Provider
      value={{ isLoaded, loadError, mapInstance, setMapInstance }}
    >
      {children}
    </GoogleMapsContext.Provider>
  );
};
