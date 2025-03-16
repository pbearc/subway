// src/App.js

import React, { useState, useEffect, useRef } from "react";
import OutletMap from "./components/map/OutletMap";
import OutletDetails from "./components/outlet/OutletDetails";
import ChatBot from "./components/chatbot/ChatBot";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Loader from "./components/common/Loader";
import useOutlets from "./hooks/useOutlets";
import useSearch from "./hooks/useSearch";

// Import styles
import "./styles/App.css";

/**
 * Main Application Component
 */
const App = () => {
  // Outlet related hooks and state
  const {
    outlets,
    loading,
    error,
    selectedOutlet,
    selectOutlet,
    clearSelectedOutlet,
  } = useOutlets();

  // UI state
  const [stylesLoaded, setStylesLoaded] = useState(false);
  const mapRef = useRef(null);

  // Search functionality
  const {
    searchTerm,
    isSearchOpen,
    filteredData,
    sortOption,
    searchRef,
    handleSearchChange,
    handleSelect,
    toggleSortOption,
    groupedData,
  } = useSearch(outlets, (outlet) => handleOutletSelect(outlet));

  // Give CSS time to load properly
  useEffect(() => {
    const timer = setTimeout(() => {
      setStylesLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Handle outlet selection from any component
   * @param {Object} outlet - Selected outlet
   */
  const handleOutletSelect = (outlet) => {
    // Define the radius callback function
    const showRadiusCallback = (outletToShow) => {
      if (mapRef.current && mapRef.current.showRadius) {
        mapRef.current.showRadius(outletToShow);
      }
    };

    // Select the outlet with radius callback
    selectOutlet(outlet, showRadiusCallback);

    // Update search term for consistency
    if (outlet?.name) {
      handleSearchChange({ target: { value: outlet.name } });
    }

    // Trigger map's selection
    if (mapRef.current && mapRef.current.selectOutletFromExternal) {
      mapRef.current.selectOutletFromExternal(outlet);
    }
  };

  // Loading screen
  if (!stylesLoaded) {
    return <div className="loading-screen">Loading...</div>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="App loading">
        <div className="loader-container">
          <Loader size="large" text="Loading Subway outlets..." />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="App error">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Header
        outlets={outlets}
        onOutletSelect={handleOutletSelect}
        searchTerm={searchTerm}
        isSearchOpen={isSearchOpen}
        filteredOutlets={filteredData}
        sortOption={sortOption}
        searchRef={searchRef}
        handleSearchChange={handleSearchChange}
        toggleSortOption={toggleSortOption}
        groupedData={groupedData}
      />

      <main className="app-content">
        <div className="main-container">
          {/* Details Panel - Conditionally rendered based on selection */}
          {selectedOutlet && (
            <div className="details-panel">
              <OutletDetails
                outlet={selectedOutlet}
                onClose={clearSelectedOutlet}
              />
            </div>
          )}

          {/* Map View - Always visible */}
          <div className="content-area">
            <div className="map-container">
              <OutletMap
                ref={mapRef}
                onOutletSelect={handleOutletSelect}
                hideSearchFilter={true}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* ChatBot component */}
      <ChatBot onOutletSelect={handleOutletSelect} />
    </div>
  );
};

export default App;
