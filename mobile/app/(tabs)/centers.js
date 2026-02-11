import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import useCenterStore from "../../src/stores/centerStore";
import { EmptyState, LoadingScreen } from "../../src/components/Common";
import Input from "../../src/components/Input";

export default function CentersScreen() {
  const router = useRouter();
  const { centers, fetchCenters, deleteCenter, isLoading } = useCenterStore();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCenters();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCenters();
    setRefreshing(false);
  }, []);

  const handleDelete = (center) => {
    Alert.alert(
      "মুছে ফেলুন",
      `"${center.centerName}" কেন্দ্র ও সকল ভোটার মুছে ফেলতে চান?`,
      [
        { text: "বাতিল", style: "cancel" },
        {
          text: "মুছে ফেলুন",
          style: "destructive",
          onPress: async () => {
            const result = await deleteCenter(center._id);
            if (!result.success) {
              Alert.alert("ব্যর্থ", result.message);
            }
          },
        },
      ],
    );
  };

  const filteredCenters = centers.filter(
    (c) =>
      c.centerName.toLowerCase().includes(search.toLowerCase()) ||
      c.division.includes(search) ||
      c.zilla.includes(search) ||
      c.upazila.includes(search),
  );

  const renderCenter = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/center/${item._id}`)}
      className="bg-white rounded-2xl mb-3 mx-1 shadow-sm border border-dark-100 overflow-hidden"
      activeOpacity={0.7}
    >
      <View className="p-4">
        <View className="flex-row items-start">
          <View className="bg-primary-100 w-12 h-12 rounded-xl items-center justify-center mr-3">
            <Ionicons name="business" size={24} color="#1a73e8" />
          </View>
          <View className="flex-1">
            <Text
              className="text-dark-800 font-bold text-base"
              numberOfLines={1}
            >
              {item.centerName}
            </Text>
            <Text className="text-dark-400 text-xs mt-1">
              {item.division} › {item.zilla} › {item.upazila}
            </Text>
            {item.centerNo && (
              <Text className="text-dark-400 text-xs mt-0.5">
                কেন্দ্র নং: {item.centerNo}
              </Text>
            )}
          </View>
          <View className="items-end">
            <View className="bg-primary-50 px-3 py-1 rounded-lg">
              <Text className="text-primary-600 font-bold text-sm">
                {item.totalVoters || 0}
              </Text>
            </View>
            <Text className="text-dark-400 text-xs mt-0.5">ভোটার</Text>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row items-center justify-end mt-3 pt-3 border-t border-dark-100 gap-2">
          <TouchableOpacity
            onPress={() => router.push(`/center/edit/${item._id}`)}
            className="flex-row items-center bg-dark-50 px-3 py-1.5 rounded-lg"
          >
            <Ionicons name="create-outline" size={16} color="#64748b" />
            <Text className="text-dark-500 text-xs ml-1">সম্পাদনা</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            className="flex-row items-center bg-red-50 px-3 py-1.5 rounded-lg"
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text className="text-danger text-xs ml-1">মুছুন</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      {/* Header */}
      <View className="bg-white px-5 pt-4 pb-3 border-b border-dark-100">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xl font-bold text-dark-800">
            <Ionicons name="business" size={22} /> কেন্দ্র তালিকা
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/center/create")}
            className="bg-primary-500 w-10 h-10 rounded-xl items-center justify-center"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Input
          placeholder="কেন্দ্র খুঁজুন..."
          value={search}
          onChangeText={setSearch}
          icon="search"
          className="mb-0"
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredCenters}
        keyExtractor={(item) => item._id}
        renderItem={renderCenter}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            title="কোনো কেন্দ্র নেই"
            subtitle="নতুন কেন্দ্র তৈরি করতে + বাটন চাপুন"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
