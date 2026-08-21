import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, useWindowDimensions } from "react-native";
import { ScrollView, Text, YStack, XStack, useTheme } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import {
  formatDate,
  formatTrackLength,
  isPlayableShow,
} from "@services/utils";
import {
  isFavorited as isShowFavorited,
  toggleFavoriteShowDate,
} from "@services/favorites";
import Touchable from "@components/Touchable";
import { prefetchItemLocation } from "@services/archiveUrl";
import { Track, Show } from "../types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "../context/PlayerContext";

const formatShowSource = (src?: string) => {
  // One archive record has no identifier at all, which rendered a blank row in
  // the source list with nothing to tell the user what it was.
  if (!src) {
    return <Text>Unlabelled recording</Text>;
  }
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

// The trigger sits above the backdrop, so the current recording stays readable
// while the picker is open.
const BACKDROP_Z = 5;
const PICKER_Z = 10;

type ShowDetailsProps = {
  route: any;
  navigation: any;
};

const ShowDetails: React.FC<ShowDetailsProps> = ({ route, navigation }) => {
  const { show, availableShowsOnSelectedDate, onSelectTrack } = route.params;
  // Comes from the player rather than a route param, which was never passed and
  // left the spinner permanently unreachable.
  const { loadingTrack } = usePlayer();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const theme = useTheme();
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeShow, setActiveShow] = useState<Show | null>(null);

  useEffect(() => {
    setActiveShow(show);
  }, [show]);

  useEffect(() => {
    setIsFavorited(isShowFavorited(show.date));
  }, [show]);

  // Warm the data-node lookup for whatever a tap would play. The user reads this
  // track list for seconds first, which is long enough for the lookup to land —
  // so playback starts on the item's own node instead of waiting on it and
  // falling back to the flaky redirect tier. Re-runs when the picker swaps source.
  useEffect(() => {
    prefetchItemLocation((activeShow ?? show)?.showIdentifier);
  }, [activeShow, show]);

  // A few identifiers appear on more than one archive record, which listed the
  // same recording twice with identical labels — one of the pair sometimes being
  // a stub with no track list. Keep one per identifier, preferring the one that
  // actually has tracks.
  const selectableShows: Show[] = useMemo(() => {
    const shows: Show[] = availableShowsOnSelectedDate ?? [];
    const byIdentifier = new Map<string, Show>();
    shows.forEach((candidate, index) => {
      const key = candidate.showIdentifier ?? `__no-identifier-${index}`;
      const existing = byIdentifier.get(key);
      if (!existing || (!existing.tracks?.length && candidate.tracks?.length)) {
        byIdentifier.set(key, candidate);
      }
    });
    const deduped = Array.from(byIdentifier.values());
    // A recording the player will refuse still rendered a complete, convincing
    // track list here, where every row was a silent no-op. Don't offer one —
    // unless it is all this date has, since an empty picker tells the user even
    // less than a dead one.
    const playable = deduped.filter(isPlayableShow);
    return playable.length ? playable : deduped;
  }, [availableShowsOnSelectedDate]);

  const doMultipleSourcesExist = useMemo(() => {
    return selectableShows.length > 1;
  }, [selectableShows]);

  const handleTrackLoad = (trackIndex: number) => {
    // Must be activeShow: the source picker swaps it, and the track list below
    // renders from activeShow, so playing `show` would play a different source.
    onSelectTrack(trackIndex, activeShow ?? show);
  };

  const toggleFavorite = () => {
    setIsFavorited(toggleFavoriteShowDate(show.date));
  };

  const handleNewShowSelect = (show: Show) => {
    setActiveShow(show);
    setIsOpen(false);
  };

  return (
    <YStack pt={insets.top} bg="$bg" flex={1} px="$3">
      {isOpen && (
        // Catches taps meant as "dismiss", which would otherwise land on the
        // track list still live underneath the picker.
        <Pressable
          onPress={() => setIsOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close recording picker"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.78)",
            zIndex: BACKDROP_Z,
          }}
        />
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
      {/* Anchors the picker to the trigger: venue and location both wrap, so no
       *  fixed offset is right for every show. Margin is here, not on the row,
       *  so the picker hugs the button. */}
      <YStack mb="$4" zIndex={PICKER_Z}>
        <Touchable
          onPress={() => setIsOpen((prevValue) => !prevValue)}
          disabled={!doMultipleSourcesExist}
        >
          <XStack
            bw={doMultipleSourcesExist ? 1 : 0}
            bc="$border"
            py="$2"
            px="$4"
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
        {isOpen && (
          // Bounded and scrollable: one date carries as many as 39 recordings.
          // Sized off the window, not this wrapper, which is only button-tall.
          <YStack
            position="absolute"
            top="100%"
            left={0}
            right={0}
            // White, not "$border": every palette's border is a hairline close to
            // its own background, leaving the picker with no visible edge.
            bw={1}
            bc="white"
            maxHeight={windowHeight * 0.5}
            backgroundColor="$overlay"
            br="$3"
            overflow="hidden"
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {selectableShows.map((show: Show, index: number) => {
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
            </ScrollView>
          </YStack>
        )}
      </YStack>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {!activeShow?.tracks?.length ? (
          <Text fs="$3" color="$text" ta="center" mt="$5">
            No tracks are listed for this recording.
          </Text>
        ) : (
          // The list stays mounted while a track loads. Swapping it for a
          // spinner made the whole show vanish on every tap; the row being
          // loaded shows the spinner in place of its duration instead, and
          // every row stays tappable so a different track can take over.
          activeShow?.tracks?.map((track: Track, index: number) => {
            const isTrackLoading =
              loadingTrack !== null &&
              loadingTrack.index === index &&
              loadingTrack.showIdentifier === activeShow?.showIdentifier;
            return (
              <Touchable
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
                  {isTrackLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={theme?.primary?.val}
                      style={{ marginLeft: 8 }}
                    />
                  ) : (
                    <Text fs="$3" ff="$mono" color="$cardMuted" ml="$2">
                      {formatTrackLength(track.length)}
                    </Text>
                  )}
                </XStack>
              </Touchable>
            );
          })
        )}
      </ScrollView>
    </YStack>
  );
};

export default ShowDetails;
