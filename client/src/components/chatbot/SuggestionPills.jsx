// src/components/chatbot/SuggestionPills.jsx

import React from "react";
import PropTypes from "prop-types";

const SuggestionPills = ({ suggestions, onSuggestionClick }) => {
  if (!suggestions?.length) return null;

  return (
    <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          className="text-xs md:text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full whitespace-nowrap overflow-hidden text-ellipsis max-w-full transition-colors text-gray-700"
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
