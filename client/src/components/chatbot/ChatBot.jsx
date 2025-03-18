// src/components/chatbot/ChatBot.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import api from "../../services/api";
import ChatMessage from "./ChatMessage";
import SuggestionPills from "./SuggestionPills";
import Icon from "../common/Icon";
import useClickOutside from "../../hooks/useClickOutside";
import { useChatMessages } from "../../hooks/useChatMessages";
import { useSuggestions } from "../../hooks/useSuggestions";

const CONSTANTS = {
  DEFAULT_WELCOME_MESSAGE:
    "Hello! I can help you find Subway outlets in KL, including their locations and opening hours. Just ask!",
  DEFAULT_SUGGESTIONS: [
    "Which Subway outlets are in Bangsar?",
    "Is Subway KLCC open on Sundays?",
    "Which outlet closes the latest?",
  ],
  ERROR_MESSAGE:
    "Sorry, I encountered an error while processing your request. Please try again.",
};

const ChatBot = ({ onOutletSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const {
    messages,
    addUserMessage,
    addAssistantMessage,
    addErrorMessage,
    resetMessages,
  } = useChatMessages(CONSTANTS.DEFAULT_WELCOME_MESSAGE);

  const { suggestions, generateNewSuggestions, resetSuggestions } =
    useSuggestions(CONSTANTS.DEFAULT_SUGGESTIONS, messages);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const chatWindowRef = useClickOutside(
    () => isOpen && setIsOpen(false),
    false
  );

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
    const scrollTimer1 = setTimeout(scrollToBottom, 100);
    const scrollTimer2 = setTimeout(scrollToBottom, 300);

    return () => {
      clearTimeout(scrollTimer1);
      clearTimeout(scrollTimer2);
    };
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (messages.length > 1) {
      generateNewSuggestions();
    }
  }, [messages, generateNewSuggestions]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setInput(suggestion);
    handleSubmit({ preventDefault: () => {} }, suggestion);
  }, []);

  const handleSubmit = useCallback(
    async (e, suggestedInput = null) => {
      e.preventDefault();

      const userQuery = suggestedInput || input;
      if (!userQuery.trim()) return;

      addUserMessage(userQuery);
      setInput("");
      setIsLoading(true);

      try {
        const response = await api.queryChatbot(userQuery, sessionId);
        addAssistantMessage(response.answer, response.relevant_outlets);

        if (response.session_id) {
          setSessionId(response.session_id);
        }

        if (response.relevant_outlets?.length > 0) {
          onOutletSelect(response.relevant_outlets[0]);
        }
      } catch (error) {
        console.error("Error querying chatbot:", error);
        addErrorMessage(CONSTANTS.ERROR_MESSAGE);
      } finally {
        setIsLoading(false);
        setTimeout(scrollToBottom, 100);
      }
    },
    [
      input,
      sessionId,
      onOutletSelect,
      scrollToBottom,
      addUserMessage,
      addAssistantMessage,
      addErrorMessage,
    ]
  );

  const clearChat = useCallback(() => {
    if (sessionId) {
      api
        .deleteChatSession(sessionId)
        .catch((error) => console.error("Error deleting session:", error));
    }

    resetMessages();
    setSessionId(null);
    resetSuggestions();
  }, [sessionId, resetMessages, resetSuggestions]);

  // When chat is closed, show the chat button
  if (!isOpen) {
    return (
      <button
        className="fixed bottom-5 right-5 w-12 h-12 rounded-full bg-green-600 text-white shadow-md flex items-center justify-center text-2xl z-50 hover:scale-105 transition-transform focus:outline-none"
        onClick={() => setIsOpen(true)}
        aria-label="Chat with bot"
      >
        🤖
      </button>
    );
  }

  // Mobile-first approach: full screen on small screens, fixed size on larger screens
  return (
    <div
      className="fixed inset-0 md:inset-auto md:bottom-5 md:right-5 md:w-96 md:h-[600px] md:max-h-[80vh] md:min-w-[300px] md:min-h-[400px] md:rounded-lg shadow-lg flex flex-col bg-white z-50 overflow-hidden"
      ref={chatWindowRef}
    >
      {/* Header with full-width layout */}
      <div className="flex justify-between items-center p-3 bg-green-600 text-white">
        <div className="flex items-center">
          <span className="mr-2 text-lg">🤖</span>
          <h3 className="text-base font-semibold m-0">Subway Assistant</h3>
        </div>
        <div className="flex items-center">
          <button
            className="p-2 text-white bg-green-700 hover:bg-green-800 rounded-full focus:outline-none ml-1"
            onClick={clearChat}
            aria-label="Clear chat"
          >
            <Icon name="trash" size={5} />
          </button>
          <button
            className="p-2 text-white bg-green-700 hover:bg-green-800 rounded-full focus:outline-none ml-1"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            <Icon name="close" size={5} />
          </button>
        </div>
      </div>

      {/* Messages area with full height consideration */}
      <div
        className="flex-1 p-4 overflow-y-auto bg-gray-50"
        ref={messagesContainerRef}
      >
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

        <div
          ref={messagesEndRef}
          className="float-left clear-both w-full h-[1px]"
        />
      </div>

      {/* Suggestions area */}
      <div className="p-2 border-t border-gray-200 bg-white">
        <SuggestionPills
          suggestions={suggestions}
          onSuggestionClick={handleSuggestionClick}
        />
      </div>

      {/* Input area with mobile-friendly sizing */}
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
          className="flex-1 px-3 py-3 border border-gray-300 border-r-0 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-sm disabled:bg-gray-100"
          autoFocus
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-3 bg-green-600 text-white rounded-r-lg disabled:bg-gray-300 hover:bg-green-700"
        >
          <Icon name="send" size={5} />
        </button>
      </form>
    </div>
  );
};

ChatBot.propTypes = {
  onOutletSelect: PropTypes.func.isRequired,
};

export default ChatBot;
