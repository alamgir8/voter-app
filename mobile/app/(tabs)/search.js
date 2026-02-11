import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import useVoterStore from "../../src/stores/voterStore";
import useCenterStore from "../../src/stores/centerStore";
import VoterCard from "../../src/components/VoterCard";
import VoterDetailModal from "../../src/components/VoterDetailModal";
import { EmptyState } from "../../src/components/Common";
import Select from "../../src/components/Select";
import { exportAPI } from "../../src/api";

export default function SearchScreen() {
  const {
    searchResults,
    autoResults,
    isSearching,
    searchVoters,
    autoSearch,
    clearSearch,
    getVoterDetails,
    selectedVoter,
    setSelectedVoter,
    searchPagination,
  } = useVoterStore();
  const { centers, fetchCenters } = useCenterStore();

  const [query, setQuery] = useState("");
  const [selectedCenter, setSelectedCenter] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    name: "",
    fatherName: "",
    voterNo: "",
    nid: "",
    dateOfBirth: "",
    address: "",
  });
  const [debounceTimer, setDebounceTimer] = useState(null);

  useEffect(() => {
    fetchCenters();
    return () => clearSearch();
  }, []);

  // Debounced auto-search
  const handleSearchChange = useCallback(
    (text) => {
      setQuery(text);
      if (debounceTimer) clearTimeout(debounceTimer);

      const timer = setTimeout(() => {
        if (text.trim().length >= 1) {
          autoSearch(text.trim(), selectedCenter || undefined);
        } else {
          clearSearch();
        }
      }, 300);

      setDebounceTimer(timer);
    },
    [selectedCenter, debounceTimer],
  );

  // Full search
  const handleSearch = () => {
    if (showAdvanced) {
      searchVoters({
        ...advancedFilters,
        centerId: selectedCenter || undefined,
      });
    } else if (query.trim()) {
      searchVoters({
        q: query.trim(),
        centerId: selectedCenter || undefined,
      });
    }
  };

  // Handle voter select
  const handleVoterPress = async (voter) => {
    const details = await getVoterDetails(voter._id);
    if (details) {
      setShowDetailModal(true);
    }
  };

  // Export PDF
  const handleExportPdf = async (voterId) => {
    try {
      const response = await exportAPI.voterPdf(voterId);
      const fileUri = FileSystem.documentDirectory + `voter-${voterId}.pdf`;
      await FileSystem.writeAsStringAsync(
        fileUri,
        btoa(
          new Uint8Array(response.data).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            "",
          ),
        ),
        { encoding: FileSystem.EncodingType.Base64 },
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("সফল", "PDF ফাইল সংরক্ষিত হয়েছে");
      }
    } catch (error) {
      Alert.alert("ব্যর্থ", "PDF ডাউনলোড করা যায়নি");
    }
  };

  const centerOptions = centers.map((c) => ({
    label: c.centerName,
    value: c._id,
  }));

  const displayResults =
    query.trim() && autoResults.length > 0 && searchResults.length === 0
      ? autoResults
      : searchResults;

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      {/* Header */}
      <View className="bg-white px-5 pt-4 pb-3 border-b border-dark-100">
        <Text className="text-xl font-bold text-dark-800 mb-3">
          <Ionicons name="search" size={22} /> ভোটার সার্চ
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-dark-50 rounded-xl border-2 border-dark-200 mb-3">
          <View className="pl-3">
            <Ionicons name="search" size={20} color="#64748b" />
          </View>
          <TextInput
            className="flex-1 px-3 py-3 text-dark-900 text-base"
            placeholder="নাম, ভোটার নং, NID, ঠিকানা..."
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                clearSearch();
              }}
              className="pr-3"
            >
              <Ionicons name="close-circle" size={22} color="#94a3b8" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleSearch}
            className="bg-blue-500 rounded-r-xl px-4 py-3"
          >
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Center Filter & Advanced Toggle */}
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <Select
              placeholder="সব কেন্দ্র"
              value={selectedCenter}
              options={[{ label: "সকল কেন্দ্র", value: "" }, ...centerOptions]}
              onSelect={setSelectedCenter}
              className="mb-0"
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-3 rounded-xl border-2 ${
              showAdvanced
                ? "bg-blue-500 border-emerald-500"
                : "border-dark-200 bg-dark-50"
            }`}
          >
            <Ionicons
              name="options"
              size={20}
              color={showAdvanced ? "white" : "#64748b"}
            />
          </TouchableOpacity>
        </View>

        {/* Advanced Filters */}
        {showAdvanced && (
          <View className="mt-3 bg-dark-50 rounded-xl p-3 border border-dark-200">
            <Text className="text-dark-600 font-semibold text-sm mb-2">
              বিস্তারিত সার্চ
            </Text>
            <View className="flex-row gap-2 mb-2">
              <TextInput
                className="flex-1 bg-white rounded-lg px-3 py-2 text-sm border border-dark-200"
                placeholder="নাম"
                placeholderTextColor="#94a3b8"
                value={advancedFilters.name}
                onChangeText={(v) =>
                  setAdvancedFilters({ ...advancedFilters, name: v })
                }
              />
              <TextInput
                className="flex-1 bg-white rounded-lg px-3 py-2 text-sm border border-dark-200"
                placeholder="পিতার নাম"
                placeholderTextColor="#94a3b8"
                value={advancedFilters.fatherName}
                onChangeText={(v) =>
                  setAdvancedFilters({ ...advancedFilters, fatherName: v })
                }
              />
            </View>
            <View className="flex-row gap-2 mb-2">
              <TextInput
                className="flex-1 bg-white rounded-lg px-3 py-2 text-sm border border-dark-200"
                placeholder="ভোটার নং"
                placeholderTextColor="#94a3b8"
                value={advancedFilters.voterNo}
                onChangeText={(v) =>
                  setAdvancedFilters({ ...advancedFilters, voterNo: v })
                }
              />
              <TextInput
                className="flex-1 bg-white rounded-lg px-3 py-2 text-sm border border-dark-200"
                placeholder="NID"
                placeholderTextColor="#94a3b8"
                value={advancedFilters.nid}
                onChangeText={(v) =>
                  setAdvancedFilters({ ...advancedFilters, nid: v })
                }
              />
            </View>
            <View className="flex-row gap-2 mb-2">
              <TextInput
                className="flex-1 bg-white rounded-lg px-3 py-2 text-sm border border-dark-200"
                placeholder="জন্ম তারিখ"
                placeholderTextColor="#94a3b8"
                value={advancedFilters.dateOfBirth}
                onChangeText={(v) =>
                  setAdvancedFilters({ ...advancedFilters, dateOfBirth: v })
                }
              />
              <TextInput
                className="flex-1 bg-white rounded-lg px-3 py-2 text-sm border border-dark-200"
                placeholder="ঠিকানা"
                placeholderTextColor="#94a3b8"
                value={advancedFilters.address}
                onChangeText={(v) =>
                  setAdvancedFilters({ ...advancedFilters, address: v })
                }
              />
            </View>
            <TouchableOpacity
              onPress={handleSearch}
              className="bg-blue-500 rounded-xl py-2.5 items-center mt-1"
            >
              <Text className="text-white font-semibold">সার্চ করুন</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Results */}
      <View className="flex-1 px-4 pt-3">
        {isSearching && (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color="#10b981" />
            <Text className="text-dark-400 text-sm mt-2">খুঁজছি...</Text>
          </View>
        )}

        {!isSearching && displayResults.length > 0 && (
          <View className="flex-row items-center justify-between mb-2 px-1">
            <Text className="text-dark-500 text-sm">
              {searchPagination
                ? `${searchPagination.total} জন পাওয়া গেছে`
                : `${displayResults.length} জন পাওয়া গেছে`}
            </Text>
          </View>
        )}

        <FlatList
          data={displayResults}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <VoterCard voter={item} onPress={handleVoterPress} index={index} />
          )}
          ListEmptyComponent={
            !isSearching && query.trim().length > 0 ? (
              <EmptyState
                icon="search-outline"
                title="কোনো ভোটার পাওয়া যায়নি"
                subtitle="অন্য নাম বা তথ্য দিয়ে সার্চ করুন"
              />
            ) : !isSearching ? (
              <EmptyState
                icon="search-outline"
                title="ভোটার খুঁজুন"
                subtitle="নাম, ভোটার নং, NID, জন্ম তারিখ, পিতার নাম বা ঠিকানা দিয়ে সার্চ করুন"
              />
            ) : null
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>

      {/* Voter Detail Modal */}
      <VoterDetailModal
        visible={showDetailModal}
        voter={selectedVoter}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedVoter(null);
        }}
        onExportPdf={handleExportPdf}
        onDeleteVoter={() => {}}
      />
    </SafeAreaView>
  );
}
