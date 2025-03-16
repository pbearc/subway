// src/hooks/useOutlets.js

import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../services/api";

/**
 * Custom hook for managing outlet data and operations
 * @returns {Object} Outlet data and related functions
 */
const useOutlets = () => {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOutlet, setSelectedOutlet] = useState(null);

  /**
   * Fetch all outlets from the API
   */
  const fetchOutlets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAllOutlets();
      setOutlets(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch outlets");
      console.error("Error fetching outlets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch outlets on mount
  useEffect(() => {
    fetchOutlets();
  }, [fetchOutlets]);

  /**
   * Select an outlet and enhance it with additional properties
   * @param {Object} outlet - The outlet to select
   * @param {Function} showRadiusCallback - Callback to show radius on map
   */
  const selectOutlet = useCallback((outlet, showRadiusCallback) => {
    if (!outlet) return;

    // Enhance outlet with additional properties
    const enhancedOutlet = {
      ...outlet,
      showRadius: showRadiusCallback,
      // Function that always returns false so button text stays as "Show 5km radius"
      isRadiusActive: () => false,
    };

    setSelectedOutlet(enhancedOutlet);
  }, []);

  /**
   * Clear the selected outlet
   */
  const clearSelectedOutlet = useCallback(() => {
    setSelectedOutlet(null);
  }, []);

  /**
   * Group outlets by area based on their address
   * @returns {Object} Outlets grouped by area
   */
  const groupedByArea = useMemo(() => {
    const groupedOutlets = {};

    outlets.forEach((outlet) => {
      if (!outlet || !outlet.address) {
        // Handle outlets with no address
        if (!groupedOutlets["Other"]) {
          groupedOutlets["Other"] = [];
        }
        groupedOutlets["Other"].push(outlet);
        return;
      }

      // Extract area from address
      let areaName = "Other";
      const parts = outlet.address.split(",");

      if (parts.length >= 2) {
        areaName = parts[parts.length - 2].trim();
      } else if (parts.length === 1) {
        areaName = parts[0].trim();
      }

      // Create group if it doesn't exist
      if (!groupedOutlets[areaName]) {
        groupedOutlets[areaName] = [];
      }

      groupedOutlets[areaName].push(outlet);
    });

    return groupedOutlets;
  }, [outlets]);

  return {
    outlets,
    loading,
    error,
    selectedOutlet,
    selectOutlet,
    clearSelectedOutlet,
    groupedByArea,
    refreshOutlets: fetchOutlets,
  };
};

export default useOutlets;
