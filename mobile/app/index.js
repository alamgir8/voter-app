import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Index() {
  return (
    <View className="flex-1 bg-primary-500 items-center justify-center">
      <View className="bg-white/20 w-24 h-24 rounded-3xl items-center justify-center mb-6">
        <Ionicons name="search" size={50} color="white" />
      </View>
      <Text className="text-white text-3xl font-bold">ভোটার সার্চ</Text>
      <Text className="text-white/80 text-base mt-2 mb-4">
        ভোটার তালিকা ব্যবস্থাপনা
      </Text>
      <ActivityIndicator size="small" color="white" />
    </View>
  );
}
