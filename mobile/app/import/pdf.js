import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";
import Button from "../../src/components/Button";
import Select from "../../src/components/Select";
import useCenterStore from "../../src/stores/centerStore";
import useVoterStore from "../../src/stores/voterStore";

export default function ImportPdfScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { centers, fetchCenters } = useCenterStore();
  const {
    importPdf,
    importedVoters,
    isImporting,
    importProgress,
    clearImported,
    clearImportProgress,
  } = useVoterStore();

  const [selectedCenter, setSelectedCenter] = useState(params.centerId || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState("");

  useEffect(() => {
    fetchCenters();
    return () => {
      clearImported();
      clearImportProgress();
    };
  }, []);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
      }
    } catch (error) {
      Alert.alert("ব্যর্থ", "ফাইল নির্বাচন করা যায়নি");
    }
  };

  const handleUpload = async () => {
    if (isImporting) return;
    if (!selectedCenter) {
      Alert.alert("সতর্কতা", "প্রথমে কেন্দ্র নির্বাচন করুন");
      return;
    }

    if (!selectedFile) {
      Alert.alert("সতর্কতা", "প্রথমে PDF ফাইল নির্বাচন করুন");
      return;
    }

    setUploadProgress(
      "PDF আপলোড হচ্ছে... (৪২ পৃষ্ঠা হলে ৮-১২ মিনিট লাগতে পারে)",
    );

    const formData = new FormData();
    formData.append("pdf", {
      uri: selectedFile.uri,
      type: "application/pdf",
      name: selectedFile.name || "voter-list.pdf",
    });
    formData.append("centerId", selectedCenter);

    const result = await importPdf(formData);

    setUploadProgress("");

    if (result.success) {
      const autoSavedMsg = result.data.autoSaved
        ? `${result.data.totalSaved} জন ভোটার স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়েছে`
        : `${result.data.totalExtracted} জন ভোটার পাওয়া গেছে`;

      Toast.show({
        type: "success",
        text1: "PDF প্রক্রিয়া সফল ✓",
        text2: autoSavedMsg,
      });

      // If auto-saved, go to center detail; otherwise show preview
      if (result.data.autoSaved) {
        router.push({
          pathname: "/center/[id]",
          params: { id: selectedCenter },
        });
      } else {
        router.push({
          pathname: "/import/preview",
          params: { centerId: selectedCenter },
        });
      }
    } else {
      Alert.alert(
        "সমস্যা",
        result.message +
          (result.rawText
            ? "\n\nPDF টেক্সট নমুনা:\n" + result.rawText.substring(0, 500)
            : ""),
      );
    }
  };

  const centerOptions = centers.map((c) => ({
    label: `${c.centerName} (${c.totalVoters || 0} ভোটার)`,
    value: c._id,
  }));

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-5 py-3 border-b border-dark-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 bg-dark-100 w-9 h-9 rounded-xl items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#334155" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-dark-800 flex-1">
          PDF ইম্পোর্ট
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4 pb-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Info Card */}
        <View className="bg-emerald-50 rounded-2xl p-4 mb-6 border border-emerald-100">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={24} color="#10b981" />
            <View className="ml-3 flex-1">
              <Text className="text-emerald-700 font-bold text-sm mb-1">
                PDF ইম্পোর্ট নির্দেশিকা
              </Text>
              <Text className="text-emerald-600 text-xs leading-5">
                • বাংলাদেশ নির্বাচন কমিশনের ভোটার তালিকা PDF সাপোর্ট করে{"\n"}•
                PDF তে নাম, পিতার নাম, ভোটার নং, জন্ম তারিখ, ঠিকানা থাকতে হবে
                {"\n"}• সর্বোচ্চ ৫০ MB সাইজের PDF আপলোড করা যাবে{"\n"}• আপলোডের
                পর ডাটা প্রিভিউ করে সংরক্ষণ করতে পারবেন
              </Text>
            </View>
          </View>
        </View>

        {/* Center Selection */}
        <Select
          label="কেন্দ্র নির্বাচন করুন"
          placeholder="কেন্দ্র বেছে নিন"
          value={selectedCenter}
          options={centerOptions}
          onSelect={setSelectedCenter}
          required
        />

        {/* File Picker */}
        <View className="mb-6">
          <Text className="text-dark-700 text-sm font-medium mb-1.5">
            PDF ফাইল নির্বাচন <Text className="text-danger">*</Text>
          </Text>

          <TouchableOpacity
            onPress={handlePickFile}
            className="border-2 border-dashed border-dark-300 rounded-2xl p-8 items-center justify-center bg-dark-50"
            activeOpacity={0.7}
          >
            {selectedFile ? (
              <>
                <View className="bg-emerald-100 w-16 h-16 rounded-full items-center justify-center mb-3">
                  <Ionicons name="document-text" size={32} color="#10b981" />
                </View>
                <Text className="text-dark-800 font-bold text-base text-center">
                  {selectedFile.name}
                </Text>
                <Text className="text-dark-400 text-sm mt-1">
                  {selectedFile.size
                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                    : ""}
                </Text>
                <Text className="text-emerald-500 text-sm mt-2 font-semibold">
                  অন্য ফাইল নির্বাচন করতে ট্যাপ করুন
                </Text>
              </>
            ) : (
              <>
                <View className="bg-emerald-100 w-16 h-16 rounded-full items-center justify-center mb-3">
                  <Ionicons name="cloud-upload" size={32} color="#10b981" />
                </View>
                <Text className="text-dark-600 font-bold text-base">
                  PDF ফাইল নির্বাচন করুন
                </Text>
                <Text className="text-dark-400 text-sm mt-1">
                  ট্যাপ করে PDF ফাইল বেছে নিন
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Upload Progress */}
        {isImporting && (
          <View className="bg-emerald-50 rounded-xl p-4 mb-4 flex-row items-center">
            <ActivityIndicator size="small" color="#10b981" />
            <Text className="text-emerald-600 ml-3 font-medium">
              {importProgress?.stage === "ocr"
                ? `OCR চলছে: পৃষ্ঠা ${importProgress.current}/${importProgress.total}`
                : importProgress?.stage === "saving"
                  ? `ডাটাবেসে সংরক্ষণ: ${importProgress.current}/${importProgress.total}`
                  : uploadProgress || "PDF প্রক্রিয়া হচ্ছে..."}
            </Text>
          </View>
        )}

        {/* Upload Button */}
        <Button
          title="PDF আপলোড ও প্রক্রিয়া করুন"
          onPress={handleUpload}
          loading={isImporting}
          disabled={!selectedCenter || !selectedFile || isImporting}
          size="lg"
          className="mb-4"
          icon={<Ionicons name="cloud-upload" size={22} color="white" />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
