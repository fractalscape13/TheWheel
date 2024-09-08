import React, { useEffect, useState, useMemo } from "react";
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
import Toast from "react-native-toast-message";

//Services
import { millisToMinutesAndSeconds } from "../services/math";

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

const currentTrackStyles = {
  fontSize: "20",
  color: "gold",
};

const Home: React.FC<HomeProps> = ({ toggleTheme }) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const themeName = theme?.name?.toString();
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState<boolean | null>(true);
  const [duration, setDuration] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);
  const [showFileCollection, setShowFileCollection] = useState(null);
  const [showId, setShowId] = useState<number | null>(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentPlayingSongIndex, setCurrentPlayingSongIndex] = useState<
    number | null
  >(null);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis);
      setPosition(status.positionMillis);

      if (status.didJustFinish) {
        setIsPlaying(false);
        nextSongAction();
      }
    }
  };

  const clearAudioFromStorage = async () => {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      setDuration(0);
      setPosition(0);
      setCurrentSound(null);
    }
  };

  const handleSeek = async (value: number) => {
    if (currentSound) {
      await currentSound.setPositionAsync(value);
    }
  };

  const handlePlayPause = async () => {
    if (currentSound) {
      if (isPlaying) {
        await currentSound.pauseAsync();
      } else {
        await currentSound.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSearch = async () => {
    if (currentSound) {
      await clearAudioFromStorage();
    }
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

        const showCollection = showData.files.filter(
          (file) =>
            file.format.includes("MP3") || file.format.includes("VBR MP3")
        );
        setShowFileCollection(showCollection); // setting show data to local state, not used currently but could be explored
        setShowId(showId);
        const audioFile = showData.files.find(
          (file: any) =>
            file.format.includes("MP3") || file.format.includes("VBR MP3")
        );

        if (audioFile) {
          const audioUrl = `https://archive.org/download/${showId}/${audioFile.name}`;
          setCurrentSong(audioFile);
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: true }
          );
          setCurrentSound(sound);
          sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
          Toast.show({
            type: "success",
            text1: "The Music Never Stopped",
          });
          return;
        }
      }
    } catch (error) {
      console.error("Error fetching Grateful Dead song:", error);
    }
  };

  const previousSongAction = async () => {
    const newIndex = currentPlayingSongIndex - 1;
    if (currentSound) {
      await clearAudioFromStorage();
    }
    const newSelectedSong = showFileCollection[newIndex];
    setCurrentSong(newSelectedSong);
    const audioUrl = `https://archive.org/download/${showId}/${newSelectedSong.name}`;
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUrl },
      { shouldPlay: true }
    );
    setCurrentSound(sound);
    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    setCurrentPlayingSongIndex(newIndex);
  };

  const nextSongAction = async () => {
    const newIndex = currentPlayingSongIndex + 1;
    if (currentSound) {
      await clearAudioFromStorage();
    }
    const newSelectedSong = showFileCollection[newIndex];
    setCurrentSong(newSelectedSong);
    const audioUrl = `https://archive.org/download/${showId}/${newSelectedSong.name}`;
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUrl },
      { shouldPlay: true }
    );
    setCurrentSound(sound);
    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    setCurrentPlayingSongIndex(newIndex);
  };

  return (
    <YStack
      flex={1}
      bg="$background"
      px="$3"
      pt={insets.top}
      pb={insets.bottom}
    >
      <Toast position="bottom" />
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
      {(currentSound || showFileCollection) && (
        <Stack w="100%" jc="center" ai="center">
          {currentSong && (
            <Text color="$text" fontSize={18} my="$3">
              Now Playing: {currentSong?.title || currentSong?.name}
            </Text>
          )}
          {showFileCollection && (
            <YStack>
              {showFileCollection.map((track, index: number) => (
                <Text
                  key={track.name}
                  color="$text"
                  style={currentSong?.name === track.name && currentTrackStyles}
                >
                  {index + 1}) {track.title || track.name}
                </Text>
              ))}
              <XStack ai="center" jc="center" color="$text">
                <TouchableOpacity onPress={previousSongAction}>
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text color="$text" padding={15} fontSize="24">
                  {`${currentPlayingSongIndex + 1} / ${
                    showFileCollection.length
                  }`}
                </Text>
                <TouchableOpacity onPress={nextSongAction}>
                  <Ionicons name="arrow-forward" size={24} color="white" />
                </TouchableOpacity>
              </XStack>
            </YStack>
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
