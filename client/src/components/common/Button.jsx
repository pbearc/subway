// src/components/common/Button.jsx

import React from "react";
import PropTypes from "prop-types";

const BUTTON_VARIANTS = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  OUTLINE: "outline",
  DANGER: "danger",
  LINK: "link",
  BLUE: "blue",
};

const BUTTON_SIZES = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
};

const Button = ({
  children,
  onClick,
  type = "button",
  variant = BUTTON_VARIANTS.PRIMARY,
  size = BUTTON_SIZES.MEDIUM,
  fullWidth = false,
  disabled = false,
  className = "",
  icon = null,
  iconPosition = "left",
  ...props
}) => {
  // All classes use Tailwind only
  const baseClasses =
    "inline-flex items-center justify-center rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200";

  const variantClasses = {
    [BUTTON_VARIANTS.PRIMARY]:
      "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    [BUTTON_VARIANTS.SECONDARY]:
      "bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-400",
    [BUTTON_VARIANTS.OUTLINE]:
      "bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-gray-400",
    [BUTTON_VARIANTS.DANGER]:
      "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    [BUTTON_VARIANTS.LINK]:
      "bg-transparent hover:underline text-green-600 hover:text-green-700 p-0 focus:ring-0",
    [BUTTON_VARIANTS.BLUE]:
      "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
  };

  const sizeClasses = {
    [BUTTON_SIZES.SMALL]: "px-2 py-1 text-xs",
    [BUTTON_SIZES.MEDIUM]: "px-4 py-2 text-sm",
    [BUTTON_SIZES.LARGE]: "px-6 py-3 text-base",
  };

  const buttonClasses = `
    ${baseClasses} 
    ${variantClasses[variant]} 
    ${variant === BUTTON_VARIANTS.LINK ? "" : sizeClasses[size]} 
    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} 
    ${fullWidth ? "w-full" : ""} 
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === "left" && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === "right" && <span className="ml-2">{icon}</span>}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  variant: PropTypes.oneOf(Object.values(BUTTON_VARIANTS)),
  size: PropTypes.oneOf(Object.values(BUTTON_SIZES)),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(["left", "right"]),
};

export default Button;
