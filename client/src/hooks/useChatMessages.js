// src/hooks/useChatMessages.js

import { useState, useCallback } from "react";

/**
 * Custom hook for managing chat messages
 *
 * @param {string} initialMessage - The welcome message to display
 * @returns {Object} Chat message management functions and state
 */
export const useChatMessages = (initialMessage) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: initialMessage,
    },
  ]);

  // Add a user message to the chat
  const addUserMessage = useCallback((content) => {
    setMessages((prev) => [...prev, { role: "user", content }]);
  }, []);

  // Add an assistant message to the chat
  const addAssistantMessage = useCallback((content, outlets = null) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content,
        outlets,
      },
    ]);
  }, []);

  // Add an error message from the assistant
  const addErrorMessage = useCallback((errorText) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: errorText,
      },
    ]);
  }, []);

  // Reset messages to initial state
  const resetMessages = useCallback(() => {
    setMessages([
      {
        role: "assistant",
        content: initialMessage,
      },
    ]);
  }, [initialMessage]);

  return {
    messages,
    addUserMessage,
    addAssistantMessage,
    addErrorMessage,
    resetMessages,
  };
};
