import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import Input from "../../src/components/Input";
import Select from "../../src/components/Select";
import Button from "../../src/components/Button";
import useVoterStore from "../../src/stores/voterStore";

export default function CreateVoterScreen() {
  const { centerId } = useLocalSearchParams();
  const router = useRouter();
  const { createVoter, isLoading } = useVoterStore();

  const [form, setForm] = useState({
    cr: "",
    voterNo: "",
    nid: "",
    name: "",
    fatherName: "",
    motherName: "",
    husbandName: "",
    gender: "",
    occupation: "",
    dateOfBirth: "",
    address: "",
    area: "",
  });
  const [errors, setErrors] = useState({});

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "ভোটারের নাম আবশ্যক";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    const result = await createVoter({
      ...form,
      center: centerId,
    });

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "ভোটার যোগ হয়েছে",
        text2: form.name,
      });
      router.back();
    } else {
      Toast.show({
        type: "error",
        text1: "ব্যর্থ",
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
        <View className="flex-row items-center px-5 py-3 border-b border-dark-100">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 bg-dark-100 w-9 h-9 rounded-xl items-center justify-center"
          >
            <Ionicons name="close" size={20} color="#334155" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-dark-800 flex-1">
            নতুন ভোটার যোগ
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label="ক্রমিক নং"
                placeholder="CR"
                value={form.cr}
                onChangeText={(v) => updateField("cr", v)}
              />
            </View>
            <View className="flex-1">
              <Input
                label="ভোটার নং"
                placeholder="ভোটার নম্বর"
                value={form.voterNo}
                onChangeText={(v) => updateField("voterNo", v)}
              />
            </View>
          </View>

          <Input
            label="NID নং"
            placeholder="জাতীয় পরিচয়পত্র নম্বর"
            value={form.nid}
            onChangeText={(v) => updateField("nid", v)}
            icon="card-outline"
          />

          <Input
            label="নাম"
            placeholder="ভোটারের পূর্ণ নাম"
            value={form.name}
            onChangeText={(v) => updateField("name", v)}
            icon="person-outline"
            error={errors.name}
            required
          />

          <Input
            label="পিতার নাম"
            placeholder="পিতার নাম"
            value={form.fatherName}
            onChangeText={(v) => updateField("fatherName", v)}
            icon="person-outline"
          />

          <Input
            label="মাতার নাম"
            placeholder="মাতার নাম"
            value={form.motherName}
            onChangeText={(v) => updateField("motherName", v)}
            icon="person-outline"
          />

          <Input
            label="স্বামীর নাম"
            placeholder="স্বামীর নাম (ঐচ্ছিক)"
            value={form.husbandName}
            onChangeText={(v) => updateField("husbandName", v)}
            icon="person-outline"
          />

          <Select
            label="লিঙ্গ"
            placeholder="লিঙ্গ নির্বাচন"
            value={form.gender}
            options={["পুরুষ", "মহিলা", "অন্যান্য"]}
            onSelect={(v) => updateField("gender", v)}
          />

          <Input
            label="পেশা"
            placeholder="পেশা"
            value={form.occupation}
            onChangeText={(v) => updateField("occupation", v)}
            icon="briefcase-outline"
          />

          <Input
            label="জন্ম তারিখ"
            placeholder="যেমন: ০১/০১/১৯৯০"
            value={form.dateOfBirth}
            onChangeText={(v) => updateField("dateOfBirth", v)}
            icon="calendar-outline"
          />

          <Input
            label="ঠিকানা"
            placeholder="সম্পূর্ণ ঠিকানা"
            value={form.address}
            onChangeText={(v) => updateField("address", v)}
            icon="location-outline"
            multiline
            numberOfLines={2}
          />

          <Input
            label="এলাকা"
            placeholder="এলাকার নাম"
            value={form.area}
            onChangeText={(v) => updateField("area", v)}
            icon="map-outline"
          />

          <Button
            title="ভোটার যোগ করুন"
            onPress={handleCreate}
            loading={isLoading}
            className="mt-2 mb-8"
            size="lg"
            icon={<Ionicons name="person-add" size={22} color="white" />}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
