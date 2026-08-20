import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator } from "react-native";
import { ScrollView, Text, YStack, XStack, useTheme } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { formatDate } from "@services/utils";
import Touchable from "@components/Touchable";
import { Track, Show } from "../types";
import { FAVORITE_SHOWS } from "../constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "../context/PlayerContext";

const formatShowSource = (src?: string) => {
  if (src?.toLowerCase()?.includes("sbd")) {
    return (
      <>
        <Text fw="700">SBD </Text> {src.replace(".sbd", "") || src}
      </>
    );
  } else if (src?.toLowerCase()?.includes("aud")) {
    return (
      <>
        <Text fw="700">AUD </Text> {src.replace(".aud", "") || src}
      </>
    );
  }
  return <Text>{src}</Text>;
};

type ShowDetailsProps = {
  route: any;
  navigation: any;
};

const ShowDetails: React.FC<ShowDetailsProps> = ({ route, navigation }) => {
  const { show, availableShowsOnSelectedDate, onSelectTrack } = route.params;
  // Comes from the player rather than a route param, which was never passed and
  // left the spinner permanently unreachable.
  const { isLoading } = usePlayer();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeShow, setActiveShow] = useState<Show | null>(null);

  useEffect(() => {
    setActiveShow(show);
  }, [show]);

  const checkFavoriteStatus = async (show: Show) => {
    try {
      const favoriteShowsString = await SecureStore.getItemAsync(
        FAVORITE_SHOWS
      );
      let favoriteShows: string[] = favoriteShowsString
        ? JSON.parse(favoriteShowsString)
        : [];

      setIsFavorited(favoriteShows.includes(show.date));
    } catch (error) {
      console.error("Error getting favorite shows:", error);
    }
  }

  useEffect(() => {
    checkFavoriteStatus(show);
  }, [show]);

  const doMultipleSourcesExist = useMemo(() => {
    return (availableShowsOnSelectedDate?.length ?? 0) > 1;
  }, [availableShowsOnSelectedDate]);

  const handleTrackLoad = (trackIndex: number) => {
    // Must be activeShow: the source picker swaps it, and the track list below
    // renders from activeShow, so playing `show` would play a different source.
    onSelectTrack(trackIndex, activeShow ?? show);
  };

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

  const handleNewShowSelect = (show: Show) => {
    setActiveShow(show);
    setIsOpen(false);
  };

  return (
    <YStack pt={insets.top} bg="$bg" flex={1} px="$3">
      {isOpen && (
        <YStack
          bw={1}
          position="absolute"
          top={insets.top + 145}
          left={18}
          right={18}
          backgroundColor="$overlay"
          z="$4"
          br="$3"
          overflow="hidden"
        >
          {availableShowsOnSelectedDate?.map((show: Show, index: number) => {
            return (
              <Touchable
                style={{ width: "100%" }}
                key={`${show.showIdentifier}-${index}`}
                onPress={() => handleNewShowSelect(show)}
                hitSlop={5}
              >
                <XStack
                  bg="$sheetBg"
                  px="$3"
                  py="$3"
                  jc="center"
                  ai="center"
                  borderBottomWidth={1}
                  borderBottomColor="$border"
                >
                  <Text
                    z="$3"
                    fs="$3"
                    color="$sheetText"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    flex={1}
                  >
                    {formatShowSource(show.showIdentifier)}
                  </Text>
                </XStack>
              </Touchable>
            );
          })}
        </YStack>
      )}
      <XStack jc="space-between" ai="center">
        <Touchable onPress={() => navigation.goBack()} hitSlop={15}>
          <Ionicons name="arrow-back" size={28} color={theme?.text?.val} />
        </Touchable>
        <XStack jc="center" ai="center" h="100%">
          <Touchable onPress={toggleFavorite} hitSlop={15}>
            <Ionicons
              name={isFavorited ? "heart" : "heart-outline"}
              size={28}
              color={theme?.primary?.val}
            />
          </Touchable>
        </XStack>
      </XStack>
      <Text
        fs="$5"
        lh="$5"
        fw="700"
        ff="$heading"
        color="$text"
        ta="center"
        mb="$2"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {activeShow?.date ? formatDate(activeShow?.date) : ""}
      </Text>
      <Text fs="$3" color="$text" ta="center">
        {activeShow?.venue}
      </Text>
      <Text fs="$3" color="$text" ta="center" mb="$3">
        {activeShow?.location}
      </Text>
      <Touchable
        onPress={() => setIsOpen((prevValue) => !prevValue)}
        disabled={!doMultipleSourcesExist}
      >
        <XStack
          bw={doMultipleSourcesExist ? 1 : 0}
          bc="$border"
          py="$2"
          px="$4"
          mb="$4"
          br="$4"
          overflow="hidden"
        >
          {doMultipleSourcesExist ? (
            <Ionicons name="chevron-down" size={22} color={theme?.text?.val} />
          ) : null}
          <Text
            fs="$3"
            ml="$3"
            color="$text"
            ta="center"
            numberOfLines={1}
            ellipsizeMode="clip"
          >
            {formatShowSource(activeShow?.showIdentifier)}
          </Text>
        </XStack>
      </Touchable>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {isLoading ? (
          <YStack jc="center" ai="center" mt="$5">
            <ActivityIndicator size="small" color={theme?.primary?.val} />
          </YStack>
        ) : !activeShow?.tracks?.length ? (
          <Text fs="$3" color="$text" ta="center" mt="$5">
            No tracks are listed for this recording.
          </Text>
        ) : (
          activeShow?.tracks?.map((track: Track, index: number) => (
            <Touchable
              disabled={isLoading}
              key={`${track.title}-${index}`}
              onPress={() => handleTrackLoad(index)}
            >
              <XStack
                bg="$card"
                px="$3"
                py="$2"
                mb="$2"
                br={8}
                jc="space-between"
                ai="center"
              >
                <XStack flex={1} ai="center">
                  <Text fs="$3" color="$cardMuted">{index + 1}</Text>
                  <Text
                    fs="$3"
                    ml="$2"
                    color="$cardText"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    flex={1}
                  >
                    {track.title}
                  </Text>
                </XStack>
                <Text fs="$3" ff="$mono" color="$cardMuted" ml="$2">
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
