import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal as RNModal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const VoterDetailModal = ({ visible, voter, onClose, onExportPdf }) => {
  if (!voter) return null;

  const DetailRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <View className="flex-row py-2.5 border-b border-dark-100">
        <Text className="text-dark-500 text-sm w-[35%]">{label}</Text>
        <Text className="text-dark-800 text-sm font-medium flex-1">
          {value}
        </Text>
      </View>
    );
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[90%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-dark-200">
            <Text className="text-xl font-bold text-dark-800">
              ভোটার বিস্তারিত
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="bg-dark-100 rounded-full p-1.5"
            >
              <Ionicons name="close" size={22} color="#334155" />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-5 py-3">
            {/* Voter Avatar / Name Section */}
            <View className="items-center py-4 mb-4 bg-primary-50 rounded-2xl">
              <View className="bg-primary-500 w-16 h-16 rounded-full items-center justify-center mb-3">
                <Ionicons name="person" size={32} color="white" />
              </View>
              <Text className="text-xl font-bold text-dark-800">
                {voter.name}
              </Text>
              {voter.voterNo && (
                <Text className="text-dark-500 mt-1">
                  ভোটার নং: {voter.voterNo}
                </Text>
              )}
            </View>

            {/* Personal Info */}
            <View className="mb-4">
              <Text className="text-base font-bold text-primary-500 mb-2">
                <Ionicons name="person-circle-outline" size={18} /> ব্যক্তিগত
                তথ্য
              </Text>
              <View className="bg-dark-50 rounded-xl px-4">
                <DetailRow label="ক্রমিক নং" value={voter.cr} />
                <DetailRow label="ভোটার নং" value={voter.voterNo} />
                <DetailRow label="NID নং" value={voter.nid} />
                <DetailRow label="নাম" value={voter.name} />
                <DetailRow label="পিতার নাম" value={voter.fatherName} />
                <DetailRow label="মাতার নাম" value={voter.motherName} />
                {voter.husbandName && (
                  <DetailRow label="স্বামীর নাম" value={voter.husbandName} />
                )}
                <DetailRow label="লিঙ্গ" value={voter.gender} />
                <DetailRow label="পেশা" value={voter.occupation} />
                <DetailRow label="জন্ম তারিখ" value={voter.dateOfBirth} />
              </View>
            </View>

            {/* Address */}
            <View className="mb-4">
              <Text className="text-base font-bold text-primary-500 mb-2">
                <Ionicons name="location-outline" size={18} /> ঠিকানা
              </Text>
              <View className="bg-dark-50 rounded-xl px-4">
                <DetailRow label="ঠিকানা" value={voter.address} />
                <DetailRow label="এলাকা" value={voter.area} />
              </View>
            </View>

            {/* Center Info */}
            {voter.center && (
              <View className="mb-4">
                <Text className="text-base font-bold text-primary-500 mb-2">
                  <Ionicons name="business-outline" size={18} /> কেন্দ্র তথ্য
                </Text>
                <View className="bg-dark-50 rounded-xl px-4">
                  <DetailRow
                    label="কেন্দ্র"
                    value={voter.center.centerName || voter.center}
                  />
                  <DetailRow label="বিভাগ" value={voter.center.division} />
                  <DetailRow label="জেলা" value={voter.center.zilla} />
                  <DetailRow label="উপজেলা" value={voter.center.upazila} />
                </View>
              </View>
            )}

            {/* Export Button */}
            <TouchableOpacity
              onPress={() => onExportPdf && onExportPdf(voter._id)}
              className="bg-primary-500 rounded-xl py-3.5 items-center flex-row justify-center mt-2 mb-6"
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={22} color="white" />
              <Text className="text-white font-bold text-base ml-2">
                PDF ডাউনলোড করুন
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
};

export default VoterDetailModal;
