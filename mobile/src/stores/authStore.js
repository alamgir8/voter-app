import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { authAPI } from "../api";

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Initialize auth state from storage
  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const userStr = await SecureStore.getItemAsync("userData");

      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true });
      }
    } catch (e) {
      console.log("Auth init error:", e);
    }
  },

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      const { data } = response.data;

      await SecureStore.setItemAsync("authToken", data.token);
      await SecureStore.setItemAsync("userData", JSON.stringify(data));

      set({
        user: data,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "লগইন ব্যর্থ হয়েছে";
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  // Register
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(userData);
      const { data } = response.data;

      await SecureStore.setItemAsync("authToken", data.token);
      await SecureStore.setItemAsync("userData", JSON.stringify(data));

      set({
        user: data,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "রেজিস্ট্রেশন ব্যর্থ হয়েছে";
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  // Logout
  logout: async () => {
    try {
      await SecureStore.deleteItemAsync("authToken");
      await SecureStore.deleteItemAsync("userData");
    } catch (e) {
      console.log("Logout error:", e);
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // Update profile
  updateProfile: async (data) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = { ...get().user, ...response.data.data };
      await SecureStore.setItemAsync("userData", JSON.stringify(updatedUser));
      set({ user: updatedUser, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || "আপডেট ব্যর্থ",
      };
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
