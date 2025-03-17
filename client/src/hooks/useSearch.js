// src/hooks/useSearch.js

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { extractAreaFromAddress } from "../utils/formatters";

/**
 * Custom hook for search functionality
 * @param {Array} data - The data array to search within
 * @param {Function} onSelect - Callback when an item is selected
 * @returns {Object} Search-related state and handlers
 */
const useSearch = (data = [], onSelect) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortOption, setSortOption] = useState("name");
  const [filteredData, setFilteredData] = useState([]);
  const searchRef = useRef(null);

  // Filter and sort data when search term changes
  useEffect(() => {
    // Skip if data is not an array
    if (!Array.isArray(data)) {
      setFilteredData([]);
      return;
    }

    if (!searchTerm.trim()) {
      setFilteredData([]);
      return;
    }

    let results = [...data];

    // Filter by search term
    results = results.filter(
      (item) =>
        (item?.name &&
          item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item?.address &&
          item.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort results based on selected option
    if (sortOption === "name") {
      results.sort((a, b) => {
        const nameA = a?.name || "";
        const nameB = b?.name || "";
        return nameA.localeCompare(nameB);
      });
    } else if (sortOption === "area") {
      results.sort((a, b) => {
        // Use the utility function to extract area names
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

    let sorted = [...data];

    if (sortOption === "name") {
      sorted.sort((a, b) => {
        const nameA = a?.name || "";
        const nameB = b?.name || "";
        return nameA.localeCompare(nameB);
      });
    }

    return sorted;
  }, [data, sortOption]);

  // Group data by area
  const groupedData = useMemo(() => {
    if (sortOption !== "area") return null;

    const groupedItems = {};
    const itemsToGroup = searchTerm.trim() ? filteredData : data;

    if (!Array.isArray(itemsToGroup)) return {};

    itemsToGroup.forEach((item) => {
      if (!item) return;

      // Use the utility function to extract area
      const areaName = extractAreaFromAddress(item.address);

      // Create group if it doesn't exist
      if (!groupedItems[areaName]) {
        groupedItems[areaName] = [];
      }

      groupedItems[areaName].push(item);
    });

    return groupedItems;
  }, [filteredData, data, sortOption, searchTerm]);

  // Handler for search input changes
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setIsSearchOpen(true); // Always show dropdown when typing
  }, []);

  // Handler for item selection
  const handleSelect = useCallback(
    (item) => {
      if (onSelect && typeof onSelect === "function") {
        onSelect(item);
      }
      setIsSearchOpen(false);
    },
    [onSelect]
  );

  // Toggle sort option
  const toggleSortOption = useCallback((option) => {
    setSortOption(option);
  }, []);

  // Clear search term
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
