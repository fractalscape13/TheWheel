import React, { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { ScrollView, Text, YStack, XStack } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { formatDate } from "@services/utils";
import Touchable from "@components/Touchable";
import { Show, Track } from "../types";
import { FAVORITE_SHOW } from "../constants";

type ShowDetailsProps = {
  onClose: () => void;
  show: Show;
};

const ShowDetails: React.FC<ShowDetailsProps> = ({ onClose, show }) => {
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);

  useEffect(() => {
    const fetchShowByDateAndVenue = async (
      showDate: string,
      showVenue: string
    ) => {
      const query = encodeURIComponent(
        `Grateful Dead AND date:${showDate} AND venue:"${showVenue}"`
      );
      const url = `https://archive.org/advancedsearch.php?q=${query}&output=json&rows=1`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        const results = data?.response?.docs;
        if (results && results.length > 0) {
          const showId = results[0].identifier;
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
          setTracks(audioTracks);
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
      const favoriteShow = await SecureStore.getItemAsync(FAVORITE_SHOW);
      if (favoriteShow && favoriteShow === show.date) {
        setIsFavorited(true);
      }
    };

    if (show?.date && show?.venue) {
      fetchShowByDateAndVenue(show.date, show.venue);
      checkFavorite();
    }
  }, [show]);

  const toggleFavorite = async () => {
    if (isFavorited) {
      await SecureStore.deleteItemAsync(FAVORITE_SHOW);
      setIsFavorited(false);
    } else {
      await SecureStore.setItemAsync(FAVORITE_SHOW, show.date);
      setIsFavorited(true);
    }
  };

  return (
    <YStack>
      <XStack jc="space-between" ai="center">
        <Touchable onPress={onClose} hitSlop={15}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Touchable>
        <Touchable onPress={toggleFavorite} hitSlop={15}>
          <Ionicons
            name={isFavorited ? "heart" : "heart-outline"}
            size={24}
            color={isFavorited ? "white" : "white"}
          />
        </Touchable>
      </XStack>
      <Text fs="$5" fw="bold" color="$text" ta="center" mb="$2">
        {formatDate(show.date)}
      </Text>
      <Text fs="$3" color="$text" ta="center" mb="$3">
        {show.venue} - {show.location}
      </Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {loading ? (
          <YStack jc="center" ai="center" mt="$5">
            <ActivityIndicator size="small" color="#fff" />
          </YStack>
        ) : (
          tracks?.map((track, index) => (
            <Touchable
              key={`${track.title}-${index}`}
              onPress={() => console.log("Play this audio file-->>>", track.file)}
            >
              <XStack
                bg="$buttonBg"
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
