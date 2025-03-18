// src/hooks/useSuggestions.js

import { useState, useCallback } from "react";

/**
 * Custom hook for managing chatbot suggestions
 *
 * @param {Array} defaultSuggestions - Initial suggestion set
 * @param {Array} messages - Chat messages for context generation
 * @returns {Object} Suggestion management functions and state
 */
export const useSuggestions = (defaultSuggestions, messages) => {
  const [suggestions, setSuggestions] = useState(defaultSuggestions);

  // Generate context-aware suggestions based on conversation
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

  // Reset suggestions to default
  const resetSuggestions = useCallback(() => {
    setSuggestions(defaultSuggestions);
  }, [defaultSuggestions]);

  return {
    suggestions,
    generateNewSuggestions,
    resetSuggestions,
  };
};
