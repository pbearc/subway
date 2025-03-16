// src/components/layout/Header.jsx

import React from "react";
import PropTypes from "prop-types";
import HeaderSearchFilter from "./HeaderSearchFilter";

/**
 * Header component with search functionality
 */
const Header = ({
  outlets,
  onOutletSelect,
  searchTerm,
  isSearchOpen,
  filteredOutlets,
  sortOption,
  searchRef,
  handleSearchChange,
  toggleSortOption,
  groupedData,
}) => {
  return (
    <header className="app-header">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-xl font-bold">Subway Outlets in Kuala Lumpur</h1>

        {/* Search dropdown in the header */}
        <div className="relative z-50 w-80 md:w-96" ref={searchRef}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search outlets by name or address..."
              className="w-full px-3 py-1.5 pl-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white text-gray-800"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => isSearchOpen}
            />
            <div className="absolute left-2.5 top-2 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
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

          {/* Dropdown results */}
          {isSearchOpen && filteredOutlets.length > 0 && (
            <div className="absolute right-0 mt-1 w-full bg-white rounded-lg shadow-lg max-h-80 overflow-y-auto">
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

              <div className="max-h-64 overflow-y-auto">
                {sortOption === "area" && groupedData ? (
                  // Group by area when sorting by area
                  Object.keys(groupedData)
                    .sort()
                    .map((area) => (
                      <div key={area} className="mb-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase px-2 py-1 bg-gray-100">
                          {area}
                        </h3>
                        <ul>
                          {groupedData[area].map((outlet) => (
                            <li
                              key={outlet.id}
                              className="px-3 py-1.5 hover:bg-gray-100 cursor-pointer"
                              onClick={() => onOutletSelect(outlet)}
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
                        onClick={() => onOutletSelect(outlet)}
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
  );
};

Header.propTypes = {
  outlets: PropTypes.array,
  onOutletSelect: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
  isSearchOpen: PropTypes.bool,
  filteredOutlets: PropTypes.array,
  sortOption: PropTypes.string,
  searchRef: PropTypes.object,
  handleSearchChange: PropTypes.func.isRequired,
  toggleSortOption: PropTypes.func.isRequired,
  groupedData: PropTypes.object,
};

export default Header;
