// src/services/api.js

import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("API Error:", error);
    throw error;
  }
);

const api = {
  getAllOutlets: async () => {
    return apiClient.get("/outlets");
  },

  getOutlet: async (outletId) => {
    return apiClient.get(`/outlets/${outletId}`);
  },

  getOutletOperatingHours: async (outletId) => {
    return apiClient.get(`/outlets/${outletId}/operating-hours`);
  },

  searchOutlets: async (query) => {
    return apiClient.get(`/outlets/search?query=${encodeURIComponent(query)}`);
  },

  getNearbyOutlets: async (latitude, longitude, radius = 5.0) => {
    return apiClient.get(`/outlets/nearby`, {
      params: { latitude, longitude, radius },
    });
  },

  queryChatbot: async (query, sessionId = null) => {
    const params = { q: query };
    if (sessionId) params.session_id = sessionId;

    return apiClient.get(`/chatbot/query`, { params });
  },

  deleteChatSession: async (sessionId) => {
    return apiClient.delete(`/chatbot/session/${sessionId}`);
  },
};

export default api;
