// src/components/layout/Footer.jsx

import React from "react";

/**
 * Footer component for the application
 */
const Footer = () => {
  return (
    <footer className="app-footer">
      <p>Subway Outlet Mapping Project &copy; {new Date().getFullYear()}</p>
    </footer>
  );
};

export default Footer;
