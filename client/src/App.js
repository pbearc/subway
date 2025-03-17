// src/App.js

import React, { useState, useEffect, useRef } from "react";
import OutletMap from "./components/map/OutletMap";
import OutletDetails from "./components/outlet/OutletDetails";
import ChatBot from "./components/chatbot/ChatBot";
import Header from "./components/layout/Header";
import Loader from "./components/common/Loader";
import useOutlets from "./hooks/useOutlets";
import useSearch from "./hooks/useSearch";

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

  // Search functionality with modified behavior
  const {
    searchTerm,
    setSearchTerm,
    isSearchOpen,
    setIsSearchOpen,
    filteredData,
    sortOption,
    searchRef,
    handleSearchChange,
    toggleSortOption,
    groupedData,
  } = useSearch(outlets, (outlet) => handleOutletSelect(outlet, true));

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
   * @param {boolean} updateSearch - Whether to update search term (default: false)
   */
  const handleOutletSelect = (outlet, updateSearch = false) => {
    // Define the radius callback function
    const showRadiusCallback = (outletToShow) => {
      if (mapRef.current && mapRef.current.showRadius) {
        mapRef.current.showRadius(outletToShow);
      }
    };

    // If the outlet doesn't have allOutlets property, add it
    // This ensures outlets selected from the list have the same data
    // as those selected from the map
    if (outlet && !outlet.allOutlets) {
      outlet = {
        ...outlet,
        allOutlets: outlets, // Add all outlets data
      };
    }

    // Select the outlet with radius callback
    selectOutlet(outlet, showRadiusCallback);

    // Only update search term if explicitly requested
    if (updateSearch && outlet?.name) {
      setSearchTerm(outlet.name);
    }

    // Close search dropdown when selecting an outlet
    setIsSearchOpen(false);

    // Trigger map's selection
    if (mapRef.current && mapRef.current.selectOutletFromExternal) {
      mapRef.current.selectOutletFromExternal(outlet);
    }
  };

  // Loading screen
  if (!stylesLoaded) {
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-gray-100 text-lg text-gray-600 font-sans">
        Loading...
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col h-screen w-screen bg-white items-center justify-center font-sans">
        <div className="text-center p-8">
          <Loader size="large" text="Loading Subway outlets..." />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-screen w-screen bg-white items-center justify-center font-sans">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-subway-green text-white rounded hover:bg-primary-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-white font-sans">
      <Header
        outlets={outlets}
        onOutletSelect={(outlet) => handleOutletSelect(outlet, true)}
        searchTerm={searchTerm}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        filteredOutlets={filteredData}
        sortOption={sortOption}
        searchRef={searchRef}
        handleSearchChange={handleSearchChange}
        toggleSortOption={toggleSortOption}
        groupedData={groupedData}
      />

      <main className="flex-1 overflow-hidden bg-white relative">
        <div className="flex h-full w-full absolute inset-0">
          {/* Details Panel - Conditionally rendered based on selection */}
          {selectedOutlet && (
            <div className="w-[300px] h-full overflow-y-auto bg-white shadow-md border-r border-gray-200 z-20 md:static fixed bottom-0 left-0 w-full md:w-[300px] md:h-full h-[70vh] border-t md:border-t-0 rounded-t-xl md:rounded-none thin-scrollbar">
              <OutletDetails
                outlet={selectedOutlet}
                onClose={clearSelectedOutlet}
              />
            </div>
          )}

          {/* Map View - Always visible */}
          <div
            className={`flex-1 relative ${
              selectedOutlet ? "md:h-full h-[30vh]" : "h-full"
            }`}
          >
            <div className="absolute inset-0">
              <OutletMap
                ref={mapRef}
                onOutletSelect={handleOutletSelect}
                hideSearchFilter={true}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ChatBot component */}
      <ChatBot onOutletSelect={handleOutletSelect} />
    </div>
  );
};

export default App;
