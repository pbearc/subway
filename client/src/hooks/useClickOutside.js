// src/hooks/useClickOutside.js

import { useEffect, useRef } from "react";

/**
 * Hook that handles clicks outside of the specified element
 * @param {Function} handler - Callback function to run when a click outside occurs
 * @param {boolean} enabled - Whether the click outside detection is enabled
 * @returns {React.RefObject} - Ref to attach to the element
 */
const useClickOutside = (handler, enabled = true) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler(event);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [handler, enabled]);

  return ref;
};

export default useClickOutside;
