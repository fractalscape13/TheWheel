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
    setShow,
    loadAudioAndPlay,
  } = usePlayer();
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number>(1965);
  const handleSelectedTrack = async (
    audioUrl: string,
    show: Show,
  ) => {
    setShow(show);
    await loadAudioAndPlay(audioUrl);
  };
  return (
    <YStack
      flex={1}
      bg="$bg"
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
