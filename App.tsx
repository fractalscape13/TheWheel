import React, { useCallback, useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TamaguiProvider, Theme } from "tamagui";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
// Per-weight subpaths on purpose: importing the package root re-exports all 50
// weight/italic variants and Metro bundles every one (~9.4MB instead of ~1.3MB).
import { Syncopate_400Regular } from "@expo-google-fonts/syncopate/400Regular";
import { Syncopate_700Bold } from "@expo-google-fonts/syncopate/700Bold";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { IBMPlexMono_400Regular } from "@expo-google-fonts/ibm-plex-mono/400Regular";
import Navigation from "./src/navigation";
import config, { DEFAULT_PALETTE } from "./tamagui.config";
import TrackPlayer from "react-native-track-player";
import { setupPlayer, playbackService } from "./src/services/trackPlayer";

TrackPlayer.registerPlaybackService(() => playbackService);

// Hold the splash until the typefaces are ready, so nothing renders in a
// fallback face and then reflows.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* already hidden */
});

const App = () => {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Syncopate_400Regular,
    Syncopate_700Bold,
    IBMPlexMono_400Regular,
  });

  const onReady = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {
      /* already hidden */
    });
  }, []);

  useEffect(() => {
    // Don't strand the user on the splash if a font fails to decode.
    if (fontsLoaded || fontError) {
      onReady();
    }
  }, [fontsLoaded, fontError, onReady]);

  useEffect(() => {
    const setup = async () => {
      try {
        const setupResult = await setupPlayer();
        console.log(
          "App.tsx: Player setup result =>",
          setupResult
        );
      } catch (err) {
        console.log("App.tsx: Error during setup:", err);
      }
    };
    setup();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <TamaguiProvider config={config} defaultTheme={DEFAULT_PALETTE}>
      <SafeAreaProvider>
        <Theme name={DEFAULT_PALETTE}>
          <StatusBar style="light" />
          <NavigationContainer>
            <Navigation />
          </NavigationContainer>
        </Theme>
      </SafeAreaProvider>
    </TamaguiProvider>
  );
};

export default App;
