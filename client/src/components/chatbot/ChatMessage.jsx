// src/components/chatbot/ChatMessage.jsx

import React from "react";
import PropTypes from "prop-types";
import Icon from "../common/Icon";
import ReactMarkdown from "react-markdown";

const ChatMessage = ({ message, onOutletSelect }) => {
  const { role, content, outlets } = message;
  const isUser = role === "user";

  return (
    <div
      className={`clear-both mb-2 ${
        isUser
          ? "float-right bg-blue-50 rounded-lg rounded-br-none"
          : "float-left bg-white border border-gray-200 rounded-lg rounded-bl-none"
      } p-3 max-w-[85%]`}
    >
      {isUser ? (
        <div className="text-sm leading-relaxed break-words">{content}</div>
      ) : (
        <div className="text-sm leading-relaxed chatbot-message">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}

      {outlets?.length > 0 && (
        <div className="mt-2 bg-gray-50 rounded p-2 text-xs">
          <h4 className="font-medium text-gray-700 mb-1 text-xs">
            Related Outlets:
          </h4>
          <ul className="space-y-1">
            {outlets.slice(0, 3).map((outlet) => (
              <li
                key={outlet.id}
                onClick={() => onOutletSelect(outlet)}
                className="py-1 px-2 hover:bg-gray-200 rounded cursor-pointer flex items-center"
              >
                <Icon
                  name="location"
                  size={3}
                  className="mr-1 text-green-600"
                />
                {outlet.name}
              </li>
            ))}
            {outlets.length > 3 && (
              <li className="mt-1 pl-2 text-gray-500 text-xs">
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
