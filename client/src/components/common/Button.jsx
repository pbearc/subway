// src/components/common/Button.jsx

import React from "react";
import PropTypes from "prop-types";

/**
 * A reusable button component with multiple variants and sizes
 */
const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "medium",
  fullWidth = false,
  disabled = false,
  className = "",
  icon = null,
  iconPosition = "left",
  ...props
}) => {
  // Base classes for all buttons
  const baseClasses =
    "inline-flex items-center justify-center rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200";

  // Variant specific classes
  const variantClasses = {
    primary: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-400",
    outline:
      "bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-gray-400",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    link: "bg-transparent hover:underline text-green-600 hover:text-green-700 p-0 focus:ring-0",
  };

  // Size specific classes
  const sizeClasses = {
    small: "px-2 py-1 text-xs",
    medium: "px-4 py-2 text-sm",
    large: "px-6 py-3 text-base",
  };

  // Conditional classes
  const isDisabled = disabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer";
  const isFullWidth = fullWidth ? "w-full" : "";
  const isLink = variant === "link" ? "" : sizeClasses[size];

  // Combine all classes
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${isLink} ${isDisabled} ${isFullWidth} ${className}`;

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
  variant: PropTypes.oneOf([
    "primary",
    "secondary",
    "outline",
    "danger",
    "success",
    "link",
  ]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(["left", "right"]),
};

export default Button;
