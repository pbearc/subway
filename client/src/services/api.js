import axios from "axios";

// Change this to match your actual API URL
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

const api = {
  // Get all outlets
  getAllOutlets: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/outlets`);
      return response.data;
    } catch (error) {
      console.error("Error fetching outlets:", error);
      throw error;
    }
  },

  // Get a specific outlet by ID
  getOutlet: async (outletId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/outlets/${outletId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching outlet with ID ${outletId}:`, error);
      throw error;
    }
  },

  // Get operating hours for a specific outlet
  getOutletOperatingHours: async (outletId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/outlets/${outletId}/operating-hours`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching operating hours for outlet ID ${outletId}:`,
        error
      );
      throw error;
    }
  },

  // Search outlets by name or address
  searchOutlets: async (query) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/outlets/search?query=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      console.error("Error searching outlets:", error);
      throw error;
    }
  },

  // Find outlets near a location
  getNearbyOutlets: async (latitude, longitude, radius = 5.0) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/outlets/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching nearby outlets:", error);
      throw error;
    }
  },

  // Query the chatbot with a question (including session support)
  queryChatbot: async (query, sessionId = null) => {
    try {
      const queryParams = new URLSearchParams({
        q: query,
      });

      if (sessionId) {
        queryParams.append("session_id", sessionId);
      }

      const response = await axios.get(
        `${API_BASE_URL}/chatbot/query?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error querying chatbot:", error);
      throw error;
    }
  },

  // Delete a chat session
  deleteChatSession: async (sessionId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/chatbot/session/${sessionId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting chat session:", error);
      throw error;
    }
  },
};

export default api;
