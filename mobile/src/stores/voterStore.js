import { create } from "zustand";
import { voterAPI, searchAPI, importAPI } from "../api";

const useVoterStore = create((set, get) => ({
  voters: [],
  selectedVoter: null,
  searchResults: [],
  autoResults: [],
  importedVoters: [],
  isLoading: false,
  isSearching: false,
  isImporting: false,
  error: null,
  pagination: null,
  searchPagination: null,

  // Fetch voters by center
  fetchVoters: async (centerId, params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await voterAPI.getByCenter(centerId, params);
      set({
        voters: response.data.data,
        pagination: response.data.pagination,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "ভোটার লোড ব্যর্থ",
      });
    }
  },

  // Create voter
  createVoter: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await voterAPI.create(data);
      set((state) => ({
        voters: [...state.voters, response.data.data],
        isLoading: false,
      }));
      return { success: true, data: response.data.data };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || "ভোটার যোগ ব্যর্থ",
      };
    }
  },

  // Update voter
  updateVoter: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await voterAPI.update(id, data);
      set((state) => ({
        voters: state.voters.map((v) =>
          v._id === id ? response.data.data : v,
        ),
        selectedVoter:
          state.selectedVoter?._id === id
            ? response.data.data
            : state.selectedVoter,
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

  // Delete voter
  deleteVoter: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await voterAPI.delete(id);
      set((state) => ({
        voters: state.voters.filter((v) => v._id !== id),
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

  // Quick search (auto-complete)
  autoSearch: async (query, centerId) => {
    if (!query || query.trim().length < 1) {
      set({ autoResults: [] });
      return;
    }
    set({ isSearching: true });
    try {
      const params = { q: query };
      if (centerId) params.centerId = centerId;
      const response = await searchAPI.autoSearch(params);
      set({ autoResults: response.data.data, isSearching: false });
    } catch (error) {
      set({ isSearching: false, autoResults: [] });
    }
  },

  // Full search
  searchVoters: async (params) => {
    set({ isSearching: true, error: null });
    try {
      const response = await searchAPI.search(params);
      set({
        searchResults: response.data.data,
        searchPagination: response.data.pagination,
        isSearching: false,
      });
    } catch (error) {
      set({
        isSearching: false,
        error: error.response?.data?.message || "সার্চ ব্যর্থ",
      });
    }
  },

  // Advanced search
  advancedSearch: async (data) => {
    set({ isSearching: true, error: null });
    try {
      const response = await searchAPI.advancedSearch(data);
      set({
        searchResults: response.data.data,
        searchPagination: response.data.pagination,
        isSearching: false,
      });
    } catch (error) {
      set({
        isSearching: false,
        error: error.response?.data?.message || "সার্চ ব্যর্থ",
      });
    }
  },

  // Import PDF
  importPdf: async (formData) => {
    set({ isImporting: true, error: null });
    try {
      const response = await importAPI.uploadPdf(formData);
      set({
        importedVoters: response.data.data.voters,
        isImporting: false,
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      set({ isImporting: false });
      return {
        success: false,
        message: error.response?.data?.message || "PDF ইম্পোর্ট ব্যর্থ",
        rawText: error.response?.data?.rawText,
      };
    }
  },

  // Save imported voters
  saveImportedVoters: async (centerId, voters) => {
    set({ isImporting: true, error: null });
    try {
      const response = await importAPI.saveImported({ centerId, voters });
      set({ importedVoters: [], isImporting: false });
      return { success: true, data: response.data.data };
    } catch (error) {
      set({ isImporting: false });
      return {
        success: false,
        message: error.response?.data?.message || "সংরক্ষণ ব্যর্থ",
      };
    }
  },

  // Bulk create
  bulkCreate: async (centerId, voters) => {
    set({ isLoading: true, error: null });
    try {
      const response = await voterAPI.bulkCreate({ centerId, voters });
      set({ isLoading: false });
      return { success: true, data: response.data.data };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || "বাল্ক তৈরি ব্যর্থ",
      };
    }
  },

  // Get voter details
  getVoterDetails: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await voterAPI.getById(id);
      set({ selectedVoter: response.data.data, isLoading: false });
      return response.data.data;
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "তথ্য লোড ব্যর্থ",
      });
      return null;
    }
  },

  setSelectedVoter: (voter) => set({ selectedVoter: voter }),
  clearSearch: () =>
    set({ searchResults: [], autoResults: [], searchPagination: null }),
  clearImported: () => set({ importedVoters: [] }),
  clearError: () => set({ error: null }),
}));

export default useVoterStore;
