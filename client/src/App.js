import React, { useState, useEffect, useRef } from "react";
import OutletMap from "./components/OutletMap";
import OutletDetails from "./components/OutletDetails";
import ChatBot from "./components/ChatBot";
import api from "./services/api";

// Import CSS files
import "./App.css";

function App() {
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stylesLoaded, setStylesLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filteredOutlets, setFilteredOutlets] = useState([]);
  const [sortOption, setSortOption] = useState("name");
  const searchDropdownRef = useRef(null);
  // Reference to the map component
  const mapRef = useRef(null);

  useEffect(() => {
    // Give CSS time to load properly
    const timer = setTimeout(() => {
      setStylesLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter and sort outlets when search term changes
  useEffect(() => {
    let results = [...outlets];

    // Filter by search term if there is one
    if (searchTerm.trim()) {
      results = results.filter(
        (outlet) =>
          (outlet?.name &&
            outlet.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (outlet?.address &&
            outlet.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort results based on selected option
    if (sortOption === "name") {
      results.sort((a, b) => {
        const nameA = a?.name || "";
        const nameB = b?.name || "";
        return nameA.localeCompare(nameB);
      });
    } else if (sortOption === "area") {
      results.sort((a, b) => {
        // Add null checks for addresses
        let areaA = "Unknown";
        let areaB = "Unknown";

        if (a?.address) {
          const parts = a.address.split(",");
          if (parts.length >= 2) {
            areaA = parts[parts.length - 2].trim();
          } else if (parts.length === 1) {
            areaA = parts[0].trim();
          }
        }

        if (b?.address) {
          const parts = b.address.split(",");
          if (parts.length >= 2) {
            areaB = parts[parts.length - 2].trim();
          } else if (parts.length === 1) {
            areaB = parts[0].trim();
          }
        }

        return areaA.localeCompare(areaB);
      });
    }

    setFilteredOutlets(results);
  }, [searchTerm, outlets, sortOption]);

  // Group outlets by area
  const getOutletsByArea = () => {
    const groupedOutlets = {};

    filteredOutlets.forEach((outlet) => {
      if (!outlet) return;

      let areaName = "Other";

      // Handle the case where address might be null or undefined
      if (outlet.address) {
        const parts = outlet.address.split(",");
        if (parts.length >= 2) {
          areaName = parts[parts.length - 2].trim();
        } else if (parts.length === 1) {
          areaName = parts[0].trim();
        }
      }

      // Create group if it doesn't exist
      if (!groupedOutlets[areaName]) {
        groupedOutlets[areaName] = [];
      }

      groupedOutlets[areaName].push(outlet);
    });

    return groupedOutlets;
  };

  // Get grouped outlets for the dropdown
  const groupedOutlets = sortOption === "area" ? getOutletsByArea() : null;

  const handleOutletSelect = (outlet) => {
    // Ensure the outlet has the showRadius function but no toggle functionality
    const enhancedOutlet = {
      ...outlet,
      // This will only show radius - button text will never change to "Hide"
      showRadius: (outletToShow) => {
        if (mapRef.current && mapRef.current.showRadius) {
          mapRef.current.showRadius(outletToShow);
        }
      },
      // Always return false so button text stays as "Show 5km radius"
      isRadiusActive: () => false,
    };

    // Update app state
    setSelectedOutlet(enhancedOutlet);
    setSearchTerm(outlet?.name || "");
    setIsSearchOpen(false);

    // Trigger map's selection
    if (mapRef.current && mapRef.current.selectOutletFromExternal) {
      mapRef.current.selectOutletFromExternal(outlet);
    }
  };

  const handleCloseDetails = () => {
    setSelectedOutlet(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsSearchOpen(true);
  };

  if (!stylesLoaded) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (loading) {
    return (
      <div className="App loading">
        <div className="loader-container">
          <div className="loader"></div>
          <p>Loading Subway outlets...</p>
        </div>
      </div>
    );
  }

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
    <div
      className="App"
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      <header className="app-header">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-xl font-bold">Subway Outlets in Kuala Lumpur</h1>

          {/* Search dropdown in the header */}
          <div className="relative z-50 w-80" ref={searchDropdownRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search outlets by name or address..."
                className="w-full px-3 py-1.5 pl-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white text-gray-800"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchOpen(true)}
              />
              <div className="absolute left-2.5 top-2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {isSearchOpen && filteredOutlets.length > 0 && (
              <div className="absolute right-0 mt-1 w-80 bg-white rounded-lg shadow-lg max-h-80 overflow-y-auto">
                <div className="p-2 flex justify-end bg-gray-50 border-b">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 mr-1">Sort by:</span>
                    <button
                      className={`mr-2 ${
                        sortOption === "name"
                          ? "text-green-600 font-medium"
                          : "text-gray-600"
                      }`}
                      onClick={() => setSortOption("name")}
                    >
                      Name
                    </button>
                    <button
                      className={`${
                        sortOption === "area"
                          ? "text-green-600 font-medium"
                          : "text-gray-600"
                      }`}
                      onClick={() => setSortOption("area")}
                    >
                      Area
                    </button>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {sortOption === "area" ? (
                    // Group by area when sorting by area
                    Object.keys(groupedOutlets)
                      .sort()
                      .map((area) => (
                        <div key={area} className="mb-2">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase px-2 py-1 bg-gray-100">
                            {area}
                          </h3>
                          <ul>
                            {groupedOutlets[area].map((outlet) => (
                              <li
                                key={outlet.id}
                                className="px-3 py-1.5 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleOutletSelect(outlet)}
                              >
                                <div className="font-medium text-sm text-gray-800">
                                  {outlet.name || "Unnamed Outlet"}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {outlet.address || "No address available"}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                  ) : (
                    // Simple list when sorting by name
                    <ul>
                      {filteredOutlets.map((outlet) => (
                        <li
                          key={outlet.id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                          onClick={() => handleOutletSelect(outlet)}
                        >
                          <div className="font-medium text-sm text-gray-800">
                            {outlet.name || "Unnamed Outlet"}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {outlet.address || "No address available"}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="bg-gray-50 text-right py-2 px-3 text-xs text-gray-500 border-t">
                  {filteredOutlets.length} outlets found
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-content" style={{ flex: 1, overflow: "hidden" }}>
        <div
          className="main-container"
          style={{ height: "100%", display: "flex" }}
        >
          {/* Details Panel - Now on the left side */}
          {selectedOutlet && (
            <div
              className="details-panel"
              style={{
                width: "300px",
                height: "100%",
                overflowY: "auto",
                borderRight: "1px solid #e2e8f0",
                backgroundColor: "white",
                boxShadow: "2px 0 10px rgba(0, 0, 0, 0.1)",
              }}
            >
              <OutletDetails
                outlet={selectedOutlet}
                onClose={handleCloseDetails}
              />
            </div>
          )}

          {/* Map View - Always visible */}
          <div
            className="content-area"
            style={{ flex: 1, height: "100%", position: "relative" }}
          >
            <div
              className="map-container"
              style={{ height: "100%", width: "100%" }}
            >
              <OutletMap
                ref={mapRef}
                onOutletSelect={handleOutletSelect}
                hideSearchFilter={true}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Subway Outlet Mapping Project &copy; {new Date().getFullYear()}</p>
      </footer>

      {/* ChatBot component */}
      <ChatBot onOutletSelect={handleOutletSelect} />
    </div>
  );
}

export default App;
