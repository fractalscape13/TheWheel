import React, { useState } from "react";
import { Button, Text, YStack, Stack } from "tamagui";
import { useTheme } from "tamagui";
import { Audio } from "expo-av";

type HomeProps = {
  toggleTheme: () => void;
};

const Home: React.FC<HomeProps> = ({ toggleTheme }) => {
  const theme = useTheme();
  const themeName = theme?.name?.toString();
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const fetchAndPlaySong = async () => {
    try {
      // Adjusted query to target audio mediatype
      const response = await fetch(
        'https://archive.org/advancedsearch.php?q=Grateful+Dead+AND+mediatype:audio+AND+year:1972&fl[]=identifier&fl[]=title&rows=1&page=1&output=json'
      );
      const data = await response.json();
      const showId = data.response.docs[0].identifier;
  
      // Fetch the specific show details to get the audio files
      const showResponse = await fetch(
        `https://archive.org/metadata/${showId}`
      );
      const showData = await showResponse.json();
  
      console.log("Available files:", showData.files);
  
      // Try to find an MP3 or other audio file
      const audioFile = showData.files.find((file: any) => 
        file.format.includes("MP3") || file.format.includes("FLAC") || file.format.includes("OGG")
      );
  
      if (!audioFile) {
        console.log("No playable audio file found.");
        return;
      }
  
      // Construct the audio file URL
      const audioUrl = `https://archive.org/download/${showId}/${audioFile.name}`;
      console.log("Playing audio file:", audioUrl);
  
      // Play the audio file
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      setSound(sound);
  
    } catch (error) {
      console.error("Error fetching song:", error);
    }
  };
  
  
  // Clean up sound resources
  React.useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync(); // Unload sound when the component unmounts or when a new sound is played
        }
      : undefined;
  }, [sound]);

  return (
    <YStack flex={1} jc="center" ai="center" bg="$background" p="$6">
      <Text fontSize="$10" fontWeight="bold" color="$text" mb="$2">
        The Wheel is Turning
      </Text>
      <Stack
        h={50}
        br="$2"
        w="90%"
        my="$3"
        bg="$buttonBackground"
        ai="center"
        jc="center"
        onPress={toggleTheme}
      >
        <Text color="$buttonText">
          Toggle to {themeName === "light" ? "Dark" : "Light"} Mode
        </Text>
      </Stack>
      <Stack
        h={50}
        br="$2"
        w="90%"
        my="$3"
        bg="$secondary"
        ai="center"
        jc="center"
        onPress={fetchAndPlaySong}
      >
        <Text color="$buttonText">Play a Grateful Dead Song from 1972</Text>
      </Stack>
    </YStack>
  );
};

export default Home;
