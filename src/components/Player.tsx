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
import { Audio } from "expo-av";
import { millisToMinutesAndSeconds } from "@services/math";
import Touchable from "@components/Touchable";

type PlayerProps = {
  currentSong: Audio.Sound | null;
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
  <ScrollView px="$3" py="$3" br={8} bc="$buttonBg" bw={1}>
    {currentSongFile && (
      <YStack w="100%" jc="space-between" ai="center" fd="row">
        <Text
          color="$text"
          fs="$3"
          my="$3"
          h="fit-content"
          mr={10}
          w="75%"
          ta="center"
        >
          Now Playing: {currentSongFile?.title || currentSongFile?.name}
        </Text>
        <XStack jc="flex-start" ai="center" w="25%">
          <Touchable
            onPress={handleExpandDetails}
            style={{
              backgroundColor: theme?.$buttonBg?.val,
              borderRadius: 90,
              padding: 5,
              marginRight: 10,
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="$icon"
            />
          </Touchable>
          <Touchable
            onPress={handlePlayPause}
            style={{
              backgroundColor: theme?.$buttonBg?.val,
              borderRadius: 90,
              padding: 5,
            }}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={24}
              color="$icon"
            />
          </Touchable>
        </XStack>
      </YStack>
    )}
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
      <Text color="$icon" padding={15} fs="$5">
        {`${currentPlayingSongIndex + 1} / ${showFileCollection.length}`}
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
      h="auto"
      maxH={200}
      defaultValue={[0]}
      min={0}
      maxValue={duration || 1}
      step={1}
      onSlideEnd={(val) => handleSeek(val[0])}
    >
      {imageUrl ? (
        <CustomTrack h={50} position="relative" bg="$trackProgress" mt={10}>
          <Image
            h="100%"
            br="$8"
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
    {showFileCollection && expandedDetails && (
      <YStack ta="center" mt="$3">
        {showFileCollection.map((track, index: number) => (
          <Text
            key={track.name}
            color={
              currentSongFile?.name == track.name ? "$trackProgress" : "$text"
            }
            fs={currentSongFile?.name == track.name ? "$4" : "$1"}
          >
            {index + 1}) {track.title || track.name}
          </Text>
        ))}
      </YStack>
    )}
  </ScrollView>
);

export default Player;
