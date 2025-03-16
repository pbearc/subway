// src/components/common/StatusIndicator.jsx

import React from "react";
import PropTypes from "prop-types";

/**
 * A reusable status indicator component
 * Used to show open/closed status of outlets
 */
const StatusIndicator = ({ status, size = "normal" }) => {
  // Determine color based on status
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case "open now":
        return { bg: "#10b981", text: "#10b981" };
      case "closed now":
      case "closed today":
      case "closed":
        return { bg: "#ef4444", text: "#ef4444" };
      default:
        return { bg: "#9ca3af", text: "#6b7280" };
    }
  };

  // Determine size based on prop
  const getDotSize = () => {
    switch (size) {
      case "small":
        return { dot: "w-2 h-2", text: "text-xs" };
      case "large":
        return { dot: "w-3 h-3", text: "text-base" };
      case "normal":
      default:
        return { dot: "w-2.5 h-2.5", text: "text-sm" };
    }
  };

  const { bg, text } = getStatusColor();
  const { dot, text: textSize } = getDotSize();

  return (
    <div className="flex items-center">
      <div
        className={`${dot} rounded-full mr-1.5`}
        style={{ backgroundColor: bg }}
        aria-hidden="true"
      ></div>
      <span className={`${textSize} font-medium`} style={{ color: text }}>
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
