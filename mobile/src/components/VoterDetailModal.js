import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal as RNModal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useVoterStore from "../stores/voterStore";

export const VoterDetailModal = ({
  visible,
  voter,
  onClose,
  onExportPdf,
  onDeleteVoter,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileClicks, setProfileClicks] = useState(0);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const { updateVoter, isLoading } = useVoterStore();

  // Pre-fill with voter data whenever voter changes
  const [editData, setEditData] = useState({
    name: voter?.name || "",
    fatherName: voter?.fatherName || "",
    motherName: voter?.motherName || "",
    husbandName: voter?.husbandName || "",
    gender: voter?.gender || "",
    occupation: voter?.occupation || "",
    dateOfBirth: voter?.dateOfBirth || "",
    address: voter?.address || "",
    area: voter?.area || "",
  });

  // Update editData when voter changes
  React.useEffect(() => {
    if (voter) {
      setEditData({
        name: voter?.name || "",
        fatherName: voter?.fatherName || "",
        motherName: voter?.motherName || "",
        husbandName: voter?.husbandName || "",
        gender: voter?.gender || "",
        occupation: voter?.occupation || "",
        dateOfBirth: voter?.dateOfBirth || "",
        address: voter?.address || "",
        area: voter?.area || "",
      });
      setProfileClicks(0);
      setShowDeleteOptions(false);
    }
  }, [voter, visible]);

  if (!voter) return null;

  const handleProfileClick = () => {
    const newCount = profileClicks + 1;
    setProfileClicks(newCount);

    if (newCount === 5) {
      setShowDeleteOptions(true);
      setProfileClicks(0);
    }
  };

  const handleSaveEdit = async () => {
    const result = await updateVoter(voter._id, editData);
    if (result.success) {
      setIsEditing(false);
      onClose();
    } else {
      Alert.alert("ব্যর্থ", result.message || "আপডেট করা যায়নি");
    }
  };

  const handleDeleteVoter = () => {
    Alert.alert("ভোটার মুছুন", `"${voter.name}" মুছে ফেলতে চান?`, [
      { text: "বাতিল", style: "cancel" },
      {
        text: "মুছুন",
        style: "destructive",
        onPress: () => {
          setShowDeleteOptions(false);
          onDeleteVoter && onDeleteVoter(voter);
          onClose();
        },
      },
    ]);
  };

  const DetailRow = ({ label, value, onEdit, editable = false }) => {
    if (!value && !editable) return null;
    return (
      <View className="flex-row py-3 border-b border-dark-100 items-center">
        <Text className="text-dark-500 text-sm w-[35%]">{label}</Text>
        <Text className="text-dark-800 text-sm font-medium flex-1">
          {value || "-"}
        </Text>
        {editable && isEditing && onEdit && (
          <TouchableOpacity className="ml-2">
            <Ionicons name="pencil" size={18} color="#10b981" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const EditField = ({
    label,
    value,
    onChangeText,
    keyboardType = "default",
  }) => (
    <View className="mb-3">
      <Text className="text-dark-600 text-sm font-medium mb-1.5">{label}</Text>
      <TextInput
        className="bg-dark-50 border-2 border-dark-200 rounded-lg px-3 py-2.5 text-dark-800"
        placeholder={label}
        placeholderTextColor="#cbd5e1"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );

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
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-dark-200 bg-white">
            <Text className="text-xl font-bold text-dark-800">
              {isEditing ? "ভোটার তথ্য সম্পাদনা" : "ভোটার বিস্তারিত"}
            </Text>
            <View className="flex-row gap-2 items-center">
              {!isEditing && (
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  className="bg-emerald-50 rounded-full p-2"
                >
                  <Ionicons name="pencil" size={18} color="#10b981" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                className="bg-dark-100 rounded-full p-1.5"
              >
                <Ionicons name="close" size={22} color="#334155" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="px-5 py-4">
            {/* Voter Avatar / Name Section */}
            <TouchableOpacity
              onPress={handleProfileClick}
              activeOpacity={0.8}
              className="items-center py-4 mb-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl"
            >
              <View className="bg-blue-500 w-16 h-16 rounded-full items-center justify-center mb-3">
                <Ionicons name="person" size={32} color="white" />
              </View>
              <Text className="text-xl font-bold text-dark-800">
                {editData.name || voter.name}
              </Text>
              {voter.voterNo && (
                <Text className="text-dark-500 mt-1 text-sm">
                  ভোটার নং: {voter.voterNo}
                </Text>
              )}
              {showDeleteOptions && (
                <Text className="text-dark-400 text-xs mt-2 font-semibold">
                  ডিলিট অপশন আনলক হয়েছে
                </Text>
              )}
            </TouchableOpacity>

            {isEditing ? (
              <>
                {/* Edit Mode */}
                <View className="mb-4">
                  <Text className="text-base font-bold text-emerald-600 mb-3">
                    <Ionicons name="person-circle-outline" size={18} />{" "}
                    ব্যক্তিগত তথ্য
                  </Text>
                  <EditField
                    label="নাম"
                    value={editData.name}
                    onChangeText={(v) => setEditData({ ...editData, name: v })}
                  />
                  <EditField
                    label="পিতার নাম"
                    value={editData.fatherName}
                    onChangeText={(v) =>
                      setEditData({ ...editData, fatherName: v })
                    }
                  />
                  <EditField
                    label="মাতার নাম"
                    value={editData.motherName}
                    onChangeText={(v) =>
                      setEditData({ ...editData, motherName: v })
                    }
                  />
                  {voter.husbandName && (
                    <EditField
                      label="স্বামীর নাম"
                      value={editData.husbandName}
                      onChangeText={(v) =>
                        setEditData({ ...editData, husbandName: v })
                      }
                    />
                  )}
                  <EditField
                    label="লিঙ্গ"
                    value={editData.gender}
                    onChangeText={(v) =>
                      setEditData({ ...editData, gender: v })
                    }
                  />
                  <EditField
                    label="পেশা"
                    value={editData.occupation}
                    onChangeText={(v) =>
                      setEditData({ ...editData, occupation: v })
                    }
                  />
                  <EditField
                    label="জন্ম তারিখ"
                    value={editData.dateOfBirth}
                    onChangeText={(v) =>
                      setEditData({ ...editData, dateOfBirth: v })
                    }
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-base font-bold text-emerald-600 mb-3">
                    <Ionicons name="location-outline" size={18} /> ঠিকানা
                  </Text>
                  <EditField
                    label="ঠিকানা"
                    value={editData.address}
                    onChangeText={(v) =>
                      setEditData({ ...editData, address: v })
                    }
                  />
                  <EditField
                    label="এলাকা"
                    value={editData.area}
                    onChangeText={(v) => setEditData({ ...editData, area: v })}
                  />
                </View>

                {/* Save & Cancel Buttons */}
                <TouchableOpacity
                  onPress={handleSaveEdit}
                  disabled={isLoading}
                  className="bg-blue-500 rounded-xl py-3.5 items-center flex-row justify-center mb-4"
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={22} color="white" />
                  <Text className="text-white font-bold text-base ml-2">
                    পরিবর্তন সংরক্ষণ করুন
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setIsEditing(false);
                    setEditData({
                      name: voter?.name || "",
                      fatherName: voter?.fatherName || "",
                      motherName: voter?.motherName || "",
                      husbandName: voter?.husbandName || "",
                      gender: voter?.gender || "",
                      occupation: voter?.occupation || "",
                      dateOfBirth: voter?.dateOfBirth || "",
                      address: voter?.address || "",
                      area: voter?.area || "",
                    });
                  }}
                  className="bg-dark-300 rounded-xl py-3.5 items-center mb-20 flex-row justify-center "
                >
                  <Text className="text-dark-700 font-bold text-base">
                    বাতিল
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* View Mode */}
                {/* Personal Info */}
                <View className="mb-4">
                  <Text className="text-base font-bold text-emerald-600 mb-2">
                    <Ionicons name="person-circle-outline" size={18} />{" "}
                    ব্যক্তিগত তথ্য
                  </Text>
                  <View className="bg-dark-50 rounded-xl px-4">
                    <DetailRow label="ক্রমিক নং" value={voter.cr} />
                    <DetailRow label="ভোটার নং" value={voter.voterNo} />
                    <DetailRow label="NID নং" value={voter.nid} />
                    <DetailRow label="নাম" value={voter.name} />
                    <DetailRow label="পিতার নাম" value={voter.fatherName} />
                    <DetailRow label="মাতার নাম" value={voter.motherName} />
                    {voter.husbandName && (
                      <DetailRow
                        label="স্বামীর নাম"
                        value={voter.husbandName}
                      />
                    )}
                    <DetailRow label="লিঙ্গ" value={voter.gender} />
                    <DetailRow label="পেশা" value={voter.occupation} />
                    <DetailRow label="জন্ম তারিখ" value={voter.dateOfBirth} />
                  </View>
                </View>

                {/* Address */}
                <View className="mb-4">
                  <Text className="text-base font-bold text-emerald-600 mb-2">
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
                    <Text className="text-base font-bold text-emerald-600 mb-2">
                      <Ionicons name="business-outline" size={18} /> কেন্দ্র
                      তথ্য
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
                  className="bg-blue-500 rounded-xl py-3.5 items-center flex-row justify-center mb-10"
                  activeOpacity={0.8}
                >
                  <Ionicons name="download-outline" size={22} color="white" />
                  <Text className="text-white font-bold text-base ml-2">
                    PDF ডাউনলোড করুন
                  </Text>
                </TouchableOpacity>

                {/* Delete Button - Only if enabled */}
                {showDeleteOptions && (
                  <TouchableOpacity
                    onPress={handleDeleteVoter}
                    className="bg-red-500 rounded-xl py-3.5 items-center flex-row justify-center"
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={22} color="white" />
                    <Text className="text-white font-bold text-base ml-2">
                      ভোটার মুছুন
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
};

export default VoterDetailModal;
