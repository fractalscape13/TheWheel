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
import Button from "@components/Button";
import { TouchableOpacity } from "react-native";
import Toast from "react-native-toast-message";

//Services
import { millisToMinutesAndSeconds } from "@services/math";

type HomeProps = {
  toggleTheme: () => void;
};

const CustomTrack = styled(YStack, {
  width: "100%",
  height: 8,
  borderRadius: 10,
  backgroundColor: "$text",
  position: "relative",
});

const Home: React.FC<HomeProps> = ({ toggleTheme }) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const themeName = theme?.name?.toString();
  const [currentSong, setCurrentSong] = useState<Audio.Sound | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [expandedDetails, setExpandedDetails] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);
  const [showFileCollection, setShowFileCollection] = useState(null);
  const [showId, setShowId] = useState<number | null>(null);
  const [currentSongFile, setCurrentSongFile] = useState(null);
  const [currentPlayingSongIndex, setCurrentPlayingSongIndex] = useState<
    number | null
  >(null);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis);
      setPosition(status.positionMillis);

      if (status.didJustFinish) {
        nextSongAction();
      }
    }
  };

  const clearAudioFromStorage = async () => {
    if (currentSong) {
      await currentSong.stopAsync();
      await currentSong.unloadAsync();
      setDuration(0);
      setPosition(0);
      setCurrentSong(null);
      setCurrentPlayingSongIndex(null);
    }
  };

  const handleSeek = async (value: number) => {
    if (currentSong) {
      await currentSong.setPositionAsync(value);
    }
  };

  const handlePlayPause = async () => {
    if (currentSong) {
      const status = await currentSong.getStatusAsync();
      if (status.isPlaying) {
        await currentSong.pauseAsync();
        setIsPlaying(false);
      } else {
        await currentSong.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const handleSearch = async () => {
    if (currentSong) {
      await clearAudioFromStorage();
      setExpandedDetails(false);
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

        const imageFile = showData.files.find((file: any) =>
          file.format.includes("PNG")
        );

        if (imageFile) {
          setImageUrl(
            `https://archive.org/download/${showId}/${imageFile.name}`
          );
        }

        const audioFile = showData.files.find(
          (file: any) =>
            file.format.includes("MP3") || file.format.includes("VBR MP3")
        );

        if (audioFile) {
          const audioUrl = `https://archive.org/download/${showId}/${audioFile.name}`;
          setCurrentSongFile(audioFile);
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: true },
            (status) => setIsPlaying(status.isLoaded)
          );
          setCurrentSong(sound);
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
    if (currentSong) {
      await clearAudioFromStorage();
    }
    const newSelectedSong = showFileCollection[newIndex];
    setCurrentSongFile(newSelectedSong);
    const audioUrl = `https://archive.org/download/${showId}/${newSelectedSong.name}`;
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUrl },
      { shouldPlay: true },
      (status) => setIsPlaying(status.isLoaded)
    );
    setCurrentSong(sound);
    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    setCurrentPlayingSongIndex(newIndex);
  };

  const nextSongAction = async () => {
    const newIndex = currentPlayingSongIndex + 1;
    if (currentSong) {
      await clearAudioFromStorage();
    }
    const newSelectedSong = showFileCollection[newIndex];
    setCurrentSongFile(newSelectedSong);
    const audioUrl = `https://archive.org/download/${showId}/${newSelectedSong.name}`;
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUrl },
      { shouldPlay: true },
      (status) => setIsPlaying(status.isLoaded)
    );
    setCurrentSong(sound);
    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    setCurrentPlayingSongIndex(newIndex);
  };

  const handleExpandDetails = () => {
    return setExpandedDetails((prev) => !prev);
  };

  return (
    <YStack
      flex={1}
      bg="$background"
      px="$3"
      pt={insets.top}
      pb={insets.bottom}
    >
      <YStack w="100%" h="fit-content" z="$2" position="absolute" top={60}>
        <Toast position="top" />
      </YStack>
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
        <TouchableOpacity
          onPress={toggleTheme}
          style={{ backgroundColor: "#FF69B4", borderRadius: 90, padding: 8, marginRight: 8,}}
        >
          <Ionicons name="moon-outline" size={24} color="$icon" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSearch}
          style={{ backgroundColor: "#FF69B4", borderRadius: 90, padding: 8 }}
        >
          <Ionicons name="search" size={24} color="$icon" />
        </TouchableOpacity>
      </XStack>
      {(currentSong || showFileCollection) && (
        <Stack w="100%" jc="flex-start" ai="center">
          {currentSongFile && (
            <YStack w="100%" jc="space-between" ai="center" fd="row">
              <Text
                color="$text"
                fs="$3"
                my="$3"
                h="fit-content"
                mr={10}
                w="75%"
                ta="center"
              >
                Now Playing: {currentSongFile?.title || currentSongFile?.name}
              </Text>
              <XStack jc="flex-start" ai="center" w="25%">
                <TouchableOpacity
                  onPress={handleExpandDetails}
                  style={{
                    backgroundColor: "#FF69B4",
                    borderRadius: 90,
                    padding: 5,
                    marginRight: 10,
                  }}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={24}
                    color="$icon"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePlayPause}
                  style={{
                    backgroundColor: "#FF69B4",
                    borderRadius: 90,
                    padding: 5,
                  }}
                >
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={24}
                    color="$icon"
                  />
                </TouchableOpacity>
              </XStack>
            </YStack>
          )}
          <Text color="$text" mt="$2">
            {millisToMinutesAndSeconds(position)} /{" "}
            {millisToMinutesAndSeconds(duration)}
          </Text>
          <XStack ai="center" jc="center" color="#FF69B4">
            <TouchableOpacity onPress={previousSongAction}>
              <Ionicons
                name="chevron-back-circle-outline"
                size={24}
                color="#FF69B4"
              />
            </TouchableOpacity>
            <Text color="$icon" padding={15} fs="$5">
              {`${currentPlayingSongIndex + 1} / ${showFileCollection.length}`}
            </Text>
            <TouchableOpacity onPress={nextSongAction}>
              <Ionicons
                name="chevron-forward-circle-outline"
                size={24}
                color="#FF69B4"
              />
            </TouchableOpacity>
          </XStack>
          {showFileCollection && expandedDetails && (
            <YStack ta="center">
              {showFileCollection.map((track, index: number) => (
                <Text
                  key={track.name}
                  color={
                    currentSongFile?.name == track.name
                      ? "$trackProgress"
                      : "$text"
                  }
                  fs={currentSongFile?.name == track.name ? "$4" : "$1"}
                >
                  {index + 1}) {track.title || track.name}
                </Text>
              ))}
            </YStack>
          )}
          <Slider
            w="80%"
            h="auto"
            maxH={200}
            defaultValue={[0]}
            min={0}
            maxValue={duration || 1}
            step={1}
            onSlideEnd={(val) => handleSeek(val[0])}
          >
            {imageUrl ? (
              <CustomTrack
                h="100%"
                position="relative"
                bg="$trackProgress"
                mt={10}
              >
                <Image
                  h="100%"
                  br="$8"
                  source={{ uri: imageUrl }}
                  resizeMode="fill"
                />
                <YStack
                  bg="$trackBg"
                  h="100%"
                  w={`${(position / duration) * 100}%`}
                  position="absolute"
                  top="0"
                  left="0"
                  o="0.4"
                />
              </CustomTrack>
            ) : (
              <CustomTrack>
                <YStack
                  bg="$trackProgress"
                  h="100%"
                  w={`${(position / duration) * 100}%`}
                />
              </CustomTrack>
            )}
          </Slider>
        </Stack>
      )}
    </YStack>
  );
};

export default Home;
