// src/components/common/StatusIndicator.jsx

import React from "react";
import PropTypes from "prop-types";

const SIZE_VARIANTS = {
  SMALL: "small",
  NORMAL: "normal",
  LARGE: "large",
};

const StatusIndicator = ({ status, size = SIZE_VARIANTS.NORMAL }) => {
  // Standardized status categories
  const getStatusClasses = () => {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "open now") {
      return {
        dot: "bg-green-500",
        text: "text-green-500",
      };
    } else if (
      ["closed now", "closed today", "closed"].includes(normalizedStatus)
    ) {
      return {
        dot: "bg-red-500",
        text: "text-red-500",
      };
    } else {
      return {
        dot: "bg-gray-400",
        text: "text-gray-600",
      };
    }
  };

  // Responsive sizing
  const getSizeClasses = () => {
    switch (size) {
      case SIZE_VARIANTS.SMALL:
        return {
          dot: "w-2 h-2",
          text: "text-xs",
        };
      case SIZE_VARIANTS.LARGE:
        return {
          dot: "w-3 h-3",
          text: "text-base",
        };
      default:
        return {
          dot: "w-2.5 h-2.5",
          text: "text-sm",
        };
    }
  };

  const statusClasses = getStatusClasses();
  const sizeClasses = getSizeClasses();

  return (
    <div className="flex items-center">
      <div
        className={`${sizeClasses.dot} ${statusClasses.dot} rounded-full mr-1.5`}
        aria-hidden="true"
      ></div>
      <span className={`${sizeClasses.text} ${statusClasses.text} font-medium`}>
        {status}
      </span>
    </div>
  );
};

StatusIndicator.propTypes = {
  status: PropTypes.string.isRequired,
  size: PropTypes.oneOf(Object.values(SIZE_VARIANTS)),
};

export default StatusIndicator;
