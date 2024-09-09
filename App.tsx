import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TamaguiProvider, Theme } from "tamagui";
import { NavigationContainer } from "@react-navigation/native";
import Navigation from "./src/navigation";
import config from "./tamagui.config";
import Toast from "react-native-toast-message";
import toastConfig from "@services/toastConfig";

const App = () => (
  <TamaguiProvider config={config} defaultTheme={"dark"}>
    <SafeAreaProvider>
      <Theme name={"dark"}>
        <NavigationContainer>
          <Navigation />
        </NavigationContainer>
        <Toast config={toastConfig} visibilityTime={4000} />
      </Theme>
    </SafeAreaProvider>
  </TamaguiProvider>
);

export default App;
