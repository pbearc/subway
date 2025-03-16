// src/components/chatbot/SuggestionPills.jsx

import React from "react";
import PropTypes from "prop-types";

/**
 * Renders a set of suggestion pills for the chatbot
 */
const SuggestionPills = ({ suggestions, onSuggestionClick }) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="chatbot-suggestions flex flex-wrap gap-2">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          className="suggestion-pill text-xs md:text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
          onClick={() => onSuggestionClick(suggestion)}
          type="button"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

SuggestionPills.propTypes = {
  suggestions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSuggestionClick: PropTypes.func.isRequired,
};

export default SuggestionPills;
