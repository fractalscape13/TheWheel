import React from "react";
import {
  Text,
  YStack,
  XStack,
  Slider,
  styled,
  ScrollView,
  useTheme,
} from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import { formatDate, millisToMinutesAndSeconds } from "@services/utils";
import Touchable from "@components/Touchable";
import { usePlayer } from "../context/PlayerContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CustomTrack = styled(YStack, {
  width: "100%",
  height: 8,
  borderRadius: 10,
  backgroundColor: "$trackBg",
  position: "relative",
});

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
    show,
    handleSeek,
    handlePlayPause,
    previousSongAction,
    nextSongAction,
    trackSelectAction,
  } = usePlayer();
  if (!show) return null;
  return (
    <YStack
      bg="$bg2"
      px="$4"
      pt={isExpanded && insets.top}
      pb={!isExpanded && insets.bottom}
      h={isExpanded ? "100%" : "auto"}
    >
      <XStack jc="space-between" ai="center" pt="$2">
        <XStack>
          {!isExpanded && (
            <Text color="$text">
              {show?.date && formatDate(show?.date, true)}{" - "}
            </Text>
          )}
          <Text color="$text" fs="$2">
            {show?.tracks[currentPlayingSongIndex]?.title || ""}
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
          <Ionicons name={isPlaying ? "pause" : "play"} size={20} />
        </Touchable>
        <Touchable onPress={nextSongAction}>
          <Ionicons
            name="chevron-forward-circle-outline"
            size={28}
            color={theme?.$primary?.val}
          />
        </Touchable>
      </XStack>
      <Text color="$text" fs="$1" alignSelf="center" mb="$1">
        {millisToMinutesAndSeconds(position)} /{" "}
        {millisToMinutesAndSeconds(duration)}
      </Text>
      <Slider
        w="100%"
        mt="$1"
        mb="$3"
        defaultValue={[0]}
        min={0}
        maxValue={duration || 1}
        step={1}
        onSlideEnd={(val) => handleSeek(val[0])}
      >
        <CustomTrack>
          <YStack
            bg="$trackProgress"
            h="100%"
            w={`${(position / duration) * 100}%`}
          />
        </CustomTrack>
      </Slider>
      {isExpanded && show && (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <Text fs="$5" fw="bold" color="$text" ta="center" my="$3">
            {show?.date ? formatDate(show?.date) : ""}
          </Text>
          <Text fs="$3" fw="600" color="$text" ta="center">
            {show?.venue}
          </Text>
          <Text fs="$3" fw="600" color="$text" ta="center" mb="$3">
            {show?.location}
          </Text>
            <YStack ta="center" mt="$3">
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
                      {index + 1}) {track?.title || track?.file}
                    </Text>
                    <Text    
                      color={
                        currentPlayingSongIndex === index
                          ? "$trackProgress"
                          : "$text"
                      }          
                      fs="$3"
                      mt="$2"
                    >
                      {track?.length}
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
