import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TamaguiProvider, Theme } from "tamagui";
import { NavigationContainer } from "@react-navigation/native";
import Navigation from "./src/navigation";
import config from "./tamagui.config";

const App = () => (
  <TamaguiProvider config={config} defaultTheme={"dark"}>
    <SafeAreaProvider>
      <Theme name={"dark"}>
        <NavigationContainer>
          <Navigation />
        </NavigationContainer>
      </Theme>
    </SafeAreaProvider>
  </TamaguiProvider>
);

export default App;
