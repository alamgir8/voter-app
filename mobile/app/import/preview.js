import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import Button from "../../src/components/Button";
import useVoterStore from "../../src/stores/voterStore";

export default function ImportPreviewScreen() {
  const { centerId } = useLocalSearchParams();
  const router = useRouter();
  const { importedVoters, saveImportedVoters, isImporting, clearImported } =
    useVoterStore();

  const [voters, setVoters] = useState([...importedVoters]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editForm, setEditForm] = useState({});

  const handleRemoveVoter = (index) => {
    const updated = voters.filter((_, i) => i !== index);
    setVoters(updated);
  };

  const handleEditVoter = (index) => {
    setEditingIndex(index);
    setEditForm({ ...voters[index] });
  };

  const handleSaveEdit = () => {
    const updated = [...voters];
    updated[editingIndex] = editForm;
    setVoters(updated);
    setEditingIndex(-1);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
    setEditForm({});
  };

  const handleSaveAll = async () => {
    if (voters.length === 0) {
      Alert.alert("সতর্কতা", "সংরক্ষণ করার মতো কোনো ভোটার নেই");
      return;
    }

    Alert.alert("নিশ্চিত করুন", `${voters.length} জন ভোটার সংরক্ষণ করতে চান?`, [
      { text: "বাতিল", style: "cancel" },
      {
        text: "সংরক্ষণ করুন",
        onPress: async () => {
          const result = await saveImportedVoters(centerId, voters);
          if (result.success) {
            Toast.show({
              type: "success",
              text1: "সংরক্ষণ সফল",
              text2: `${result.data.inserted} জন ভোটার সংরক্ষিত হয়েছে`,
            });
            clearImported();
            router.replace(`/center/${centerId}`);
          } else {
            Toast.show({
              type: "error",
              text1: "সংরক্ষণ ব্যর্থ",
              text2: result.message,
            });
          }
        },
      },
    ]);
  };

  const renderVoter = ({ item, index }) => {
    if (editingIndex === index) {
      return (
        <View className="bg-white rounded-2xl mb-3 mx-1 p-4 border-2 border-primary-500">
          <Text className="text-primary-500 font-bold mb-3">
            ভোটার #{index + 1} সম্পাদনা
          </Text>

          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="flex-1 bg-dark-50 rounded-lg px-3 py-2 text-sm border border-dark-200"
              placeholder="ক্রমিক নং"
              value={editForm.cr}
              onChangeText={(v) => setEditForm({ ...editForm, cr: v })}
            />
            <TextInput
              className="flex-1 bg-dark-50 rounded-lg px-3 py-2 text-sm border border-dark-200"
              placeholder="ভোটার নং"
              value={editForm.voterNo}
              onChangeText={(v) => setEditForm({ ...editForm, voterNo: v })}
            />
          </View>

          <TextInput
            className="bg-dark-50 rounded-lg px-3 py-2 text-sm border border-dark-200 mb-2"
            placeholder="নাম *"
            value={editForm.name}
            onChangeText={(v) => setEditForm({ ...editForm, name: v })}
          />
          <TextInput
            className="bg-dark-50 rounded-lg px-3 py-2 text-sm border border-dark-200 mb-2"
            placeholder="পিতার নাম"
            value={editForm.fatherName}
            onChangeText={(v) => setEditForm({ ...editForm, fatherName: v })}
          />
          <TextInput
            className="bg-dark-50 rounded-lg px-3 py-2 text-sm border border-dark-200 mb-2"
            placeholder="মাতার নাম"
            value={editForm.motherName}
            onChangeText={(v) => setEditForm({ ...editForm, motherName: v })}
          />
          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="flex-1 bg-dark-50 rounded-lg px-3 py-2 text-sm border border-dark-200"
              placeholder="পেশা"
              value={editForm.occupation}
              onChangeText={(v) => setEditForm({ ...editForm, occupation: v })}
            />
            <TextInput
              className="flex-1 bg-dark-50 rounded-lg px-3 py-2 text-sm border border-dark-200"
              placeholder="জন্ম তারিখ"
              value={editForm.dateOfBirth}
              onChangeText={(v) => setEditForm({ ...editForm, dateOfBirth: v })}
            />
          </View>
          <TextInput
            className="bg-dark-50 rounded-lg px-3 py-2 text-sm border border-dark-200 mb-3"
            placeholder="ঠিকানা"
            value={editForm.address}
            onChangeText={(v) => setEditForm({ ...editForm, address: v })}
          />

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleSaveEdit}
              className="flex-1 bg-primary-500 py-2.5 rounded-xl items-center"
            >
              <Text className="text-white font-semibold text-sm">সংরক্ষণ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCancelEdit}
              className="flex-1 bg-dark-200 py-2.5 rounded-xl items-center"
            >
              <Text className="text-dark-600 font-semibold text-sm">বাতিল</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View className="bg-white rounded-2xl mb-2 mx-1 shadow-sm border border-dark-100">
        <View className="p-3 flex-row items-center">
          <View className="bg-primary-100 w-9 h-9 rounded-lg items-center justify-center mr-3">
            <Text className="text-primary-600 font-bold text-sm">
              {index + 1}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-dark-800 font-bold text-sm" numberOfLines={1}>
              {item.name || "নাম নেই"}
            </Text>
            <Text className="text-dark-400 text-xs mt-0.5" numberOfLines={1}>
              পিতা: {item.fatherName || "-"} | নং: {item.voterNo || "-"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleEditVoter(index)}
            className="bg-primary-50 w-8 h-8 rounded-lg items-center justify-center mr-1"
          >
            <Ionicons name="create-outline" size={16} color="#1a73e8" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRemoveVoter(index)}
            className="bg-red-50 w-8 h-8 rounded-lg items-center justify-center"
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      {/* Header */}
      <View className="bg-white px-5 pt-3 pb-4 border-b border-dark-100">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 bg-dark-100 w-9 h-9 rounded-xl items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color="#334155" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-dark-800 flex-1">
            ডাটা প্রিভিউ
          </Text>
          <View className="bg-primary-100 px-3 py-1 rounded-lg">
            <Text className="text-primary-600 font-bold text-sm">
              {voters.length} জন
            </Text>
          </View>
        </View>

        {/* Info */}
        <View className="bg-amber-50 rounded-xl p-3 flex-row items-start border border-amber-200">
          <Ionicons name="warning" size={18} color="#f59e0b" />
          <Text className="text-amber-700 text-xs ml-2 flex-1 leading-4">
            সংরক্ষণের আগে তথ্য যাচাই করুন। সম্পাদনা বা মুছে ফেলার জন্য ডানে বাটন
            ব্যবহার করুন।
          </Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={voters}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderVoter}
        contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Ionicons name="file-tray-outline" size={48} color="#94a3b8" />
            <Text className="text-dark-500 mt-3 text-base">
              কোনো ভোটার তথ্য পাওয়া যায়নি
            </Text>
          </View>
        }
      />

      {/* Save Button */}
      {voters.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 bg-white px-5 py-4 border-t border-dark-100">
          <Button
            title={`${voters.length} জন ভোটার সংরক্ষণ করুন`}
            onPress={handleSaveAll}
            loading={isImporting}
            size="lg"
            icon={<Ionicons name="save" size={22} color="white" />}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
