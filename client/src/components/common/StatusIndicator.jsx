// src/components/common/StatusIndicator.jsx

import React from "react";
import PropTypes from "prop-types";

/**
 * Status indicator component
 * Used to show open/closed status of outlets
 */
const StatusIndicator = ({ status, size = "normal" }) => {
  // Determine color based on status
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case "open now":
        return "bg-green-500 text-green-500";
      case "closed now":
      case "closed today":
      case "closed":
        return "bg-red-500 text-red-500";
      default:
        return "bg-gray-400 text-gray-600";
    }
  };

  // Determine size based on prop
  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "w-2 h-2 text-xs";
      case "large":
        return "w-3 h-3 text-base";
      case "normal":
      default:
        return "w-2.5 h-2.5 text-sm";
    }
  };

  const colorClasses = getStatusColor();
  const sizeClasses = getSizeClasses();

  return (
    <div className="flex items-center">
      <div
        className={`${sizeClasses.split(" ")[0]} ${
          sizeClasses.split(" ")[1]
        } rounded-full mr-1.5 ${colorClasses.split(" ")[0]}`}
        aria-hidden="true"
      ></div>
      <span
        className={`${sizeClasses.split(" ")[2]} font-medium ${
          colorClasses.split(" ")[1]
        }`}
      >
        {status}
      </span>
    </div>
  );
};

StatusIndicator.propTypes = {
  status: PropTypes.string.isRequired,
  size: PropTypes.oneOf(["small", "normal", "large"]),
};

export default StatusIndicator;
