import React, { useState } from "react";
import { YStack, Input, XStack, useTheme } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import Touchable from "@components/Touchable";
import Explorer from "@components/Explorer";
import Player from "@components/Player";
import ShowDetails from "./ShowDetails";
import { Show } from "../types";

const Home = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState<boolean>(false);
  const [currentSong, setCurrentSong] = useState<Audio.Sound | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [expandedDetails, setExpandedDetails] = useState<boolean>(false);
  const [exploreViewActive, setExploreViewActive] = useState<boolean>(true);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showFileCollection, setShowFileCollection] = useState(null);
  const [showId, setShowId] = useState<string | null>(null);
  const [currentSongFile, setCurrentSongFile] = useState(null);
  const [
    currentPlayingSongIndex,
    setCurrentPlayingSongIndex,
  ] = useState<number>(0);

  const togglePlayerSize = () => {
    setIsPlayerExpanded((prev) => !prev);
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setDuration(status.durationMillis);
      setPosition(status.positionMillis);

      if (status.didJustFinish) {
        nextSongAction();
      }
    }
  };

  const loadAudioAndPlay = async (trackDownloadSlug: string) => {
    const { sound } = await Audio.Sound.createAsync(
      { uri: trackDownloadSlug },
      { shouldPlay: true },
      (status) => setIsPlaying(status.isLoaded)
    );
    setCurrentSong(sound);
    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    return;
  };

  const clearAudioFromStorage = async () => {
    if (currentSong) {
      await currentSong.stopAsync();
      await currentSong.unloadAsync();
      setDuration(0);
      setPosition(0);
      setCurrentSong(null);
      return;
    }
  };

  const handleSeek = async (value: number) => {
    if (currentSong) {
      return await currentSong.setPositionAsync(value);
    }
  };

  const handlePlayPause = async () => {
    if (currentSong) {
      const status = await currentSong.getStatusAsync();
      if (status.isPlaying) {
        await currentSong.pauseAsync();
        return setIsPlaying(false);
      } else {
        await currentSong.playAsync();
        return setIsPlaying(true);
      }
    }
  };

  const handleSelectedTrack = async (
    locatedTrackIndex: number,
    tracks: {},
    audioUrl: string,
    showId: string
  ) => {
    setIsLoading(true);
    setCurrentPlayingSongIndex(locatedTrackIndex);
    if (currentSong) {
      await clearAudioFromStorage();
      setExpandedDetails(false);
    }
    setShowId(showId);
    setCurrentSongFile(tracks[locatedTrackIndex]);
    const restructuredTrackMap = tracks.map((track) => {
      return {
        name: track.file,
        file: track.file,
        length: track.length,
        title: track.title,
      };
    });
    setShowFileCollection(restructuredTrackMap);
    return await loadAudioAndPlay(audioUrl);
  };

  const handleSearch = async () => {
    setIsLoading(true);
    if (currentSong) {
      await clearAudioFromStorage();
      setExpandedDetails(false);
      // setExploreViewActive(false);
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
          await loadAudioAndPlay(audioUrl);
          setCurrentSongFile(audioFile);
          setCurrentPlayingSongIndex(0);

          return; // this return statement ends the loop (through the retrieved shows and plays the first)
          // removing this return will loop through all retrieved shows (if we need to assign priority to certain sources this can be leveraged)
        }
      }
    } catch (error) {
      console.error("Error fetching Grateful Dead song:", error);
    }
  };

  const previousSongAction = async () => {
    if (currentPlayingSongIndex === 0) {
      return;
    }
    setIsLoading(true);
    const newIndex = currentPlayingSongIndex - 1;
    if (currentSong) {
      await clearAudioFromStorage();
    }
    const newSelectedSong = showFileCollection[newIndex];
    setCurrentSongFile(newSelectedSong);
    const audioUrl = `https://archive.org/download/${showId}/${newSelectedSong.name}`;
    await loadAudioAndPlay(audioUrl);
    setCurrentPlayingSongIndex(newIndex);
  };

  const nextSongAction = async () => {
    if (currentPlayingSongIndex === showFileCollection?.length - 1) {
      // for now this action is disabled
      // eventually this will trigger the 'next album' to play as this means this is the final track in a show
      return;
    }
    setIsLoading(true);
    const newIndex = currentPlayingSongIndex + 1;
    if (currentSong) {
      await clearAudioFromStorage();
    }
    const newSelectedSong = showFileCollection[newIndex];
    setCurrentSongFile(newSelectedSong);
    const audioUrl = `https://archive.org/download/${showId}/${newSelectedSong.name}`;
    await loadAudioAndPlay(audioUrl);
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
      {exploreViewActive && (
        <>
          <XStack jc="space-between" ai="center" mb="$3">
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
              disabled={isLoading}
              onPress={handleSearch}
              style={{
                backgroundColor: theme?.$buttonBg?.val,
                borderRadius: 90,
                padding: 8,
              }}
            >
              <Ionicons name="search" size={24} color="$icon" />
            </Touchable>
            {/* <Touchable
      onPress={toggleExploreView}
      style={exploreViewActive ? glowingButtonStyles : normalButtonStyles}
    >
      <Ionicons name="planet-outline" size={24} color="$icon" />
    </Touchable> */}
            {/* <Touchable
      onPress={toggleTheme}
      style={{
        backgroundColor: theme?.$buttonBg?.val,
        borderRadius: 90,
        padding: 8,
        marginRight: 8,
      }}
    >
      <Ionicons name="moon-outline" size={24} color="$icon" />
    </Touchable> */}
          </XStack>
          <Explorer
            isLoading={isLoading}
            setSelectedShow={(show) => {
              setSelectedShow(show);
              setExploreViewActive(false);
            }}
            setSelectedYear={setSelectedYear}
            selectedYear={selectedYear}
          />
        </>
      )}
      {selectedShow && !exploreViewActive && (
        <ShowDetails
          isLoading={isLoading}
          show={selectedShow}
          onClose={() => {
            setSelectedShow(null);
            setExploreViewActive(true);
          }}
          onSelectTrack={handleSelectedTrack}
        />
      )}
      {(currentSong || showFileCollection) && (
        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          zIndex={10}
          top={isPlayerExpanded ? insets.top : undefined}
        >
          <Player
            isExpanded={isPlayerExpanded}
            togglePlayerSize={togglePlayerSize}
            currentSongFile={currentSongFile}
            currentPlayingSongIndex={currentPlayingSongIndex}
            showFileCollection={showFileCollection}
            duration={duration}
            position={position}
            isPlaying={isPlaying}
            isLoading={isLoading}
            expandedDetails={expandedDetails}
            theme={theme}
            showId={showId}
            imageUrl={imageUrl}
            handleSeek={handleSeek}
            handlePlayPause={handlePlayPause}
            handleExpandDetails={handleExpandDetails}
            previousSongAction={previousSongAction}
            nextSongAction={nextSongAction}
            bottomInset={insets.bottom}
          />
        </YStack>
      )}
    </YStack>
  );
};

export default Home;
