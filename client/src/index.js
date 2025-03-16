// src/index.js

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleMapsProvider } from "./contexts/GoogleMapsContext";

// Import styles
import "./styles/index.css";

/**
 * Main entry point for the application
 * Wraps the App with necessary providers
 */
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <GoogleMapsProvider>
      <App />
    </GoogleMapsProvider>
  </React.StrictMode>
);
