import { create } from "zustand";
import { centerAPI } from "../api";

const useCenterStore = create((set, get) => ({
  centers: [],
  selectedCenter: null,
  isLoading: false,
  error: null,
  pagination: null,

  // Fetch all centers
  fetchCenters: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await centerAPI.getAll(params);
      set({
        centers: response.data.data,
        pagination: response.data.pagination,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "কেন্দ্র লোড ব্যর্থ",
      });
    }
  },

  // Fetch single center
  fetchCenter: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await centerAPI.getById(id);
      set({ selectedCenter: response.data.data, isLoading: false });
      return response.data.data;
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "কেন্দ্র পাওয়া যায়নি",
      });
      return null;
    }
  },

  // Create center
  createCenter: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await centerAPI.create(data);
      set((state) => ({
        centers: [response.data.data, ...state.centers],
        isLoading: false,
      }));
      return { success: true, data: response.data.data };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || "কেন্দ্র তৈরি ব্যর্থ",
      };
    }
  },

  // Update center
  updateCenter: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await centerAPI.update(id, data);
      set((state) => ({
        centers: state.centers.map((c) =>
          c._id === id ? response.data.data : c,
        ),
        selectedCenter:
          state.selectedCenter?._id === id
            ? response.data.data
            : state.selectedCenter,
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || "আপডেট ব্যর্থ",
      };
    }
  },

  // Delete center
  deleteCenter: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await centerAPI.delete(id);
      set((state) => ({
        centers: state.centers.filter((c) => c._id !== id),
        selectedCenter:
          state.selectedCenter?._id === id ? null : state.selectedCenter,
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || "মুছে ফেলা ব্যর্থ",
      };
    }
  },

  setSelectedCenter: (center) => set({ selectedCenter: center }),
  clearError: () => set({ error: null }),
}));

export default useCenterStore;
