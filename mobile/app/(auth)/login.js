import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import Input from "../../src/components/Input";
import Button from "../../src/components/Button";
import useAuthStore from "../../src/stores/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = "ইমেইল আবশ্যক";
    else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email))
      newErrors.email = "সঠিক ইমেইল দিন";
    if (!password) newErrors.password = "পাসওয়ার্ড আবশ্যক";
    else if (password.length < 6)
      newErrors.password = "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    const result = await login(email.trim().toLowerCase(), password);
    if (result.success) {
      Toast.show({
        type: "success",
        text1: "লগইন সফল",
        text2: "স্বাগতম! 🎉",
      });
      router.replace("/(tabs)/home");
    } else {
      Toast.show({
        type: "error",
        text1: "লগইন ব্যর্থ",
        text2: result.message,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center pt-12 pb-8">
            <View className="bg-primary-500 w-20 h-20 rounded-3xl items-center justify-center mb-4">
              <Ionicons name="search" size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-dark-800">
              ভোটার সার্চ
            </Text>
            <Text className="text-dark-500 text-base mt-1">
              অ্যাকাউন্টে লগইন করুন
            </Text>
          </View>

          {/* Form */}
          <View className="px-6 flex-1">
            <Input
              label="ইমেইল"
              placeholder="আপনার ইমেইল দিন"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              icon="mail-outline"
              error={errors.email}
              required
            />

            <Input
              label="পাসওয়ার্ড"
              placeholder="পাসওয়ার্ড দিন"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon="lock-closed-outline"
              error={errors.password}
              required
            />

            <Button
              title="লগইন করুন"
              onPress={handleLogin}
              loading={isLoading}
              className="mt-4"
              size="lg"
              icon={<Ionicons name="log-in-outline" size={22} color="white" />}
            />

            {/* Register Link */}
            <View className="flex-row items-center justify-center mt-6">
              <Text className="text-dark-500">অ্যাকাউন্ট নেই? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text className="text-primary-500 font-bold">
                  রেজিস্টার করুন
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
