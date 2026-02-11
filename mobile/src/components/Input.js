import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  editable = true,
  icon,
  rightIcon,
  onRightIconPress,
  className = "",
  inputClassName = "",
  required = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="text-dark-700 text-sm font-medium mb-1.5">
          {label}
          {required && <Text className="text-danger"> *</Text>}
        </Text>
      )}
      <View
        className={`flex-row items-center bg-dark-50 rounded-xl border-2 ${
          error
            ? "border-danger"
            : isFocused
              ? "border-primary-500"
              : "border-dark-200"
        } ${!editable ? "opacity-60" : ""}`}
      >
        {icon && (
          <View className="pl-3">
            <Ionicons name={icon} size={20} color="#64748b" />
          </View>
        )}
        <TextInput
          className={`flex-1 px-3 py-3 text-dark-900 text-base ${
            multiline ? "min-h-[100px] text-start" : ""
          } ${inputClassName}`}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          textAlignVertical={multiline ? "top" : "center"}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="pr-3"
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="#64748b"
            />
          </TouchableOpacity>
        )}
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} className="pr-3">
            <Ionicons name={rightIcon} size={22} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text className="text-danger text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
};

export default Input;
