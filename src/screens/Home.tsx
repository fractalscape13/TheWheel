import React, { useState } from "react";
import {
  Text,
  YStack,
  Stack,
  Image,
  Slider,
  Input,
  styled,
  XStack,
  useTheme,
  ScrollView,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import Touchable from "@components/Touchable";
import Button from "@components/Button";
import Explorer from "@components/Explorer";
import Toast from "react-native-toast-message";
import { millisToMinutesAndSeconds } from "@services/math";
import Player from "@components/Player";

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
  const [currentSong, setCurrentSong] = useState<Audio.Sound | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [expandedDetails, setExpandedDetails] = useState<boolean>(false);
  const [exploreViewActive, setExploreViewActive] = useState<boolean>(false);
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
      setExploreViewActive(false);
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

  const toggleExploreView = () => {
    setExpandedDetails(false);
    setExploreViewActive(prevValue => !prevValue);
  }

  const glowingButtonStyles = {
    backgroundColor: theme?.$buttonBg?.val,
    borderRadius: 90,
    padding: 8,
    marginRight: 8,
    shadowColor: '#fff', 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.8, 
    shadowRadius: 8,   
    elevation: 20,
  }

  const normalButtonStyles = {
    backgroundColor: theme?.$buttonBg?.val,
    borderRadius: 90,
    padding: 8,
    marginRight: 8,
  }

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
        <Touchable
          onPress={toggleExploreView}
          style={exploreViewActive ? glowingButtonStyles : normalButtonStyles}
        >
          <Ionicons name="planet-outline" size={24} color="$icon" />
        </Touchable>
        <Touchable
          onPress={toggleTheme}
          style={{
            backgroundColor: theme?.$buttonBg?.val,
            borderRadius: 90,
            padding: 8,
            marginRight: 8,
          }}
        >
          <Ionicons name="moon-outline" size={24} color="$icon" />
        </Touchable>
        <Touchable
          onPress={handleSearch}
          style={{
            backgroundColor: theme?.$buttonBg?.val,
            borderRadius: 90,
            padding: 8,
          }}
        >
          <Ionicons name="search" size={24} color="$icon" />
        </Touchable>
      </XStack>
      {(currentSong || showFileCollection) && (
        <Player
          currentSongFile={currentSongFile}
          currentPlayingSongIndex={currentPlayingSongIndex}
          showFileCollection={showFileCollection}
          duration={duration}
          position={position}
          isPlaying={isPlaying}
          expandedDetails={expandedDetails}
          theme={theme}
          showId={showId}
          imageUrl={imageUrl}
          handleSeek={handleSeek}
          handlePlayPause={handlePlayPause}
          handleExpandDetails={handleExpandDetails}
          previousSongAction={previousSongAction}
          nextSongAction={nextSongAction}
        />
      )}
      {exploreViewActive && (
        <Explorer />
      )}
    </YStack>
  );
};

export default Home;
