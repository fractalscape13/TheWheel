import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "@screens/Home";
import ShowDetails from "@screens/ShowDetails";
import { PlayerProvider } from "./context/PlayerContext";
import Player from "@components/Player";

const Stack = createNativeStackNavigator();

const Navigation = () => (
  <PlayerProvider>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="ShowDetails" component={ShowDetails} />
    </Stack.Navigator>
    <Player />
  </PlayerProvider>
);

export default Navigation;
