// src/components/chatbot/ChatBot.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import api from "../../services/api";
import "../../styles/ChatBot.css";
import ChatMessage from "./ChatMessage";
import SuggestionPills from "./SuggestionPills";

const DEFAULT_WELCOME_MESSAGE =
  "Hello! I can help you find information about Subway outlets in Kuala Lumpur. You can ask me about locations, opening hours, or even questions like 'Which outlet closes the latest?' or 'How many outlets are in Bangsar?'";

const DEFAULT_SUGGESTIONS = [
  "Which Subway outlets are in Bangsar?",
  "Is Subway KLCC open on Sundays?",
  "Which outlet closes the latest?",
  "How many Subway outlets are in KL?",
];

const ChatBot = ({ onOutletSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: DEFAULT_WELCOME_MESSAGE,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Generate new context-aware suggestions based on conversation
  useEffect(() => {
    if (messages.length > 1) {
      generateNewSuggestions();
    }
  }, [messages]);

  // Generate new suggestions based on conversation context
  const generateNewSuggestions = useCallback(() => {
    // Last user message
    const lastUserMessage =
      [...messages].reverse().find((m) => m.role === "user")?.content || "";

    // Last assistant message
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");

    // Check if there are outlets in the last response
    const mentionedOutlet = lastAssistantMessage?.outlets?.[0]?.name;

    // New suggestions based on context
    let newSuggestions = [];

    if (mentionedOutlet) {
      newSuggestions = [
        `What are the operating hours for ${mentionedOutlet}?`,
        `Where exactly is ${mentionedOutlet} located?`,
        `Is ${mentionedOutlet} open on weekends?`,
      ];
    } else if (
      lastUserMessage.toLowerCase().includes("open") ||
      lastUserMessage.toLowerCase().includes("hour")
    ) {
      newSuggestions = [
        "Which outlet is open the latest?",
        "Are there any 24-hour Subway outlets?",
        "Which outlets are open on Sundays?",
      ];
    } else if (
      lastUserMessage.toLowerCase().includes("where") ||
      lastUserMessage.toLowerCase().includes("location")
    ) {
      newSuggestions = [
        "How many outlets are in Kuala Lumpur?",
        "Which outlet is closest to KLCC?",
        "Are there any Subway outlets in Bangsar?",
      ];
    } else {
      // Default suggestions
      newSuggestions = [
        "Which Subway outlet is closest to me?",
        "What are the busiest Subway locations?",
        "Tell me about Subway outlets in KL",
        "Which outlet has the best reviews?",
      ];
    }

    setSuggestions(newSuggestions);
  }, [messages]);

  // Handle suggestion click - uses the suggestion as input
  const handleSuggestionClick = useCallback((suggestion) => {
    setInput(suggestion);
    // Automatically submit
    handleSubmit({ preventDefault: () => {} }, suggestion);
  }, []);

  // Handle form submission for chat
  const handleSubmit = useCallback(
    async (e, suggestedInput = null) => {
      e.preventDefault();

      const userQuery = suggestedInput || input;
      if (!userQuery.trim()) return;

      // Add user message
      const userMessage = { role: "user", content: userQuery };
      setMessages((prev) => [...prev, userMessage]);

      // Clear input and set loading
      setInput("");
      setIsLoading(true);

      try {
        // Call the chatbot API
        const response = await api.queryChatbot(userQuery, sessionId);

        // Add assistant message
        const assistantMessage = {
          role: "assistant",
          content: response.answer,
          outlets: response.relevant_outlets,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Store the session ID for continued conversation
        if (response.session_id) {
          setSessionId(response.session_id);
        }

        // If there are relevant outlets, select the first one
        if (response.relevant_outlets && response.relevant_outlets.length > 0) {
          onOutletSelect(response.relevant_outlets[0]);
        }
      } catch (error) {
        console.error("Error querying chatbot:", error);
        // Add error message
        const errorMessage = {
          role: "assistant",
          content:
            "Sorry, I encountered an error while processing your request. Please try again.",
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, sessionId, onOutletSelect]
  );

  // Reset chat to initial state
  const clearChat = useCallback(() => {
    if (sessionId) {
      // Delete the session on the server
      api
        .deleteChatSession(sessionId)
        .catch((error) => console.error("Error deleting session:", error));
    }

    // Reset chat state
    setMessages([
      {
        role: "assistant",
        content: DEFAULT_WELCOME_MESSAGE,
      },
    ]);
    setSessionId(null);
    setSuggestions(DEFAULT_SUGGESTIONS);
  }, [sessionId]);

  return (
    <>
      {/* Chat button with robot emoji - Only show when chat is closed */}
      {!isOpen && (
        <button
          className="chatbot-button"
          onClick={() => setIsOpen(true)}
          aria-label="Chat with bot"
        >
          🤖
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <span className="chatbot-emoji">🤖</span>
              <h3>Subway Assistant</h3>
            </div>
            <div className="chatbot-actions">
              <button
                className="clear-chat-button"
                onClick={clearChat}
                aria-label="Clear chat"
              >
                <span className="clear-icon">🗑️</span>
              </button>
              <button
                className="chatbot-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                &times;
              </button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <ChatMessage
                key={index}
                message={msg}
                onOutletSelect={onOutletSelect}
              />
            ))}

            {isLoading && (
              <div className="chatbot-message assistant loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Dynamic suggestions */}
          <div className="chatbot-suggestions-container">
            <SuggestionPills
              suggestions={suggestions}
              onSuggestionClick={handleSuggestionClick}
            />
          </div>

          <form className="chatbot-input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Subway outlets..."
              disabled={isLoading}
              className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-1 focus:ring-green-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 bg-green-600 text-white rounded-r-lg disabled:bg-gray-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

ChatBot.propTypes = {
  onOutletSelect: PropTypes.func.isRequired,
};

export default ChatBot;
