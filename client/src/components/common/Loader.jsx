// src/components/common/Loader.jsx

import React from "react";
import PropTypes from "prop-types";

/**
 * A reusable loading component with different styles and sizes
 */
const Loader = ({
  type = "spinner",
  size = "medium",
  text = "Loading...",
  showText = true,
  color = "green",
}) => {
  // Generate size classes
  const sizeClasses = {
    small: {
      spinner: "h-4 w-4",
      pulse: "h-6 w-6",
      container: "text-xs",
    },
    medium: {
      spinner: "h-8 w-8",
      pulse: "h-12 w-12",
      container: "text-sm",
    },
    large: {
      spinner: "h-12 w-12",
      pulse: "h-16 w-16",
      container: "text-base",
    },
  };

  // Generate color classes
  const colorClasses = {
    green: "border-green-500 text-green-600",
    blue: "border-blue-500 text-blue-600",
    gray: "border-gray-500 text-gray-600",
    red: "border-red-500 text-red-600",
  };

  const spinnerClasses = `${sizeClasses[size].spinner} animate-spin rounded-full border-t-2 border-b-2 ${colorClasses[color]}`;
  const pulseClasses = `${sizeClasses[size].pulse} animate-pulse bg-${color}-200 rounded-full`;

  return (
    <div className="flex flex-col items-center justify-center">
      {type === "spinner" && <div className={spinnerClasses}></div>}

      {type === "pulse" && <div className={pulseClasses}></div>}

      {showText && (
        <p className={`mt-2 ${sizeClasses[size].container} text-gray-600`}>
          {text}
        </p>
      )}
    </div>
  );
};

Loader.propTypes = {
  type: PropTypes.oneOf(["spinner", "pulse"]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  text: PropTypes.string,
  showText: PropTypes.bool,
  color: PropTypes.oneOf(["green", "blue", "gray", "red"]),
};

export default Loader;
