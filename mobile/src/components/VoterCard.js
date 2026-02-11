import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const VoterCard = ({ voter, onPress, index }) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(voter)}
      className="bg-white rounded-2xl mb-3 mx-1 shadow-sm border border-dark-100"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center p-4">
        {/* Avatar */}
        <View className="bg-primary-100 w-12 h-12 rounded-full items-center justify-center mr-3">
          <Text className="text-primary-600 font-bold text-lg">
            {voter.name ? voter.name.charAt(0) : "#"}
          </Text>
        </View>

        {/* Info */}
        <View className="flex-1">
          <Text className="text-dark-800 font-bold text-base" numberOfLines={1}>
            {voter.name || "নাম নেই"}
          </Text>
          <View className="flex-row items-center mt-1">
            {voter.fatherName && (
              <Text className="text-dark-500 text-xs flex-1" numberOfLines={1}>
                পিতা: {voter.fatherName}
              </Text>
            )}
          </View>
          <View className="flex-row items-center mt-1 flex-wrap gap-2">
            {voter.voterNo && (
              <View className="bg-primary-50 px-2 py-0.5 rounded-md">
                <Text className="text-primary-600 text-xs">
                  নং: {voter.voterNo}
                </Text>
              </View>
            )}
            {voter.dateOfBirth && (
              <View className="bg-accent-50 px-2 py-0.5 rounded-md">
                <Text className="text-accent-700 text-xs">
                  {voter.dateOfBirth}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );
};

export default VoterCard;
