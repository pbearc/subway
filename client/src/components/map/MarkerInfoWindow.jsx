// src/components/map/MarkerInfoWindow.jsx

import React from "react";
import PropTypes from "prop-types";
import { InfoWindow } from "@react-google-maps/api";
import StatusIndicator from "../common/StatusIndicator";

const MarkerInfoWindow = ({
  outlet,
  position,
  onClose,
  outletStatus,
  todayHours,
}) => {
  if (!outlet) return null;

  return (
    <InfoWindow
      position={position}
      onCloseClick={onClose}
      options={{
        pixelOffset: new window.google.maps.Size(0, -30),
        // Disable auto pan to prevent map movement
        disableAutoPan: true,
        // Make sure InfoWindow is always on top
        zIndex: 9999,
      }}
    >
      <div className="p-1 max-w-[250px]">
        <h3 className="font-bold text-base mb-1">
          {outlet.name || "Unnamed Outlet"}
        </h3>
        <p className="text-sm mb-1 text-gray-700 break-words">
          {outlet.address || "No address available"}
        </p>
        <div className="mt-2">
          <StatusIndicator status={outletStatus} size="small" />
        </div>
        <div className="text-xs text-gray-600 mt-1">{todayHours}</div>
        <div className="text-xs text-blue-500 mt-2 italic">
          Click on the marker for more details
        </div>
      </div>
    </InfoWindow>
  );
};

MarkerInfoWindow.propTypes = {
  outlet: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    address: PropTypes.string,
  }).isRequired,
  position: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  outletStatus: PropTypes.string.isRequired,
  todayHours: PropTypes.string.isRequired,
};

export default MarkerInfoWindow;
