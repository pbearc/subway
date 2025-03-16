// src/hooks/useSearch.js

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

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

    let results = [...data];

    // Filter by search term if there is one
    if (searchTerm.trim()) {
      results = results.filter(
        (item) =>
          (item?.name &&
            item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item?.address &&
            item.address.toLowerCase().includes(searchTerm.toLowerCase()))
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

  // Group data by area
  const groupedData = useMemo(() => {
    if (sortOption !== "area") return null;

    const groupedItems = {};

    filteredData.forEach((item) => {
      if (!item) return;

      let areaName = "Other";

      // Handle case where address might be null or undefined
      if (item.address) {
        const parts = item.address.split(",");
        if (parts.length >= 2) {
          areaName = parts[parts.length - 2].trim();
        } else if (parts.length === 1) {
          areaName = parts[0].trim();
        }
      }

      // Create group if it doesn't exist
      if (!groupedItems[areaName]) {
        groupedItems[areaName] = [];
      }

      groupedItems[areaName].push(item);
    });

    return groupedItems;
  }, [filteredData, sortOption]);

  // Handler for search input changes
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setIsSearchOpen(Boolean(e.target.value.trim()));
  }, []);

  // Handler for item selection
  const handleSelect = useCallback(
    (item) => {
      if (onSelect && typeof onSelect === "function") {
        onSelect(item);
      }
      setSearchTerm(item?.name || "");
      setIsSearchOpen(false);
    },
    [onSelect]
  );

  // Toggle sort option
  const toggleSortOption = useCallback((option) => {
    setSortOption(option);
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
  };
};

export default useSearch;
