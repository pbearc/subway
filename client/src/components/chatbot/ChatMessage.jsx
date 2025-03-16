// src/components/chatbot/ChatMessage.jsx

import React from "react";
import PropTypes from "prop-types";

const ChatMessage = ({ message, onOutletSelect }) => {
  const { role, content, outlets } = message;

  return (
    <div className={`chatbot-message ${role}`}>
      <div className="message-content">{content}</div>

      {outlets && outlets.length > 0 && (
        <div className="outlet-suggestions bg-gray-50 rounded-md p-2 mt-2">
          <h4 className="text-xs font-medium text-gray-700 mb-1">
            Related Outlets:
          </h4>
          <ul>
            {outlets.slice(0, 3).map((outlet) => (
              <li
                key={outlet.id}
                onClick={() => onOutletSelect(outlet)}
                className="outlet-suggestion-item text-sm py-1 px-2 hover:bg-gray-200 rounded cursor-pointer flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 mr-1 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {outlet.name}
              </li>
            ))}
            {outlets.length > 3 && (
              <li className="more-outlets text-xs text-gray-500 mt-1 pl-2">
                +{outlets.length - 3} more outlets
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

ChatMessage.propTypes = {
  message: PropTypes.shape({
    role: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    outlets: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        name: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,
  onOutletSelect: PropTypes.func.isRequired,
};

export default ChatMessage;
