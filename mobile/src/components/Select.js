import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const Select = ({
  label,
  placeholder = "নির্বাচন করুন",
  value,
  options = [],
  onSelect,
  error,
  required = false,
  className = "",
}) => {
  const [visible, setVisible] = useState(false);

  const selectedLabel = options.find((opt) =>
    typeof opt === "string" ? opt === value : opt.value === value,
  );

  const displayValue = selectedLabel
    ? typeof selectedLabel === "string"
      ? selectedLabel
      : selectedLabel.label
    : "";

  return (
    <View className={`${className}`}>
      {label && (
        <Text className="text-dark-700 text-sm font-medium mb-2">
          {label}
          {required && <Text className="text-danger"> *</Text>}
        </Text>
      )}
      <TouchableOpacity
        onPress={() => setVisible(true)}
        className={`flex-row items-center justify-between bg-white rounded-xl border-2 px-4 py-3 ${
          error ? "border-danger" : "border-dark-200"
        }`}
        activeOpacity={0.7}
      >
        <Text
          className={`text-base flex-1 ${
            displayValue ? "text-dark-900" : "text-dark-400"
          }`}
        >
          {displayValue || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#64748b" />
      </TouchableOpacity>
      {error && <Text className="text-danger text-xs mt-1 ml-1">{error}</Text>}

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View className="bg-white rounded-t-3xl max-h-[70%]">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-dark-200">
              <Text className="text-lg font-bold text-dark-800">
                {label || "নির্বাচন করুন"}
              </Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color="#334155" />
              </TouchableOpacity>
            </View>
            <ScrollView className="px-2 py-2">
              {options.map((opt, index) => {
                const optValue = typeof opt === "string" ? opt : opt.value;
                const optLabel = typeof opt === "string" ? opt : opt.label;
                const isSelected = optValue === value;

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      onSelect(optValue);
                      setVisible(false);
                    }}
                    className={`px-4 py-3.5 rounded-xl mx-2 my-0.5 ${
                      isSelected ? "bg-primary-50" : ""
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-base ${
                        isSelected
                          ? "text-primary-500 font-semibold"
                          : "text-dark-700"
                      }`}
                    >
                      {optLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {options.length === 0 && (
                <View className="py-8 items-center">
                  <Text className="text-dark-400 text-base">
                    কোনো তথ্য পাওয়া যায়নি
                  </Text>
                </View>
              )}
            </ScrollView>
            <View className="h-8" />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Select;
