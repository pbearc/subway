import React, { useState, useRef, useEffect } from "react";
import api from "../services/api";

const ChatBot = ({ onOutletSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I can help you find information about Subway outlets in Kuala Lumpur. You can ask me about locations, opening hours, or even questions like 'Which outlet closes the latest?' or 'How many outlets are in Bangsar?'",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [suggestions, setSuggestions] = useState([
    "Which Subway outlets are in Bangsar?",
    "Is Subway KLCC open on Sundays?",
    "Which outlet closes the latest?",
    "How many Subway outlets are in KL?",
  ]);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate new suggestions based on conversation
  useEffect(() => {
    if (messages.length > 1) {
      generateNewSuggestions();
    }
  }, [messages]);

  const generateNewSuggestions = () => {
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
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    // Optional: automatically submit
    handleSubmit({ preventDefault: () => {} }, suggestion);
  };

  const handleSubmit = async (e, suggestedInput = null) => {
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
  };

  const clearChat = () => {
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
        content:
          "Hello! I can help you find information about Subway outlets in Kuala Lumpur. What would you like to know?",
      },
    ]);
    setSessionId(null);
    setSuggestions([
      "Which Subway outlets are in Bangsar?",
      "Is Subway KLCC open on Sundays?",
      "Which outlet closes the latest?",
      "How many Subway outlets are in KL?",
    ]);
  };

  return (
    <>
      {/* Chat button with robot emoji */}
      <button
        className={`chatbot-button ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chat with bot"
      >
        {isOpen ? "✕" : "🤖"}
      </button>

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
              <div key={index} className={`chatbot-message ${msg.role}`}>
                <div className="message-content">{msg.content}</div>

                {msg.outlets && msg.outlets.length > 0 && (
                  <div className="outlet-suggestions">
                    <h4>Related Outlets:</h4>
                    <ul>
                      {msg.outlets.slice(0, 3).map((outlet) => (
                        <li
                          key={outlet.id}
                          onClick={() => onOutletSelect(outlet)}
                          className="outlet-suggestion-item"
                        >
                          {outlet.name}
                        </li>
                      ))}
                      {msg.outlets.length > 3 && (
                        <li className="more-outlets">
                          +{msg.outlets.length - 3} more outlets
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
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
          <div className="chatbot-suggestions">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-pill"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form className="chatbot-input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Subway outlets..."
              disabled={isLoading}
              autoFocus
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Additional CSS */}
      <style jsx>{`
        /* Add these styles to your CSS */
        .chatbot-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 10px;
          border-top: 1px solid #e0e0e0;
        }

        .suggestion-pill {
          background-color: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 16px;
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        .suggestion-pill:hover {
          background-color: #e0e0e0;
          border-color: #ccc;
        }

        .chatbot-actions {
          display: flex;
          align-items: center;
        }

        .clear-chat-button {
          background: none;
          border: none;
          color: #888;
          font-size: 16px;
          cursor: pointer;
          margin-right: 10px;
          padding: 0;
        }

        .clear-chat-button:hover {
          color: #555;
        }

        .clear-icon {
          font-size: 14px;
        }
      `}</style>
    </>
  );
};

export default ChatBot;
