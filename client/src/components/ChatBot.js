import React, { useState, useRef, useEffect } from "react";
import api from "../services/api";

const ChatBot = ({ onOutletSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I can help you find information about Subway outlets in Kuala Lumpur. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input and set loading
    const userQuery = input; // Save the input before clearing
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
            <button
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              &times;
            </button>
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

          <form className="chatbot-input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Subway outlets..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
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
    </>
  );
};

export default ChatBot;
