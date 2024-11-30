import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TamaguiProvider, Theme } from "tamagui";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import Navigation from "./src/navigation";
import config from "./tamagui.config";
import TrackPlayer from "react-native-track-player";
import { setupPlayer, playbackService } from "./src/services/trackPlayer";

TrackPlayer.registerPlaybackService(() => playbackService);

const App = () => {
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

  return (
    <TamaguiProvider config={config} defaultTheme={"dark"}>
      <SafeAreaProvider>
        <Theme name={"dark"}>
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
