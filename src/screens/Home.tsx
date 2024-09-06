import React from "react";
import { Text, YStack, Circle, Stack } from "tamagui";
import { useTheme } from "tamagui";

type HomeProps = {
  toggleTheme: () => void;
};

const Home: React.FC<HomeProps> = ({ toggleTheme }) => {
  const theme = useTheme();
  console.log("theme:", Object.keys(theme));
  const themeName = theme?.name?.toString();

  return (
    <YStack flex={1} jc="center" ai="center" bg="$background" p="$6">
      <Circle bg="$primary" mb="$4" ai="center" jc="center">
        <Text fontSize="$10" fontWeight="bold" color="$buttonText">
          {themeName === "light" ? "🌞" : "🌜"}
        </Text>
      </Circle>
      <Text fontSize="$10" fontWeight="bold" color="$text" mb="$2">
        The Wheel is Turning
      </Text>
      <Text fontSize="$8" mt="$2" color="$text" ta="center" px="$6">
        You're currently using the {themeName} theme.
      </Text>
      <Stack
      h={50}
      br="$2"
      w="90%"
      my="$3"
      bg="$buttonBackground"
        onPress={toggleTheme}
      >
        <Text color="$buttonText">
          Toggle to {themeName === "light" ? "Dark" : "Light"} Mode
        </Text>
      </Stack>
    </YStack>
  );
};

export default Home;
