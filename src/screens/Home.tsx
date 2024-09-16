import React, { useState } from "react";
import { YStack } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "../context/PlayerContext";
import Explorer from "@components/Explorer";
import SearchBar from "@components/SearchBar";
import { Show } from "../types";

const Home = ({ navigation }: { navigation: any }) => {
  const insets = useSafeAreaInsets();
  const {
    isLoading,
    setShowFileCollection,
    setShowId,
    setShow,
    loadAudioAndPlay,
    setCurrentPlayingSongIndex,
    setCurrentSongFile,
  } = usePlayer();
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const handleSelectedTrack = async (
    locatedTrackIndex: number,
    tracks: any[],
    audioUrl: string,
    showId: string,
    show: Show,
  ) => {
    setCurrentPlayingSongIndex(locatedTrackIndex);
    setShowId(showId);
    setShow(show);
    setCurrentSongFile(tracks[locatedTrackIndex]);
    const restructuredTrackMap = tracks.map((track) => ({
      name: track.file,
      file: track.file,
      length: track.length,
      title: track.title,
    }));
    setShowFileCollection(restructuredTrackMap);
    await loadAudioAndPlay(audioUrl);
  };
  return (
    <YStack
      flex={1}
      bg="$background"
      px="$3"
      pt={insets.top}
      pb={insets.bottom}
    >
      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isLoading={isLoading}
      />
      <Explorer
        isLoading={isLoading}
        goToShow={(show) => {
          navigation.navigate("ShowDetails", {
            show,
            onSelectTrack: handleSelectedTrack,
          });
        }}
        setSelectedYear={setSelectedYear}
        selectedYear={selectedYear}
        searchTerm={searchTerm}
      />
    </YStack>
  );
};

export default Home;
