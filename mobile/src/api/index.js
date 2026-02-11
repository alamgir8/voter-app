import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Change this to your backend URL
const API_BASE_URL = "http://192.168.0.237:5056/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // SecureStore might not be available in some environments
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("authToken");
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/change-password", data),
};

// Center API
export const centerAPI = {
  getAll: (params) => api.get("/centers", { params }),
  getById: (id) => api.get(`/centers/${id}`),
  create: (data) => api.post("/centers", data),
  update: (id, data) => api.put(`/centers/${id}`, data),
  delete: (id) => api.delete(`/centers/${id}`),
  getStats: (id) => api.get(`/centers/${id}/stats`),
};

// Voter API
export const voterAPI = {
  create: (data) => api.post("/voters", data),
  getByCenter: (centerId, params) =>
    api.get(`/voters/center/${centerId}`, { params }),
  getById: (id) => api.get(`/voters/${id}`),
  update: (id, data) => api.put(`/voters/${id}`, data),
  delete: (id) => api.delete(`/voters/${id}`),
  bulkCreate: (data) => api.post("/voters/bulk", data),
  deleteAllByCenter: (centerId) => api.delete(`/voters/center/${centerId}`),
};

// Search API
export const searchAPI = {
  search: (params) => api.get("/search", { params }),
  autoSearch: (params) => api.get("/search/auto", { params }),
  advancedSearch: (data) => api.post("/search/advanced", data),
};

// Import API
export const importAPI = {
  uploadPdf: (formData) =>
    api.post("/import/pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 600000,
    }),
  getStatus: (jobId) => api.get(`/import/status/${jobId}`),
  saveImported: (data) => api.post("/import/save", data),
  importManual: (data) => api.post("/import/manual", data),
};

// Export API
export const exportAPI = {
  voterPdf: (id) =>
    api.get(`/export/voter/${id}`, { responseType: "arraybuffer" }),
  centerPdf: (centerId) =>
    api.get(`/export/center/${centerId}`, { responseType: "arraybuffer" }),
};

// Location API
export const locationAPI = {
  getDivisions: () => api.get("/locations/divisions"),
  getDistricts: (division) =>
    api.get(`/locations/districts/${encodeURIComponent(division)}`),
  getUpazilas: (district) =>
    api.get(`/locations/upazilas/${encodeURIComponent(district)}`),
  getAll: () => api.get("/locations/all"),
};

export default api;
