import React, { useState, useEffect } from "react";
import OutletMap from "./components/OutletMap";
import OutletList from "./components/OutletList";
import OutletDetails from "./components/OutletDetails";
import ChatBot from "./components/ChatBot";
import api from "./services/api";
import "./App.css";

function App() {
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("map"); // 'map' or 'list'
  const [stylesLoaded, setStylesLoaded] = useState(false);

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

  const handleOutletSelect = (outlet) => {
    setSelectedOutlet(outlet);
  };

  const handleCloseDetails = () => {
    setSelectedOutlet(null);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "map" ? "list" : "map");
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
        <h1>Subway Outlets in Kuala Lumpur</h1>
        <div className="header-actions">
          <button className="view-toggle-btn" onClick={toggleViewMode}>
            {viewMode === "map" ? "Switch to List View" : "Switch to Map View"}
          </button>
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
                borderRight: "1px solid #e2e8f0", // Changed from borderLeft to borderRight
                backgroundColor: "white",
                boxShadow: "2px 0 10px rgba(0, 0, 0, 0.1)", // Changed shadow direction
              }}
            >
              <OutletDetails
                outlet={selectedOutlet}
                onClose={handleCloseDetails}
              />
            </div>
          )}

          {/* Content Area - Now on the right side */}
          <div
            className="content-area"
            style={{ flex: 1, height: "100%", position: "relative" }}
          >
            {viewMode === "map" ? (
              <div
                className="map-container"
                style={{ height: "100%", width: "100%" }}
              >
                <OutletMap onOutletSelect={handleOutletSelect} />
              </div>
            ) : (
              <div className="list-container">
                <OutletList
                  outlets={outlets}
                  onOutletSelect={handleOutletSelect}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Subway Outlet Mapping Project &copy; {new Date().getFullYear()}</p>
      </footer>

      {/* Add the ChatBot component */}
      <ChatBot onOutletSelect={handleOutletSelect} />
    </div>
  );
}

export default App;
