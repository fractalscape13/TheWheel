import React from "react";
import {
  Text,
  YStack,
  XStack,
  Slider,
  ScrollView,
  useTheme,
} from "tamagui";
import { ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  formatDate,
  formatTrackLength,
  secondsToFormattedMinutesSeconds,
  trackLengthToSeconds,
} from "@services/utils";
import Touchable from "@components/Touchable";
import { usePlayer } from "../context/PlayerContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Player: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    isExpanded,
    togglePlayerSize,
    currentPlayingSongIndex,
    duration,
    position,
    isPlaying,
    isBuffering,
    durationIsForCurrentTrack,
    show,
    handleSeek,
    handlePlayPause,
    previousSongAction,
    nextSongAction,
    trackSelectAction,
  } = usePlayer();
  if (!show) return null;

  const activeTrack = show?.tracks?.[currentPlayingSongIndex ?? -1];
  // The native duration is 0 until the remote file has buffered, so fall back to
  // the length the archive already gave us. Avoids a "0:00 / 0:00" bar on every
  // track change.
  // Only trust the native duration once the player is on this track; until then
  // it still describes the previous one, which paired the new title with the old
  // track's length.
  const knownSeconds = trackLengthToSeconds(activeTrack?.length);
  const totalSeconds =
    durationIsForCurrentTrack && duration > 0
      ? duration
      : knownSeconds || duration;
  const sliderMax = Math.max(1, Math.floor(totalSeconds) || 1);

  return (
    <YStack
      bg="$bg2"
      px="$4"
      pt={isExpanded ? insets.top : 0}
      pb={isExpanded ? 0 : insets.bottom}
      h={isExpanded ? "100%" : "auto"}
    >
      <XStack jc="space-between" ai="center" pt="$2">
        <XStack>
          {!isExpanded && (
            <Text color="$text">
              {show?.date && formatDate(show?.date)}
              {" - "}
            </Text>
          )}
          <Text color="$text" fs="$2">
            {activeTrack?.title || activeTrack?.file || ""}
          </Text>
        </XStack>
        <Touchable onPress={togglePlayerSize} hitSlop={15}>
          <Ionicons
            name={isExpanded ? "chevron-down-outline" : "chevron-up-outline"}
            size={24}
            color={theme?.$icon?.val}
          />
        </Touchable>
      </XStack>
      <XStack ai="center" jc="space-evenly">
        <Touchable onPress={previousSongAction}>
          <Ionicons
            name="chevron-back-circle-outline"
            size={28}
            color={theme?.$primary?.val}
          />
        </Touchable>
        <Touchable
          onPress={handlePlayPause}
          hitSlop={10}
          style={{
            backgroundColor: theme?.$primary?.val,
            borderRadius: 99,
            padding: 6,
            marginBottom: 4,
          }}
        >
          {isBuffering ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Ionicons name={isPlaying ? "pause" : "play"} size={20} />
          )}
        </Touchable>
        <Touchable onPress={nextSongAction}>
          <Ionicons
            name="chevron-forward-circle-outline"
            size={28}
            color={theme?.$primary?.val}
          />
        </Touchable>
      </XStack>
      <Text color="$text" fs="$1" ff="$mono" alignSelf="center" mb="$1">
        {secondsToFormattedMinutesSeconds(position)}
        {" / "}
        {secondsToFormattedMinutesSeconds(totalSeconds)}
      </Text>
      <Slider
        w="100%"
        mt="$1"
        mb="$3"
        size="$2"
        min={0}
        max={sliderMax}
        step={1}
        value={[Math.min(Math.floor(position), sliderMax)]}
        onSlideEnd={(_, value) => handleSeek(value)}
      >
        <Slider.Track h={8} br={10} bg="$trackBg">
          <Slider.TrackActive bg="$trackProgress" />
        </Slider.Track>
        <Slider.Thumb index={0} circular size="$1" bg="$primary" />
      </Slider>
      {isExpanded && show && (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <Text
            fs="$5"
            lh="$5"
            fw="700"
            ff="$heading"
            color="$text"
            ta="center"
            my="$3"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {show?.date ? formatDate(show?.date) : ""}
          </Text>
          <Text fs="$3" fw="600" color="$text" ta="center">
            {show?.venue}
          </Text>
          <Text fs="$3" fw="600" color="$text" ta="center" mb="$3">
            {show?.location}
          </Text>
          <YStack mt="$3">
            {show?.tracks?.map((track, index: number) => (
              <Touchable
                onPress={() => trackSelectAction(index)}
                key={track?.file}
              >
                <XStack jc="space-between" ai="center" fd="row" w="100%">
                  <Text
                    color={
                      currentPlayingSongIndex === index
                        ? "$trackProgress"
                        : "$text"
                    }
                    fs="$3"
                    mt="$2"
                  >
                    {index + 1} {track?.title || track?.file}
                  </Text>
                  <Text
                    color={
                      currentPlayingSongIndex === index
                        ? "$trackProgress"
                        : "$text"
                    }
                    fs="$3"
                    ff="$mono"
                    mt="$2"
                  >
                    {formatTrackLength(track?.length)}
                  </Text>
                </XStack>
              </Touchable>
            ))}
          </YStack>
        </ScrollView>
      )}
    </YStack>
  );
};

export default Player;
