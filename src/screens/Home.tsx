import React, { useState } from "react";
import { YStack } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "../context/PlayerContext";
import Explorer from "@components/Explorer";
import SearchBar from "@components/SearchBar";
import { Show } from "../types";
import { SCREEN_PADDING, TODAY_TAB } from "../constants";

const Home = ({ navigation }: { navigation: any }) => {
  const insets = useSafeAreaInsets();
  const { loadAudioAndPlay } = usePlayer();
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  // Defaults to today's shows; Explorer switches to Favorites if any exist.
  const [selectedYear, setSelectedYear] = useState<number>(TODAY_TAB);
  // No setShow here: loadAudioAndPlay sets it *after* validating that the
  // recording is playable. Setting it up front bound the player bar to
  // recordings that never load, leaving it showing a show and a track title
  // unrelated to the audio actually playing.
  const handleSelectedTrack = async (selectedIndex: number, show: Show) => {
    await loadAudioAndPlay(show, selectedIndex);
  };
  return (
    <YStack flex={1} bg="$bg" px={SCREEN_PADDING} pt={insets.top} pb={insets.bottom}>
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <Explorer
        goToShow={(show, availableShowsOnSelectedDate) => {
          navigation.navigate("ShowDetails", {
            show,
            availableShowsOnSelectedDate,
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
