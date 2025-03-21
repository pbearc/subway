// src/components/layout/HeaderSearchFilter.jsx

import React from "react";
import PropTypes from "prop-types";
import useSearch from "../../hooks/useSearch";
import Icon from "../common/Icon";

const HeaderSearchFilter = ({ outlets, onOutletSelect }) => {
  const {
    searchTerm,
    isSearchOpen,
    setIsSearchOpen,
    filteredData,
    searchRef,
    handleSearchChange,
    handleSelect,
  } = useSearch(outlets, onOutletSelect);

  return (
    <div className="relative z-50 w-full md:w-64" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="Search outlets..."
          className="w-full px-3 py-1.5 pl-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white text-gray-800"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => searchTerm && setIsSearchOpen(true)}
          aria-label="Search outlets"
        />
        <div className="absolute left-2.5 top-2 text-gray-400">
          <Icon name="search" size={4} />
        </div>
      </div>

      {isSearchOpen && filteredData.length > 0 && (
        <div className="absolute right-0 mt-1 w-full md:w-64 bg-white rounded-lg shadow-lg max-h-80 overflow-y-auto">
          <ul>
            {filteredData.map((outlet) => (
              <li
                key={outlet.id}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                onClick={() => handleSelect(outlet)}
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
      )}
    </div>
  );
};

HeaderSearchFilter.propTypes = {
  outlets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      address: PropTypes.string,
    })
  ),
  onOutletSelect: PropTypes.func.isRequired,
};

export default HeaderSearchFilter;
