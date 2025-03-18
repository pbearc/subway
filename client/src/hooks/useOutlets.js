// src/hooks/useOutlets.js

import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../services/api";
import { extractAreaFromAddress } from "../utils/formatters";

/**
 * Custom hook for managing outlet data and operations
 * @returns {Object} Outlet data and related functions
 */
const useOutlets = () => {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOutlet, setSelectedOutlet] = useState(null);

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

  useEffect(() => {
    fetchOutlets();
  }, [fetchOutlets]);

  const selectOutlet = useCallback((outlet, showRadiusCallback) => {
    if (!outlet) return;

    setSelectedOutlet({
      ...outlet,
      showRadius: showRadiusCallback,
      isRadiusActive: () => false,
    });
  }, []);

  const clearSelectedOutlet = useCallback(() => {
    setSelectedOutlet(null);
  }, []);

  const findOutletById = useCallback(
    (outletId) => {
      if (!outletId || !outlets.length) return null;
      return outlets.find((outlet) => outlet.id === outletId) || null;
    },
    [outlets]
  );

  const groupedByArea = useMemo(() => {
    const groupedOutlets = {};

    outlets.forEach((outlet) => {
      if (!outlet) return;
      const areaName = extractAreaFromAddress(outlet.address);

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
    findOutletById,
    groupedByArea,
    refreshOutlets: fetchOutlets,
  };
};

export default useOutlets;
