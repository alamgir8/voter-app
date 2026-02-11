import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import useAuthStore from "../../src/stores/authStore";
import useCenterStore from "../../src/stores/centerStore";
import { StatCard } from "../../src/components/Common";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { centers = [], fetchCenters, isLoading } = useCenterStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCenters();
    setRefreshing(false);
  }, [fetchCenters]);

  const totalVoters = centers.reduce(
    (sum, c) => sum + (c?.totalVoters || 0),
    0,
  );

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="bg-blue-500 px-5 pt-4 pb-8 rounded-b-3xl">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-white/80 text-sm">স্বাগতম 👋</Text>
              <Text className="text-white text-xl font-bold">
                {user?.name || "ব্যবহারকারী"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile")}
              className="bg-white/20 w-11 h-11 rounded-full items-center justify-center"
            >
              <Ionicons name="person" size={22} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Search */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/search")}
            className="bg-white/20 rounded-2xl flex-row items-center px-4 py-3.5"
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={20} color="white" />
            <Text className="text-white/70 ml-3 text-base flex-1">
              ভোটার খুঁজুন...
            </Text>
            <Ionicons name="mic-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="px-4 -mt-4">
          <View className="flex-row">
            <StatCard
              icon="business-outline"
              title="মোট কেন্দ্র"
              value={centers.length.toString()}
              color="primary"
            />
            <StatCard
              icon="people-outline"
              title="মোট ভোটার"
              value={totalVoters.toString()}
              color="emerald"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-5 mt-6">
          <Text className="text-dark-800 text-lg font-bold mb-3">
            দ্রুত কার্যক্রম
          </Text>

          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity
              onPress={() => router.push("/center/create")}
              className="bg-white rounded-2xl p-4 flex-1 min-w-[45%] shadow-sm border border-dark-100"
              activeOpacity={0.7}
            >
              <View className="bg-primary-100 w-12 h-12 rounded-xl items-center justify-center mb-3">
                <Ionicons name="add-circle" size={28} color="#1a73e8" />
              </View>
              <Text className="text-dark-800 font-bold text-sm">
                নতুন কেন্দ্র
              </Text>
              <Text className="text-dark-400 text-xs mt-0.5">
                কেন্দ্র/অ্যাকাউন্ট তৈরি
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/import/pdf")}
              className="bg-white rounded-2xl p-4 flex-1 min-w-[45%] shadow-sm border border-dark-100"
              activeOpacity={0.7}
            >
              <View className="bg-accent-100 w-12 h-12 rounded-xl items-center justify-center mb-3">
                <Ionicons name="cloud-upload" size={28} color="#f57c00" />
              </View>
              <Text className="text-dark-800 font-bold text-sm">
                PDF ইম্পোর্ট
              </Text>
              <Text className="text-dark-400 text-xs mt-0.5">
                PDF থেকে ভোটার আমদানি
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/search")}
              className="bg-white rounded-2xl p-4 flex-1 min-w-[45%] shadow-sm border border-dark-100"
              activeOpacity={0.7}
            >
              <View className="bg-emerald-100 w-12 h-12 rounded-xl items-center justify-center mb-3">
                <Ionicons name="search" size={28} color="#10b981" />
              </View>
              <Text className="text-dark-800 font-bold text-sm">
                ভোটার খুঁজুন
              </Text>
              <Text className="text-dark-400 text-xs mt-0.5">
                দ্রুত সার্চ করুন
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/centers")}
              className="bg-white rounded-2xl p-4 flex-1 min-w-[45%] shadow-sm border border-dark-100"
              activeOpacity={0.7}
            >
              <View className="bg-purple-100 w-12 h-12 rounded-xl items-center justify-center mb-3">
                <Ionicons name="list" size={28} color="#8b5cf6" />
              </View>
              <Text className="text-dark-800 font-bold text-sm">
                কেন্দ্র তালিকা
              </Text>
              <Text className="text-dark-400 text-xs mt-0.5">
                সকল কেন্দ্র দেখুন
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Centers */}
        <View className="px-5 mt-6 mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-dark-800 text-lg font-bold">
              সাম্প্রতিক কেন্দ্রসমূহ
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/centers")}>
              <Text className="text-primary-500 font-semibold text-sm">
                সবগুলো →
              </Text>
            </TouchableOpacity>
          </View>

          {centers.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center border border-dark-100">
              <Ionicons name="business-outline" size={40} color="#94a3b8" />
              <Text className="text-dark-500 mt-2 text-sm">
                কোনো কেন্দ্র তৈরি হয়নি
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/center/create")}
                className="mt-3 bg-primary-500 px-4 py-2 rounded-xl"
              >
                <Text className="text-white font-semibold text-sm">
                  প্রথম কেন্দ্র তৈরি করুন
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            centers.slice(0, 5).map((center) => (
              <TouchableOpacity
                key={center._id}
                onPress={() => router.push(`/center/${center._id}`)}
                className="bg-white rounded-2xl p-4 mb-2 flex-row items-center shadow-sm border border-dark-100"
                activeOpacity={0.7}
              >
                <View className="bg-primary-100 w-11 h-11 rounded-xl items-center justify-center mr-3">
                  <Ionicons name="business" size={22} color="#1a73e8" />
                </View>

                <View className="flex-1">
                  <Text
                    className="text-dark-800 font-bold text-sm"
                    numberOfLines={1}
                  >
                    {center.centerName}
                  </Text>
                  <Text className="text-dark-400 text-xs mt-0.5">
                    {center.division} › {center.zilla} › {center.upazila}
                  </Text>
                </View>

                <View className="items-end">
                  <Text className="text-primary-500 font-bold text-sm">
                    {center.totalVoters || 0}
                  </Text>
                  <Text className="text-dark-400 text-xs">ভোটার</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
