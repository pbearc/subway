// src/hooks/useSearch.js

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { extractAreaFromAddress } from "../utils/formatters";

const SORT_OPTIONS = {
  NAME: "name",
  AREA: "area",
};

/**
 * Custom hook for search functionality
 * @param {Array} data - The data array to search within
 * @param {Function} onSelect - Callback when an item is selected
 * @returns {Object} Search-related state and handlers
 */
const useSearch = (data = [], onSelect) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortOption, setSortOption] = useState(SORT_OPTIONS.NAME);
  const [filteredData, setFilteredData] = useState([]);
  const searchRef = useRef(null);

  // Filter and sort data when search term changes
  useEffect(() => {
    if (!Array.isArray(data) || !searchTerm.trim()) {
      setFilteredData([]);
      return;
    }

    const results = data.filter(
      (item) =>
        item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item?.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort results based on selected option
    if (sortOption === SORT_OPTIONS.NAME) {
      results.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
    } else if (sortOption === SORT_OPTIONS.AREA) {
      results.sort((a, b) => {
        const areaA = extractAreaFromAddress(a?.address);
        const areaB = extractAreaFromAddress(b?.address);
        return areaA.localeCompare(areaB);
      });
    }

    setFilteredData(results);
  }, [searchTerm, data, sortOption]);

  // Set up click outside handler to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sort all data (for when no search term is entered)
  const sortedAllData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    if (sortOption === SORT_OPTIONS.NAME) {
      return [...data].sort((a, b) =>
        (a?.name || "").localeCompare(b?.name || "")
      );
    }

    return [...data];
  }, [data, sortOption]);

  // Group data by area
  const groupedData = useMemo(() => {
    if (sortOption !== SORT_OPTIONS.AREA) return null;

    const groupedItems = {};
    const itemsToGroup = searchTerm.trim() ? filteredData : data;

    if (!Array.isArray(itemsToGroup)) return {};

    itemsToGroup.forEach((item) => {
      if (!item) return;

      const areaName = extractAreaFromAddress(item.address);

      if (!groupedItems[areaName]) {
        groupedItems[areaName] = [];
      }

      groupedItems[areaName].push(item);
    });

    return groupedItems;
  }, [filteredData, data, sortOption, searchTerm]);

  // Handlers
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setIsSearchOpen(true);
  }, []);

  const handleSelect = useCallback(
    (item) => {
      if (typeof onSelect === "function") {
        onSelect(item);
      }
      setIsSearchOpen(false);
    },
    [onSelect]
  );

  const toggleSortOption = useCallback((option) => {
    setSortOption(option);
  }, []);

  const clearSearchTerm = useCallback(() => {
    setSearchTerm("");
    setIsSearchOpen(false);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    isSearchOpen,
    setIsSearchOpen,
    filteredData,
    sortOption,
    setSortOption,
    searchRef,
    handleSearchChange,
    handleSelect,
    toggleSortOption,
    groupedData,
    clearSearchTerm,
    sortedAllData,
  };
};

export default useSearch;
