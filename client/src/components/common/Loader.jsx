// src/components/common/Loader.jsx

import React from "react";
import PropTypes from "prop-types";

/**
 * Loading component with different styles and sizes
 */
const Loader = ({
  type = "spinner",
  size = "medium",
  text = "Loading...",
  showText = true,
  color = "green",
}) => {
  // Size mappings for different loader types
  const sizeMap = {
    small: {
      spinner: "h-4 w-4",
      pulse: "h-6 w-6",
      text: "text-xs",
    },
    medium: {
      spinner: "h-8 w-8",
      pulse: "h-12 w-12",
      text: "text-sm",
    },
    large: {
      spinner: "h-12 w-12",
      pulse: "h-16 w-16",
      text: "text-base",
    },
  };

  // Color mappings
  const colorMap = {
    green: {
      border: "border-green-500",
      text: "text-green-600",
      bg: "bg-green-200",
    },
    blue: {
      border: "border-blue-500",
      text: "text-blue-600",
      bg: "bg-blue-200",
    },
    gray: {
      border: "border-gray-500",
      text: "text-gray-600",
      bg: "bg-gray-200",
    },
    red: {
      border: "border-red-500",
      text: "text-red-600",
      bg: "bg-red-200",
    },
  };

  const selectedSize = sizeMap[size] || sizeMap.medium;
  const selectedColor = colorMap[color] || colorMap.green;

  return (
    <div className="flex flex-col items-center justify-center">
      {type === "spinner" && (
        <div
          className={`${selectedSize.spinner} animate-spin rounded-full border-2 border-t-transparent ${selectedColor.border}`}
        ></div>
      )}

      {type === "pulse" && (
        <div
          className={`${selectedSize.pulse} animate-pulse rounded-full ${selectedColor.bg}`}
        ></div>
      )}

      {showText && (
        <p className={`mt-2 ${selectedSize.text} text-gray-600`}>{text}</p>
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
