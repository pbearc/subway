// src/components/common/Loader.jsx

import React from "react";
import PropTypes from "prop-types";

const LOADER_TYPES = {
  SPINNER: "spinner",
  PULSE: "pulse",
};

const LOADER_SIZES = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
};

const Loader = ({
  type = LOADER_TYPES.SPINNER,
  size = LOADER_SIZES.MEDIUM,
  text = "Loading...",
  showText = true,
}) => {
  const sizeClasses = {
    [LOADER_SIZES.SMALL]: {
      container: "h-4 w-4",
      text: "text-xs",
    },
    [LOADER_SIZES.MEDIUM]: {
      container: "h-8 w-8",
      text: "text-sm",
    },
    [LOADER_SIZES.LARGE]: {
      container: "h-12 w-12",
      text: "text-base",
    },
  };

  const selectedSize = sizeClasses[size] || sizeClasses[LOADER_SIZES.MEDIUM];

  return (
    <div className="flex flex-col items-center justify-center">
      {type === LOADER_TYPES.SPINNER ? (
        <div
          className={`${selectedSize.container} animate-spin rounded-full border-2 border-gray-200 border-t-green-500`}
        ></div>
      ) : (
        <div
          className={`${selectedSize.container} animate-pulse rounded-full bg-green-200`}
        ></div>
      )}

      {showText && (
        <p className={`mt-2 ${selectedSize.text} text-gray-600`}>{text}</p>
      )}
    </div>
  );
};

Loader.propTypes = {
  type: PropTypes.oneOf(Object.values(LOADER_TYPES)),
  size: PropTypes.oneOf(Object.values(LOADER_SIZES)),
  text: PropTypes.string,
  showText: PropTypes.bool,
};

export default Loader;
