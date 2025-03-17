// src/components/layout/Header.jsx

import React from "react";
import PropTypes from "prop-types";
import Icon from "../common/Icon";
import useSearch from "../../hooks/useSearch";

/**
 * Header component with search functionality
 */
const Header = ({ outlets, onOutletSelect }) => {
  // Use the search hook to get all search related functions and state
  const {
    searchTerm,
    isSearchOpen,
    setIsSearchOpen,
    filteredData: filteredOutlets,
    sortOption,
    searchRef,
    handleSearchChange,
    toggleSortOption,
    groupedData,
    handleSelect,
  } = useSearch(outlets, onOutletSelect);

  return (
    <header className="bg-green-800 text-white px-4 py-3 flex justify-between items-center shadow-md z-30">
      <h1 className="text-xl font-bold">Subway Outlets in Kuala Lumpur</h1>

      {/* Search dropdown in the header - mobile friendly */}
      <div className="relative z-50 w-80 md:w-96 max-w-full" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search outlets by name or address..."
            className="w-full px-3 py-1.5 pl-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white text-gray-800"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchOpen(true)}
            onClick={() => setIsSearchOpen(true)}
          />
          <div className="absolute left-2.5 top-2 text-gray-400">
            <Icon name="search" size={4} />
          </div>
        </div>

        {/* Dropdown results - shows on all screen sizes */}
        {isSearchOpen && outlets.length > 0 && (
          <div className="absolute mt-1 w-full bg-white rounded-lg shadow-lg overflow-hidden max-h-[80vh]">
            <div className="p-2 flex justify-end bg-gray-50 border-b">
              <div className="flex items-center text-sm">
                <span className="text-gray-600 mr-1">Sort by:</span>
                <button
                  className={`mr-2 ${
                    sortOption === "name"
                      ? "text-green-600 font-medium"
                      : "text-gray-600"
                  }`}
                  onClick={() => toggleSortOption("name")}
                >
                  Name
                </button>
                <button
                  className={`${
                    sortOption === "area"
                      ? "text-green-600 font-medium"
                      : "text-gray-600"
                  }`}
                  onClick={() => toggleSortOption("area")}
                >
                  Area
                </button>
              </div>
            </div>

            {/* Improved scrollable container */}
            <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
              {sortOption === "area" && groupedData ? (
                // Group by area when sorting by area
                Object.keys(groupedData)
                  .sort()
                  .map((area) => (
                    <div key={area} className="mb-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase px-2 py-1 bg-gray-100 sticky top-0">
                        {area}
                      </h3>
                      <ul>
                        {groupedData[area].map((outlet) => (
                          <li
                            key={outlet.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleSelect(outlet)}
                          >
                            {/* Only show the outlet name */}
                            <div className="font-medium text-sm text-gray-800">
                              {outlet.name || "Unnamed Outlet"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
              ) : (
                // Simple list when sorting by name
                <ul>
                  {/* Show all outlets when search is empty, otherwise show filtered */}
                  {(searchTerm.trim() === "" ? outlets : filteredOutlets).map(
                    (outlet) => (
                      <li
                        key={outlet.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                        onClick={() => handleSelect(outlet)}
                      >
                        {/* Only show the outlet name */}
                        <div className="font-medium text-sm text-gray-800">
                          {outlet.name || "Unnamed Outlet"}
                        </div>
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>

            <div className="bg-gray-50 text-right py-2 px-3 text-xs text-gray-500 border-t">
              {(searchTerm.trim() === "" ? outlets : filteredOutlets).length}{" "}
              outlets found
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

Header.propTypes = {
  outlets: PropTypes.array,
  onOutletSelect: PropTypes.func.isRequired,
};

export default Header;
