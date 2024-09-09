import React from "react";
import { ScrollView, Text, YStack, XStack } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import { formatDate } from "@services/utils";
import Touchable from "@components/Touchable";
import { Show } from "../types";

type ShowDetailsProps = {
  onClose: () => void;
  show: Show;
};

const ShowDetails: React.FC<ShowDetailsProps> = ({ onClose, show }) => (
  <YStack >
      <Touchable onPress={onClose} hitSlop={15}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </Touchable>
      <Text fs="$5" fw="bold" color="$text" ta="center" mb="$2">
        {formatDate(show.date)}
      </Text>
    <Text fs="$3" color="$text" ta="center">
      {show.venue} - {show.location}
    </Text>
    <ScrollView>
      {show?.tracks?.map((track, index) => (
        <Touchable key={index}>
          <XStack
            bg="$secondary"
            px="$3"
            py="$2"
            mb="$2"
            br="$3"
            jc="space-between"
          >
            <Text fs="$3">{index + 1}</Text>
            <Text fs="$3" ml="$2" numberOfLines={1} ellipsizeMode="tail">
              {track.title}
            </Text>
          </XStack>
        </Touchable>
      ))}
    </ScrollView>
  </YStack>
);

export default ShowDetails;
