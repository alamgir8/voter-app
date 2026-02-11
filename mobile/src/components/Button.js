import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

export const Button = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  className = "",
  textClassName = "",
}) => {
  const baseStyles = "rounded-xl items-center justify-center flex-row";

  const variants = {
    primary: "bg-primary-500 active:bg-primary-600",
    secondary: "bg-dark-200 active:bg-dark-300",
    outline: "border-2 border-primary-500 bg-transparent",
    danger: "bg-danger active:bg-red-600",
    success: "bg-success active:bg-emerald-600",
    ghost: "bg-transparent",
  };

  const sizes = {
    sm: "px-3 py-2",
    md: "px-5 py-3",
    lg: "px-6 py-4",
  };

  const textVariants = {
    primary: "text-white",
    secondary: "text-dark-800",
    outline: "text-primary-500",
    danger: "text-white",
    success: "text-white",
    ghost: "text-primary-500",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        disabled ? "opacity-50" : ""
      } ${className}`}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost" ? "#1a73e8" : "#fff"
          }
          size="small"
        />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text
            className={`font-semibold ${textVariants[variant]} ${textSizes[size]} ${textClassName}`}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
