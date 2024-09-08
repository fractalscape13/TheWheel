import React, { useEffect, useState } from "react";
import {
  Text,
  YStack,
  Stack,
  Image,
  Slider,
  Input,
  styled,
  useTheme,
  XStack,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import Button from "../components/Button";
import { TouchableOpacity } from "react-native";

type HomeProps = {
  toggleTheme: () => void;
};

const CustomTrack = styled(YStack, {
  width: "100%",
  height: 8,
  borderRadius: 10,
  backgroundColor: "#e0e0e0",
  position: "relative",
});

const CustomThumb = styled(YStack, {
  width: 20,
  height: 20,
  borderRadius: 50,
  backgroundColor: "#4caf50",
  position: "absolute",
  top: "50%",
  transform: [{ translateY: -10 }],
});

const Home: React.FC<HomeProps> = ({ toggleTheme }) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const themeName = theme?.name?.toString();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState<boolean | null>(true);
  const [songName, setSongName] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(0);
  const [position, setPosition] = useState<number | null>(0);
  const [showData, setShowData] = useState(null);

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis);
      setPosition(status.positionMillis);

      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setDuration(0);
      setPosition(0);
      setSound(null);
    }
  };

  const handleSeek = async (value) => {
    if (sound) {
      await sound.setPositionAsync(value);
    }
  };

  const millisToMinutesAndSeconds = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handlePlayPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSearch = async () => {
    const query = encodeURIComponent(`Grateful Dead ${searchTerm}`);
    const url = `https://archive.org/advancedsearch.php?q=${query}&output=json&rows=5`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const results = data.response.docs;

      for (const result of results) {
        const showId = result.identifier;
        const showResponse = await fetch(
          `https://archive.org/metadata/${showId}`
        );
        const showData = await showResponse.json();
        setShowData(showData); // setting show data to local state, not used currently but could be explored
        const audioFile = showData.files.find(
          (file: any) =>
            file.format.includes("MP3") ||
            file.format.includes("FLAC") ||
            file.format.includes("OGG") ||
            file.format.includes("VBR MP3")
        );

        if (audioFile) {
          const audioUrl = `https://archive.org/download/${showId}/${audioFile.name}`;
          setSongName(audioFile.title || result.title);
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: true }
          );
          setSound(sound);
          sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
          return;
        }
      }
    } catch (error) {
      console.error("Error fetching Grateful Dead song:", error);
    }
  };

  return (
    <YStack
      flex={1}
      bg="$background"
      px="$3"
      pt={insets.top}
      pb={insets.bottom}
    >
      <XStack jc="space-between" ai="center" px="$3" mb="$6">
        <Input
          placeholder="Search..."
          placeholderTextColor="$textPlaceholder"
          color="$text"
          value={searchTerm}
          onChangeText={setSearchTerm}
          h={40}
          flex={1}
          bw={1}
          br={8}
          bc="$text"
          mr="$3"
        />
        <TouchableOpacity onPress={handleSearch}>
          <Ionicons name="search" size={24} color="$textPlaceholder" />
        </TouchableOpacity>
      </XStack>
      {sound && (
        <Stack w="100%" jc="center" ai="center">
          {songName && (
            <Text color="$text" fontSize={18} my="$3">
              Now Playing: {songName}
            </Text>
          )}
          <Slider
            w="90%"
            defaultValue={[0]}
            value={position}
            min={0}
            maxValue={duration || 0}
            step={1}
            onValueChangeEnd={(val) => handleSeek(val[0])}
          >
            <CustomTrack>
              <YStack
                bg="$secondary"
                height="100%"
                width={`${(position / duration) * 100}%`}
              />
            </CustomTrack>
            <CustomThumb left={`${(position / duration) * 100}%`} />
          </Slider>
          <Text color="$text" mt="$2">
            {millisToMinutesAndSeconds(position)} /{" "}
            {millisToMinutesAndSeconds(duration)}
          </Text>
          <Button
            title={isPlaying ? "Pause" : "Resume"}
            onPress={handlePlayPause}
            buttonStyle={{ marginVertical: 12 }}
          />
          <Button
            title="Clear Audio Selection"
            onPress={stopAudio}
            color="secondary"
            buttonStyle={{ width: "90%", marginVertical: 12 }}
          />
        </Stack>
      )}
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: "90%", height: 200, marginTop: 12 }}
          resizeMode="contain"
        />
      )}
      <YStack flex={1} justifyContent="flex-end">
        <Button
          title={themeName === "light" ? "☀️" : "🌙"}
          onPress={toggleTheme}
          textStyle={{ fontSize: 30 }}
          buttonStyle={{ marginTop: 24 }}
        />
      </YStack>
    </YStack>
  );
};

export default Home;
