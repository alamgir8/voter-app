import React, { useState, useEffect } from "react";
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
import Input from "../../../src/components/Input";
import Select from "../../../src/components/Select";
import Button from "../../../src/components/Button";
import useVoterStore from "../../../src/stores/voterStore";
import { LoadingScreen } from "../../../src/components/Common";

export default function EditVoterScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getVoterDetails, updateVoter, isLoading } = useVoterStore();

  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadVoter();
  }, [id]);

  const loadVoter = async () => {
    const voter = await getVoterDetails(id);
    if (voter) {
      setForm({
        cr: voter.cr || "",
        voterNo: voter.voterNo || "",
        nid: voter.nid || "",
        name: voter.name || "",
        fatherName: voter.fatherName || "",
        motherName: voter.motherName || "",
        husbandName: voter.husbandName || "",
        gender: voter.gender || "",
        occupation: voter.occupation || "",
        dateOfBirth: voter.dateOfBirth || "",
        address: voter.address || "",
        area: voter.area || "",
      });
    }
  };

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

  const handleUpdate = async () => {
    if (!validate()) return;

    const result = await updateVoter(id, form);
    if (result.success) {
      Toast.show({ type: "success", text1: "ভোটার আপডেট হয়েছে" });
      router.back();
    } else {
      Toast.show({ type: "error", text1: "ব্যর্থ", text2: result.message });
    }
  };

  if (!form) return <LoadingScreen />;

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
            ভোটার সম্পাদনা
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
                value={form.cr}
                onChangeText={(v) => updateField("cr", v)}
              />
            </View>
            <View className="flex-1">
              <Input
                label="ভোটার নং"
                value={form.voterNo}
                onChangeText={(v) => updateField("voterNo", v)}
              />
            </View>
          </View>

          <Input
            label="NID নং"
            value={form.nid}
            onChangeText={(v) => updateField("nid", v)}
            icon="card-outline"
          />
          <Input
            label="নাম"
            value={form.name}
            onChangeText={(v) => updateField("name", v)}
            icon="person-outline"
            error={errors.name}
            required
          />
          <Input
            label="পিতার নাম"
            value={form.fatherName}
            onChangeText={(v) => updateField("fatherName", v)}
            icon="person-outline"
          />
          <Input
            label="মাতার নাম"
            value={form.motherName}
            onChangeText={(v) => updateField("motherName", v)}
            icon="person-outline"
          />
          <Input
            label="স্বামীর নাম"
            value={form.husbandName}
            onChangeText={(v) => updateField("husbandName", v)}
            icon="person-outline"
          />
          <Select
            label="লিঙ্গ"
            value={form.gender}
            options={["পুরুষ", "মহিলা", "অন্যান্য"]}
            onSelect={(v) => updateField("gender", v)}
          />
          <Input
            label="পেশা"
            value={form.occupation}
            onChangeText={(v) => updateField("occupation", v)}
            icon="briefcase-outline"
          />
          <Input
            label="জন্ম তারিখ"
            value={form.dateOfBirth}
            onChangeText={(v) => updateField("dateOfBirth", v)}
            icon="calendar-outline"
          />
          <Input
            label="ঠিকানা"
            value={form.address}
            onChangeText={(v) => updateField("address", v)}
            icon="location-outline"
            multiline
            numberOfLines={2}
          />
          <Input
            label="এলাকা"
            value={form.area}
            onChangeText={(v) => updateField("area", v)}
            icon="map-outline"
          />

          <Button
            title="আপডেট করুন"
            onPress={handleUpdate}
            loading={isLoading}
            className="mt-2 mb-8"
            size="lg"
            icon={<Ionicons name="checkmark-circle" size={22} color="white" />}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
