import React, { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { ScrollView, Text, YStack, XStack } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { formatDate } from "@services/utils";
import Touchable from "@components/Touchable";
import { Track } from "../types";
import { FAVORITE_SHOWS } from "../constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ShowDetailsProps = {
  route: any;
  navigation: any;
};

const ShowDetails: React.FC<ShowDetailsProps> = ({ route, navigation }) => {
  const {
    show,
    availableShowsOnSelectedDate,
    onSelectTrack,
    isLoading = false,
  } = route.params;
  const insets = useSafeAreaInsets();
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [showId, setShowId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeShow, setActiveShow] = useState<any | null>(show);
  const [showDataCollection, setShowDataCollection] = useState<any | null>(
    null
  );

  const handleTrackLoad = (trackFile: string) => {
    if (!isLoading) {
      const locatedTrackIndex = tracks?.findIndex(
        (track) => track["file"] === trackFile
      );
      const audioUrl = `https://archive.org/download/${showId}/${tracks[locatedTrackIndex].file}`;
      onSelectTrack(locatedTrackIndex, tracks, audioUrl, showId, show);
    }
  };

  useEffect(() => {
    const fetchShowByDate = async (showDate: string) => {
      const query = encodeURIComponent(`Grateful Dead AND date:${showDate}"`);
      const url = `https://archive.org/advancedsearch.php?q=${query}&output=json&rows=50`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        const results = data?.response?.docs;
        if (results && results.length > 0) {
          console.log("numberOfShows", results.length);
          results.forEach(async (show, index) => {
            const showId = show.identifier;
            const showResponse = await fetch(
              `https://archive.org/metadata/${showId}`
            );
            const showData = await showResponse.json();
            const audioTracks = showData?.files
              ?.filter((file: any) => file.format.includes("MP3"))
              .map((file: any) => ({
                title: file.title || file.name,
                length: file.length || "N/A",
                file: file.name,
              }));

            if (index === 0) {
              setShowId(showId);
              setShowDataCollection(showData);
              setTracks(audioTracks);
            }

            console.log({
              date: showData.metadata.date,
              location: showData.metadata.coverage,
              venue: showData.metadata.venue,
              showIdentifier: showId,
              source: showData.metadata.source || "N/A",
              type: showData.metadata.type || "N/A",
              tracks: audioTracks,
              index: index,
            });
          });
        } else {
          console.error("No show data found for the specified date and venue.");
        }
      } catch (error) {
        console.error("Error fetching show by date and venue:", error);
      } finally {
        setLoading(false);
      }
    };

    const checkFavorite = async () => {
      const favoriteShowsString = await SecureStore.getItemAsync(
        FAVORITE_SHOWS
      );
      if (favoriteShowsString) {
        const favoriteShows = JSON.parse(favoriteShowsString);
        const isFavorited = favoriteShows.includes(show.date);
        setIsFavorited(isFavorited);
      }
    };

    if (show?.date) {
      fetchShowByDate(show?.date);
      checkFavorite();
    }
  }, [show]);

  const toggleFavorite = async () => {
    try {
      const favoriteShowsString = await SecureStore.getItemAsync(
        FAVORITE_SHOWS
      );
      let favoriteShows: string[] = favoriteShowsString
        ? JSON.parse(favoriteShowsString)
        : [];

      if (isFavorited) {
        favoriteShows = favoriteShows.filter((date) => date !== show.date);
        setIsFavorited(false);
      } else {
        favoriteShows.push(show.date);
        setIsFavorited(true);
      }
      await SecureStore.setItemAsync(
        FAVORITE_SHOWS,
        JSON.stringify(favoriteShows)
      );
    } catch (error) {
      console.error("Error updating favorite shows:", error);
    }
  };

  const handleAlternateShowSelect = async (selectedShow) => {
    setIsOpen(false);
    const showId = selectedShow.showIdentifier;
    const showResponse = await fetch(`https://archive.org/metadata/${showId}`);
    const showData = await showResponse.json();
    const audioTracks = showData?.files
      ?.filter((file: any) => file.format.includes("MP3"))
      .map((file: any) => ({
        title: file.title || file.name,
        length: file.length || "N/A",
        file: file.name,
      }));
    setShowId(showId);
    setShowDataCollection(showData);
    setTracks(audioTracks);
    setActiveShow(selectedShow);
  };

  return (
    <YStack pt={insets.top} bg="$bg" flex={1} px="$3">
      {isOpen && (
        <YStack
          style={{
            position: "absolute",
            bottom: 100,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
          w="100%"
          z="$4"
        >
          {availableShowsOnSelectedDate?.map((show, index: number) => {
            return (
              <Touchable
                w="100%"
                key={`${show.showIdentifier}-${index}`}
                onPress={() => handleAlternateShowSelect(show)}
                hitSlop={15}
              >
                <XStack bg="white" px="$3" py="$2" jc="center" ai="center">
                  <XStack flex={1} ai="center">
                    <Text fs="$3" z="$3">
                      Source -{" "}
                    </Text>
                    <Text
                      z="$3"
                      fs="$3"
                      ml="$2"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      flex={1}
                    >
                      {show.showIdentifier}
                    </Text>
                  </XStack>
                </XStack>
              </Touchable>
            );
          })}
        </YStack>
      )}
      <XStack jc="space-between" ai="center">
        <Touchable onPress={() => navigation.goBack()} hitSlop={15}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </Touchable>
        <XStack jc="center" ai="center" h="100%">
          <Touchable
            onPress={() => setIsOpen((prevValue) => !prevValue)}
            h={28}
            style={{ minWidth: 20, marginRight: 10, }}
            hitSlop={15}
          >
            <Text bg="$secondary" ta="center" color="$textSecondary">
              {availableShowsOnSelectedDate?.length}
            </Text>
          </Touchable>
          <Touchable onPress={toggleFavorite} hitSlop={15}>
            <Ionicons
              name={isFavorited ? "heart" : "heart-outline"}
              size={28}
              color={isFavorited ? "white" : "white"}
            />
          </Touchable>
        </XStack>
      </XStack>
      <Text fs="$5" fw="bold" color="$text" ta="center" mb="$2">
        {formatDate(activeShow?.date)}
      </Text>
      <Text fs="$3" color="$text" ta="center">
        {activeShow?.venue}
      </Text>
      <Text fs="$3" color="$text" ta="center" mb="$3">
        {activeShow?.location}
      </Text>
      <Text fs="$3" color="$text" ta="center" mb="$3">
        {activeShow?.showIdentifier}
      </Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {loading ? (
          <YStack jc="center" ai="center" mt="$5">
            <ActivityIndicator size="small" color="#fff" />
          </YStack>
        ) : (
          tracks?.map((track, index) => (
            <Touchable
              disabled={isLoading}
              key={`${track.title}-${index}`}
              onPress={() => handleTrackLoad(track.file)}
            >
              <XStack
                bg="$secondary"
                px="$3"
                py="$2"
                mb="$2"
                br={8}
                jc="space-between"
                ai="center"
              >
                <XStack flex={1} ai="center">
                  <Text fs="$3">{index + 1}</Text>
                  <Text
                    fs="$3"
                    ml="$2"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    flex={1}
                  >
                    {track.title}
                  </Text>
                </XStack>
                <Text fs="$3" color="$textSecondary" ml="$2">
                  {track.length}
                </Text>
              </XStack>
            </Touchable>
          ))
        )}
      </ScrollView>
    </YStack>
  );
};

export default ShowDetails;
