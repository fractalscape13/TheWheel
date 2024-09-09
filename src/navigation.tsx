import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "./screens/Home";

const Stack = createNativeStackNavigator();

const Navigation = () => (
  <Stack.Navigator initialRouteName="Home">
    <Stack.Screen name="Home" options={{ headerShown: false }}>
      {() => <Home />}
    </Stack.Screen>
  </Stack.Navigator>
);

export default Navigation;
