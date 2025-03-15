// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // Remove StrictMode temporarily as it causes double rendering in development
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);
