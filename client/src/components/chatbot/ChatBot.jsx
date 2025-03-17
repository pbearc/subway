// src/components/chatbot/ChatBot.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import api from "../../services/api";
import ChatMessage from "./ChatMessage";
import SuggestionPills from "./SuggestionPills";
import Icon from "../common/Icon";
import useClickOutside from "../../hooks/useClickOutside";

const DEFAULT_WELCOME_MESSAGE =
  "Hello! I can help you find Subway outlets in KL, including their locations and opening hours. Just ask!";

const DEFAULT_SUGGESTIONS = [
  "Which Subway outlets are in Bangsar?",
  "Is Subway KLCC open on Sundays?",
  "Which outlet closes the latest?",
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

  // Use the custom hook for the chat window
  const chatWindowRef = useClickOutside(() => {
    if (isOpen) setIsOpen(false);
  }, false); // Disabled by default, enable based on UI needs

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
        "How to navigate to Subway Monash Outlet?",
        "How many Subway outlets are there in Bangsar area?",
        "Is Subway KLCC open on Sundays?",
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
          className="fixed bottom-5 right-5 w-12 h-12 rounded-full bg-green-600 text-white border-none shadow-md flex items-center justify-center text-2xl z-50 hover:scale-105 transition-transform focus:outline-none"
          onClick={() => setIsOpen(true)}
          aria-label="Chat with bot"
        >
          🤖
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed bottom-5 right-5 w-[90vw] h-[500px] sm:w-96 sm:h-[600px] md:h-[700px] lg:h-[800px] max-w-[90vw] max-h-[80vh] sm:max-h-[80vh] min-w-[300px] min-h-[400px] rounded-lg shadow-lg flex flex-col bg-white z-40 overflow-hidden resize"
          ref={chatWindowRef}
        >
          <div className="flex justify-between items-center p-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center">
              <span className="mr-2 text-base">🤖</span>
              <h3 className="text-sm font-semibold text-gray-700 m-0">
                Subway Assistant
              </h3>
            </div>
            <div className="flex items-center">
              <button
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none ml-1"
                onClick={clearChat}
                aria-label="Clear chat"
              >
                <Icon name="trash" size={4} />
              </button>
              <button
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none ml-1"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <Icon name="close" size={4} />
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
            {messages.map((msg, index) => (
              <ChatMessage
                key={index}
                message={msg}
                onOutletSelect={onOutletSelect}
              />
            ))}

            {isLoading && (
              <div className="float-left clear-both bg-white border border-gray-200 rounded-lg rounded-bl-none p-3 max-w-[85%]">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Dynamic suggestions */}
          <div className="p-2 border-t border-gray-200 bg-white">
            <SuggestionPills
              suggestions={suggestions}
              onSuggestionClick={handleSuggestionClick}
            />
          </div>

          <form
            className="flex p-2 border-t border-gray-200 bg-white"
            onSubmit={handleSubmit}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Subway outlets..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 border border-gray-300 border-r-0 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-sm disabled:bg-gray-100"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-3 py-2 bg-green-600 text-white rounded-r-lg disabled:bg-gray-300 hover:bg-green-700"
            >
              <Icon name="send" size={4} />
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
