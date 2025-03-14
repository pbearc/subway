import React, { useState } from "react";

const OutletList = ({ outlets, onOutletSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter outlets based on search term
  const filteredOutlets = outlets.filter(
    (outlet) =>
      outlet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      outlet.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded shadow h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold mb-2">Subway Outlets</h2>
        <input
          type="text"
          placeholder="Search outlets..."
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredOutlets.length === 0 ? (
          <p className="text-center text-gray-500 p-4">No outlets found</p>
        ) : (
          <ul className="divide-y">
            {filteredOutlets.map((outlet) => (
              <li
                key={outlet.id}
                className="p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => onOutletSelect(outlet)}
              >
                <h3 className="font-medium">{outlet.name}</h3>
                <p className="text-sm text-gray-600 truncate">
                  {outlet.address}
                </p>
                {outlet.hasIntersection && (
                  <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded mt-1">
                    Overlapping Area
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default OutletList;
