import "../global.css";
import React, { useEffect, useCallback } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import useAuthStore from "../src/stores/authStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded, fontError] = useFonts({
    "NotoSansBengali-Thin": require("../assets/fonts/NotoSansBengali-Thin.ttf"),
    "NotoSansBengali-ExtraLight": require("../assets/fonts/NotoSansBengali-ExtraLight.ttf"),
    "NotoSansBengali-Light": require("../assets/fonts/NotoSansBengali-Light.ttf"),
    "NotoSansBengali-Regular": require("../assets/fonts/NotoSansBengali-Regular.ttf"),
    "NotoSansBengali-Medium": require("../assets/fonts/NotoSansBengali-Medium.ttf"),
    "NotoSansBengali-SemiBold": require("../assets/fonts/NotoSansBengali-SemiBold.ttf"),
    "NotoSansBengali-Bold": require("../assets/fonts/NotoSansBengali-Bold.ttf"),
    "NotoSansBengali-ExtraBold": require("../assets/fonts/NotoSansBengali-ExtraBold.ttf"),
    "NotoSansBengali-Black": require("../assets/fonts/NotoSansBengali-Black.ttf"),
  });

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    if (!segments || segments.length === 0) return;
    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    console.log("Route guard:", {
      segments,
      isAuthenticated,
      inAuthGroup,
      inTabsGroup,
    });
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && !inTabsGroup) {
      router.replace("/(tabs)/home");
    }
  }, [fontsLoaded, fontError, isAuthenticated, segments, router]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
    }
  }, [fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#ffffff" },
          animation: "slide_from_right",
        }}
        onLayout={onLayoutRootView}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="center/[id]"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="center/create"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="center/edit/[id]"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="voter/create"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="voter/edit/[id]"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="import/pdf"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="import/preview"
          options={{ headerShown: false, presentation: "card" }}
        />
      </Stack>
      <Toast />
    </>
  );
}
