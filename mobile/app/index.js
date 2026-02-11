import React, { useEffect } from "react";
import { Redirect, useRootNavigationState } from "expo-router";
import useAuthStore from "../src/stores/authStore";

export default function Index() {
  const navState = useRootNavigationState();
  const initialize = useAuthStore((s) => s.initialize);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (!navState?.key) return;
    if (isInitialized) return;
    initialize();
  }, [navState?.key, initialize, isInitialized]);

  if (!navState?.key || !isInitialized) return null;

  return <Redirect href={isAuthenticated ? "/(tabs)/home" : "/(auth)/login"} />;
}
