import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const LoadingScreen = ({ message = "লোড হচ্ছে..." }) => (
  <View className="flex-1 items-center justify-center bg-white">
    <ActivityIndicator size="large" color="#1a73e8" />
    <Text className="text-dark-500 mt-3 text-base">{message}</Text>
  </View>
);

export const EmptyState = ({
  icon = "file-tray-outline",
  title = "কোনো তথ্য পাওয়া যায়নি",
  subtitle = "",
}) => (
  <View className="flex-1 items-center justify-center py-20">
    <View className="bg-dark-100 w-20 h-20 rounded-full items-center justify-center mb-4">
      <Ionicons name={icon} size={40} color="#94a3b8" />
    </View>
    <Text className="text-dark-600 text-lg font-semibold">{title}</Text>
    {subtitle ? (
      <Text className="text-dark-400 text-sm mt-1 text-center px-8">
        {subtitle}
      </Text>
    ) : null}
  </View>
);

export const ErrorState = ({ message, onRetry }) => (
  <View className="flex-1 items-center justify-center py-20">
    <View className="bg-red-100 w-20 h-20 rounded-full items-center justify-center mb-4">
      <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
    </View>
    <Text className="text-dark-600 text-lg font-semibold">সমস্যা হয়েছে</Text>
    <Text className="text-dark-400 text-sm mt-1 text-center px-8">
      {message}
    </Text>
    {onRetry && (
      <TouchableOpacity
        onPress={onRetry}
        className="mt-4 bg-primary-500 px-6 py-2.5 rounded-xl"
      >
        <Text className="text-white font-semibold">পুনরায় চেষ্টা</Text>
      </TouchableOpacity>
    )}
  </View>
);

export const StatCard = ({ icon, title, value, color = "emerald" }) => {
  const colors = {
    primary: "bg-emerald-50 text-emerald-500",
    success: "bg-emerald-50 text-emerald-500",
    emerald: "bg-emerald-50 text-emerald-500",
    warning: "bg-amber-50 text-amber-500",
    danger: "bg-red-50 text-red-500",
    purple: "bg-purple-50 text-purple-500",
  };

  const iconColors = {
    primary: "#10b981",
    success: "#10b981",
    emerald: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    purple: "#8b5cf6",
  };

  return (
    <View
      className={`flex-1 rounded-2xl p-4 mx-1 ${colors[color].split(" ")[0]}`}
    >
      <Ionicons name={icon} size={28} color={iconColors[color]} />
      <Text className="text-2xl font-bold text-dark-800 mt-2">{value}</Text>
      <Text className="text-dark-500 text-xs mt-0.5">{title}</Text>
    </View>
  );
};
