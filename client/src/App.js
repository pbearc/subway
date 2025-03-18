// src/App.js

import React, { useState, useEffect, useRef } from "react";
import OutletMap from "./components/map/OutletMap";
import OutletDetails from "./components/outlet/OutletDetails";
import ChatBot from "./components/chatbot/ChatBot";
import Header from "./components/layout/Header";
import Loader from "./components/common/Loader";
import Button from "./components/common/Button";
import useOutlets from "./hooks/useOutlets";
import useSearch from "./hooks/useSearch";

const App = () => {
  const {
    outlets,
    loading,
    error,
    selectedOutlet,
    selectOutlet,
    clearSelectedOutlet,
  } = useOutlets();

  const [stylesLoaded, setStylesLoaded] = useState(false);
  const mapRef = useRef(null);

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

  // Give CSS time to load
  useEffect(() => {
    const timer = setTimeout(() => setStylesLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleOutletSelect = (outlet, updateSearch = false) => {
    const showRadiusCallback = (outletToShow) => {
      mapRef.current?.showRadius?.(outletToShow);
    };

    // Add all outlets data if not present
    if (outlet && !outlet.allOutlets) {
      outlet = { ...outlet, allOutlets: outlets };
    }

    selectOutlet(outlet, showRadiusCallback);

    if (updateSearch && outlet?.name) {
      setSearchTerm(outlet.name);
    }

    setIsSearchOpen(false);
    mapRef.current?.selectOutletFromExternal?.(outlet);
  };

  if (!stylesLoaded) {
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-gray-100 text-lg text-gray-600 font-sans">
        Loading...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-screen bg-white items-center justify-center font-sans">
        <div className="text-center p-8">
          <Loader size="large" text="Loading Subway outlets..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen w-screen bg-white items-center justify-center font-sans">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
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

      <main className="flex-1 overflow-hidden bg-white relative pt-0">
        <div className="flex h-full w-full absolute inset-0">
          {selectedOutlet && (
            <div className="w-[300px] h-full overflow-y-auto bg-white shadow-md border-r border-gray-200 z-20 md:static fixed bottom-0 left-0 right-0 top-[56px] w-full md:w-[300px] md:h-full h-[calc(100%-56px)] border-t md:border-t-0 md:rounded-none thin-scrollbar">
              <OutletDetails
                outlet={selectedOutlet}
                onClose={clearSelectedOutlet}
              />
            </div>
          )}

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

      <ChatBot onOutletSelect={handleOutletSelect} />
    </div>
  );
};

export default App;
