import React from "react";
import {
  Text,
  YStack,
  XStack,
  Image,
  Slider,
  styled,
  ScrollView,
} from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import { millisToMinutesAndSeconds } from "@services/math";
import Touchable from "@components/Touchable";

type PlayerProps = {
  isExpanded: boolean;
  togglePlayerSize: () => void;
  currentSongFile: any;
  currentPlayingSongIndex: number;
  showFileCollection: any[];
  duration: number;
  position: number;
  isPlaying: boolean;
  expandedDetails: boolean;
  theme: any;
  showId: number | null;
  imageUrl: string | null;
  handleSeek: (value: number) => Promise<void>;
  handlePlayPause: () => Promise<void>;
  handleExpandDetails: () => void;
  previousSongAction: () => Promise<void>;
  nextSongAction: () => Promise<void>;
};

const CustomTrack = styled(YStack, {
  width: "100%",
  height: 8,
  borderRadius: 10,
  backgroundColor: "$text",
  position: "relative",
});

const Player: React.FC<PlayerProps> = ({
  isExpanded,
  togglePlayerSize,
  currentSongFile,
  currentPlayingSongIndex,
  showFileCollection,
  duration,
  position,
  isPlaying,
  expandedDetails,
  theme,
  showId,
  imageUrl,
  handleSeek,
  handlePlayPause,
  handleExpandDetails,
  previousSongAction,
  nextSongAction,
}) => (
  <YStack
    px="$3"
    py="$3"
    h={isExpanded ? "100%" : "auto"}
  >
    <XStack jc="space-between" ai="center">
      <Touchable
        onPress={handlePlayPause}
        style={{
          backgroundColor: theme?.$buttonBg?.val,
          borderRadius: 99,
          padding: 6,
        }}
      >
        <Ionicons name={isPlaying ? "pause" : "play"} size={20} />
      </Touchable>
      <Text color="$text" fs="$3" h="fit-content" w="75%" ta="center">
        {currentSongFile?.title || currentSongFile?.name}
      </Text>
      <Touchable onPress={togglePlayerSize} hitSlop={15}>
        <Ionicons
          name={isExpanded ? "chevron-down-outline" : "chevron-up-outline"}
          size={24}
          color={theme.icon.val}
        />
      </Touchable>
    </XStack>
    <XStack jc="flex-start" ai="center"></XStack>
    <Text color="$text" mt="$2">
      {millisToMinutesAndSeconds(position)} /{" "}
      {millisToMinutesAndSeconds(duration)}
    </Text>
    <XStack ai="center" jc="center">
      <Touchable onPress={previousSongAction}>
        <Ionicons
          name="chevron-back-circle-outline"
          size={24}
          color={theme?.$buttonBg?.val}
        />
      </Touchable>
      <Text color="$icon" px={15} fs="$3">
        Track {`${currentPlayingSongIndex + 1} / ${showFileCollection.length}`}
      </Text>
      <Touchable onPress={nextSongAction}>
        <Ionicons
          name="chevron-forward-circle-outline"
          size={24}
          color={theme?.$buttonBg?.val}
        />
      </Touchable>
    </XStack>
    <Slider
      w="100%"
      h={30}
      defaultValue={[0]}
      min={0}
      maxValue={duration || 1}
      step={1}
      onSlideEnd={(val) => handleSeek(val[0])}
    >
      {imageUrl ? (
        <CustomTrack h={30} position="relative" bg="$trackProgress" mt={10}>
          <Image
            h="100%"
            source={{ uri: imageUrl }}
            resizeMode="fill"
          />
          <YStack
            bg="$trackBg"
            h="100%"
            w={`${(position / duration) * 100}%`}
            position="absolute"
            top="0"
            left="0"
            o="0.4"
          />
        </CustomTrack>
      ) : (
        <CustomTrack>
          <YStack
            bg="$trackProgress"
            h="100%"
            w={`${(position / duration) * 100}%`}
          />
        </CustomTrack>
      )}
    </Slider>
    {isExpanded && (
      <ScrollView>
        {showFileCollection && isExpanded && (
          <YStack ta="center" mt="$3">
            {showFileCollection.map((track, index: number) => (
              <Text
                key={track.name}
                color={
                  currentSongFile?.name == track.name
                    ? "$trackProgress"
                    : "$text"
                }
                fs="$3"
                mt="$1"
              >
                {index + 1}) {track.title || track.name}
              </Text>
            ))}
          </YStack>
        )}
      </ScrollView>
    )}
  </YStack>
);

export default Player;
