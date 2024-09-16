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
  backgroundColor: "$text",
  position: "relative",
});

const Player: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    isExpanded,
    togglePlayerSize,
    currentSongFile,
    currentPlayingSongIndex,
    showFileCollection,
    duration,
    position,
    isPlaying,
    show,
    handleSeek,
    handlePlayPause,
    previousSongAction,
    nextSongAction,
  } = usePlayer();
  if (!currentSongFile) return null;
  return (
    <YStack
      bg="$background"
      px="$4"
      pt={isExpanded && insets.top}
      pb={!isExpanded && insets.bottom}
      h={isExpanded ? "100%" : "auto"}
    >
      <XStack jc="space-between" ai="center" pt="$2">
        <Touchable
          onPress={handlePlayPause}
          hitSlop={10}
          style={{
            backgroundColor: theme?.$buttonBg?.val,
            borderRadius: 99,
            padding: 6,
          }}
        >
          <Ionicons name={isPlaying ? "pause" : "play"} size={20} />
        </Touchable>
        <Text color="$text" fs="$4" w="75%" ta="center">
          {currentSongFile?.title || currentSongFile?.name}
        </Text>
        <Touchable onPress={togglePlayerSize} hitSlop={15}>
          <Ionicons
            name={isExpanded ? "chevron-down-outline" : "chevron-up-outline"}
            size={24}
            color={theme?.$icon?.val}
          />
        </Touchable>
      </XStack>
      <XStack ai="center" jc="center">
        <Touchable onPress={previousSongAction}>
          <Ionicons
            name="chevron-back-circle-outline"
            size={24}
            color={theme?.$buttonBg?.val}
          />
        </Touchable>
        <Text color="$icon" px={15} fs="$3">
          {`${currentPlayingSongIndex + 1} / ${showFileCollection.length}`}{" "}
        </Text>
        <Touchable onPress={nextSongAction}>
          <Ionicons
            name="chevron-forward-circle-outline"
            size={24}
            color={theme?.$buttonBg?.val}
          />
        </Touchable>
      </XStack>
      <XStack jc="center" mt="$1">
        {!isExpanded && (
          <Text color="$text" ta="center" position="absolute" left={0}>
            {show?.date && formatDate(show?.date, true)}
          </Text>
        )}
        <Text color="$text">
          {millisToMinutesAndSeconds(position)} /{" "}
          {millisToMinutesAndSeconds(duration)}
        </Text>
      </XStack>
      <Slider
        w="100%"
        my="$3"
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
            {formatDate(show?.date)}
          </Text>
          <Text fs="$3" fw="600" color="$text" ta="center" mb="$3">
            {show?.venue} - {show?.location}
          </Text>
          {showFileCollection && (
            <YStack ta="center" mt="$3">
              {showFileCollection?.map((track, index: number) => (
                <Text
                  key={track?.name}
                  color={
                    currentPlayingSongIndex === index
                      ? "$trackProgress"
                      : "$text"
                  }
                  fs="$3"
                  mt="$2"
                >
                  {index + 1}) {track?.title || track?.name}
                </Text>
              ))}
            </YStack>
          )}
        </ScrollView>
      )}
    </YStack>
  );
};

export default Player;
