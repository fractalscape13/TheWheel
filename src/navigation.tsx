import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "./screens/Home";

const Stack = createNativeStackNavigator();

type NavProps = {
  toggleTheme: () => void;
};

const Navigation: React.FC<NavProps> = ({ toggleTheme }) => {
  return (
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" options={{headerShown: false}}>
          {() => <Home toggleTheme={toggleTheme} />}
        </Stack.Screen>
      </Stack.Navigator>
  );
};

export default Navigation;
