import React, { useState, useEffect } from "react";
import OutletMap from "./components/OutletMap";
import OutletList from "./components/OutletList";
import OutletDetails from "./components/OutletDetails";
import api from "./services/api";
import "./App.css";

function App() {
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("map"); // 'map' or 'list'

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
    <div className="App">
      <header className="app-header">
        <h1>Subway Outlets in Kuala Lumpur</h1>
        <div className="header-actions">
          <button className="view-toggle-btn" onClick={toggleViewMode}>
            {viewMode === "map" ? "Switch to List View" : "Switch to Map View"}
          </button>
        </div>
      </header>

      <main className="app-content">
        <div className="main-container">
          {viewMode === "map" ? (
            <div className="map-container">
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

          {selectedOutlet && (
            <div className="details-panel">
              <OutletDetails
                outlet={selectedOutlet}
                onClose={handleCloseDetails}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Subway Outlet Mapping Project &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
