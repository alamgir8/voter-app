import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import useAuthStore from "../../src/stores/authStore";
import Input from "../../src/components/Input";
import Button from "../../src/components/Button";
import Toast from "react-native-toast-message";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile, isLoading } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const handleLogout = () => {
    Alert.alert("লগআউট", "আপনি কি লগআউট করতে চান?", [
      { text: "বাতিল", style: "cancel" },
      {
        text: "লগআউট",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    const result = await updateProfile({ name, phone });
    if (result.success) {
      Toast.show({
        type: "success",
        text1: "প্রোফাইল আপডেট হয়েছে",
      });
      setIsEditing(false);
    } else {
      Toast.show({
        type: "error",
        text1: "আপডেট ব্যর্থ",
        text2: result.message,
      });
    }
  };

  const MenuItem = ({ icon, title, subtitle, onPress, danger = false }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center py-4 px-4 bg-white rounded-xl mb-2 border border-dark-100"
      activeOpacity={0.7}
    >
      <View
        className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
          danger ? "bg-red-50" : "bg-primary-50"
        }`}
      >
        <Ionicons
          name={icon}
          size={22}
          color={danger ? "#ef4444" : "#1a73e8"}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`font-semibold ${
            danger ? "text-danger" : "text-dark-800"
          }`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-dark-400 text-xs mt-0.5">{subtitle}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-blue-500 px-5 pt-4 pb-10 rounded-b-3xl">
          <Text className="text-white text-xl font-bold mb-6">প্রোফাইল</Text>

          <View className="items-center">
            <View className="bg-white/20 w-20 h-20 rounded-full items-center justify-center mb-3">
              <Ionicons name="person" size={40} color="white" />
            </View>
            <Text className="text-white text-xl font-bold">
              {user?.name || "ব্যবহারকারী"}
            </Text>
            <Text className="text-white/80 text-sm mt-1">{user?.email}</Text>
            <View className="bg-white/20 px-3 py-1 rounded-full mt-2">
              <Text className="text-white text-xs">
                {user?.role || "operator"}
              </Text>
            </View>
          </View>
        </View>

        {/* Edit Profile */}
        <View className="px-5 -mt-5">
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-dark-100 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-dark-800 font-bold text-base">
                ব্যক্তিগত তথ্য
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                className="bg-emerald-100 px-3 py-1.5 rounded-lg"
              >
                <Text className="text-emerald-600 text-sm font-semibold">
                  {isEditing ? "বাতিল" : "সম্পাদনা"}
                </Text>
              </TouchableOpacity>
            </View>

            {isEditing ? (
              <>
                <Input
                  label="নাম"
                  value={name}
                  onChangeText={setName}
                  icon="person-outline"
                />
                <Input
                  label="ফোন"
                  value={phone}
                  onChangeText={setPhone}
                  icon="call-outline"
                  keyboardType="phone-pad"
                />
                <Button
                  title="সংরক্ষণ করুন"
                  onPress={handleSaveProfile}
                  loading={isLoading}
                />
              </>
            ) : (
              <>
                <View className="flex-row py-2 border-b border-dark-100">
                  <Text className="text-dark-400 w-24 text-sm">নাম</Text>
                  <Text className="text-dark-800 font-medium text-sm flex-1">
                    {user?.name}
                  </Text>
                </View>
                <View className="flex-row py-2 border-b border-dark-100">
                  <Text className="text-dark-400 w-24 text-sm">ইমেইল</Text>
                  <Text className="text-dark-800 font-medium text-sm flex-1">
                    {user?.email}
                  </Text>
                </View>
                <View className="flex-row py-2">
                  <Text className="text-dark-400 w-24 text-sm">ফোন</Text>
                  <Text className="text-dark-800 font-medium text-sm flex-1">
                    {user?.phone}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-5 mb-8">
          <Text className="text-dark-500 text-sm font-semibold mb-2 ml-1">
            সেটিংস
          </Text>

          <MenuItem
            icon="business-outline"
            title="কেন্দ্র ব্যবস্থাপনা"
            subtitle="সকল কেন্দ্র দেখুন ও পরিচালনা করুন"
            onPress={() => router.push("/(tabs)/centers")}
          />

          <MenuItem
            icon="cloud-upload-outline"
            title="PDF ইম্পোর্ট"
            subtitle="PDF থেকে ভোটার তালিকা আমদানি"
            onPress={() => router.push("/import/pdf")}
          />

          <MenuItem
            icon="lock-closed-outline"
            title="পাসওয়ার্ড পরিবর্তন"
            subtitle="পাসওয়ার্ড আপডেট করুন"
            onPress={() => Alert.alert("পাসওয়ার্ড", "এই ফিচারটি শীঘ্রই আসছে")}
          />

          <MenuItem
            icon="information-circle-outline"
            title="অ্যাপ সম্পর্কে"
            subtitle="সংস্করণ ১.০.০"
            onPress={() =>
              Alert.alert(
                "ভোটার সার্চ",
                "সংস্করণ: ১.০.০\nভোটার তালিকা ব্যবস্থাপনা ও সার্চ অ্যাপ",
              )
            }
          />

          <MenuItem
            icon="log-out-outline"
            title="লগআউট"
            subtitle="অ্যাকাউন্ট থেকে বের হন"
            onPress={handleLogout}
            danger
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
