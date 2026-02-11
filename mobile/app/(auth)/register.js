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

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "নাম আবশ্যক";
    if (!form.email.trim()) newErrors.email = "ইমেইল আবশ্যক";
    else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(form.email))
      newErrors.email = "সঠিক ইমেইল দিন";
    if (!form.phone.trim()) newErrors.phone = "ফোন নম্বর আবশ্যক";
    else if (!/^(\+88)?01[3-9]\d{8}$/.test(form.phone.trim()))
      newErrors.phone = "সঠিক বাংলাদেশি ফোন নম্বর দিন";
    if (!form.password) newErrors.password = "পাসওয়ার্ড আবশ্যক";
    else if (form.password.length < 6)
      newErrors.password = "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে";
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "পাসওয়ার্ড মিলছে না";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    const result = await register({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      password: form.password,
    });

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "রেজিস্ট্রেশন সফল",
        text2: "স্বাগতম! 🎉",
      });
      router.replace("/(tabs)/home");
    } else {
      Toast.show({
        type: "error",
        text1: "রেজিস্ট্রেশন ব্যর্থ",
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
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center pt-8 pb-6">
            <View className="bg-primary-500 w-16 h-16 rounded-2xl items-center justify-center mb-3">
              <Ionicons name="person-add" size={32} color="white" />
            </View>
            <Text className="text-2xl font-bold text-dark-800">
              নতুন অ্যাকাউন্ট
            </Text>
            <Text className="text-dark-500 text-sm mt-1">
              তথ্য দিয়ে রেজিস্টার করুন
            </Text>
          </View>

          {/* Form */}
          <View className="px-6 flex-1">
            <Input
              label="নাম"
              placeholder="আপনার নাম দিন"
              value={form.name}
              onChangeText={(v) => updateField("name", v)}
              icon="person-outline"
              error={errors.name}
              required
            />

            <Input
              label="ইমেইল"
              placeholder="আপনার ইমেইল দিন"
              value={form.email}
              onChangeText={(v) => updateField("email", v)}
              keyboardType="email-address"
              icon="mail-outline"
              error={errors.email}
              required
            />

            <Input
              label="ফোন নম্বর"
              placeholder="01XXXXXXXXX"
              value={form.phone}
              onChangeText={(v) => updateField("phone", v)}
              keyboardType="phone-pad"
              icon="call-outline"
              error={errors.phone}
              required
            />

            <Input
              label="পাসওয়ার্ড"
              placeholder="পাসওয়ার্ড দিন"
              value={form.password}
              onChangeText={(v) => updateField("password", v)}
              secureTextEntry
              icon="lock-closed-outline"
              error={errors.password}
              required
            />

            <Input
              label="পাসওয়ার্ড নিশ্চিত করুন"
              placeholder="পুনরায় পাসওয়ার্ড দিন"
              value={form.confirmPassword}
              onChangeText={(v) => updateField("confirmPassword", v)}
              secureTextEntry
              icon="lock-closed-outline"
              error={errors.confirmPassword}
              required
            />

            <Button
              title="রেজিস্টার করুন"
              onPress={handleRegister}
              loading={isLoading}
              className="mt-4"
              size="lg"
              icon={
                <Ionicons name="person-add-outline" size={22} color="white" />
              }
            />

            <View className="flex-row items-center justify-center mt-6 mb-8">
              <Text className="text-dark-500">ইতিমধ্যে অ্যাকাউন্ট আছে? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-primary-500 font-bold">লগইন করুন</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
