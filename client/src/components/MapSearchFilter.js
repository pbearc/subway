// Modified MapSearchFilter.js for the header
import React, { useState, useEffect, useRef } from "react";

const HeaderSearchFilter = ({ outlets, onOutletSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOutlets, setFilteredOutlets] = useState([]);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter outlets when search term changes
  useEffect(() => {
    // Safety check: ensure outlets is an array
    if (!Array.isArray(outlets)) {
      setFilteredOutlets([]);
      return;
    }

    let results = [...outlets];

    // Filter by search term
    if (searchTerm) {
      results = results.filter(
        (outlet) =>
          (outlet.name &&
            outlet.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (outlet.address &&
            outlet.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } else {
      // If no search term, just show empty results
      results = [];
    }

    // Sort results by name
    results.sort((a, b) => {
      const nameA = a.name || "";
      const nameB = b.name || "";
      return nameA.localeCompare(nameB);
    });

    // Limit to top 10 results
    results = results.slice(0, 10);

    setFilteredOutlets(results);
  }, [searchTerm, outlets]);

  // Handle outlet selection
  const handleOutletClick = (outlet) => {
    onOutletSelect(outlet);
    setIsOpen(false);
    setSearchTerm(outlet.name || "");
  };

  return (
    <div className="relative z-50 w-64" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="Search outlets..."
          className="w-full px-3 py-1.5 pl-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white text-gray-800"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        <div className="absolute left-2.5 top-2 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
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

      {isOpen && filteredOutlets.length > 0 && (
        <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg max-h-80 overflow-y-auto">
          <ul>
            {filteredOutlets.map((outlet) => (
              <li
                key={outlet.id}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                onClick={() => handleOutletClick(outlet)}
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

export default HeaderSearchFilter;
