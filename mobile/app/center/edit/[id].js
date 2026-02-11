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
import useCenterStore from "../../../src/stores/centerStore";
import { locationAPI } from "../../../src/api";
import { LoadingScreen } from "../../../src/components/Common";

export default function EditCenterScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { fetchCenter, updateCenter, selectedCenter, isLoading } =
    useCenterStore();

  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const center = await fetchCenter(id);
    if (center) {
      setForm({
        centerName: center.centerName || "",
        centerNo: center.centerNo || "",
        country: center.country || "বাংলাদেশ",
        division: center.division || "",
        zilla: center.zilla || "",
        upazila: center.upazila || "",
        union: center.union || "",
        ward: center.ward || "",
        description: center.description || "",
      });

      // Load location dropdowns
      try {
        const divRes = await locationAPI.getDivisions();
        setDivisions(divRes.data.data);
        if (center.division) {
          const distRes = await locationAPI.getDistricts(center.division);
          setDistricts(distRes.data.data);
        }
        if (center.zilla) {
          const upaRes = await locationAPI.getUpazilas(center.zilla);
          setUpazilas(upaRes.data.data);
        }
      } catch (e) {}
    }
  };

  const loadDistricts = async (division) => {
    try {
      const res = await locationAPI.getDistricts(division);
      setDistricts(res.data.data);
      setUpazilas([]);
    } catch (e) {}
  };

  const loadUpazilas = async (district) => {
    try {
      const res = await locationAPI.getUpazilas(district);
      setUpazilas(res.data.data);
    } catch (e) {}
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));

    if (key === "division") {
      setForm((prev) => ({ ...prev, division: value, zilla: "", upazila: "" }));
      loadDistricts(value);
    }
    if (key === "zilla") {
      setForm((prev) => ({ ...prev, zilla: value, upazila: "" }));
      loadUpazilas(value);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.centerName.trim()) newErrors.centerName = "কেন্দ্রের নাম আবশ্যক";
    if (!form.division) newErrors.division = "বিভাগ নির্বাচন আবশ্যক";
    if (!form.zilla) newErrors.zilla = "জেলা নির্বাচন আবশ্যক";
    if (!form.upazila) newErrors.upazila = "উপজেলা নির্বাচন আবশ্যক";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;

    const result = await updateCenter(id, form);
    if (result.success) {
      Toast.show({ type: "success", text1: "কেন্দ্র আপডেট হয়েছে" });
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
            কেন্দ্র সম্পাদনা
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="কেন্দ্রের নাম"
            value={form.centerName}
            onChangeText={(v) => updateField("centerName", v)}
            icon="business-outline"
            error={errors.centerName}
            required
          />
          <Input
            label="কেন্দ্র নং"
            value={form.centerNo}
            onChangeText={(v) => updateField("centerNo", v)}
            icon="keypad-outline"
          />
          <Input
            label="দেশ"
            value={form.country}
            onChangeText={(v) => updateField("country", v)}
            icon="earth-outline"
            required
          />
          <Select
            label="বিভাগ"
            value={form.division}
            options={divisions}
            onSelect={(v) => updateField("division", v)}
            error={errors.division}
            required
          />
          <Select
            label="জেলা"
            value={form.zilla}
            options={districts}
            onSelect={(v) => updateField("zilla", v)}
            error={errors.zilla}
            required
          />
          <Select
            label="উপজেলা"
            value={form.upazila}
            options={upazilas}
            onSelect={(v) => updateField("upazila", v)}
            error={errors.upazila}
            required
          />
          <Input
            label="ইউনিয়ন"
            value={form.union}
            onChangeText={(v) => updateField("union", v)}
            icon="map-outline"
          />
          <Input
            label="ওয়ার্ড"
            value={form.ward}
            onChangeText={(v) => updateField("ward", v)}
            icon="grid-outline"
          />
          <Input
            label="বিবরণ"
            value={form.description}
            onChangeText={(v) => updateField("description", v)}
            multiline
            numberOfLines={3}
            icon="document-text-outline"
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
