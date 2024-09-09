import { Text, YStack, useTheme, ScrollView, XStack } from "tamagui";
import React, { useMemo, useRef } from "react";
import { years, collectionSelection } from "@services/dataValidationUtils";
import Touchable from "@components/Touchable";
import { formatDate } from "@services/utils";
import { Show } from "../types";

type ExplorerProps = {
  setSelectedShow: (show: Show) => void;
  setSelectedYear: (year: number) => void;
  selectedYear: number | null;
};

const Explorer: React.FC<ExplorerProps> = ({
  setSelectedShow,
  setSelectedYear,
  selectedYear,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const theme = useTheme();
  const activeCollection = useMemo(() => {
    if (selectedYear && collectionSelection) {
      const key = `showCollection${selectedYear}`;
      return collectionSelection[key] || null;
    }
    return null;
  }, [selectedYear]);
  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  };
  return (
    <YStack>
      <Text color="$text" fs="$3" mb="$2">
        Select Year
      </Text>
      <ScrollView
        horizontal
        contentContainerStyle={{ paddingLeft: 24, marginBottom: 12 }}
      >
        {years.map((year: number) => (
          <Touchable
            key={year}
            style={{
              backgroundColor:
                year === selectedYear ? "white" : theme?.$buttonBg?.val,
              borderRadius: 8,
              marginRight: 6,
            }}
            onPress={() => handleSelectYear(year)}
            children={
              <Text fs="$3" fw="bold" py="$2" px="$4">
                {year}
              </Text>
            }
          />
        ))}
      </ScrollView>
      {activeCollection && (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 300 }}
          ref={scrollViewRef}
        >
          {activeCollection.map((show: Show) => (
            <Touchable onPress={() => setSelectedShow(show)}>
              <YStack
                key={show.date}
                bg="$secondary"
                px="$3"
                py="$2"
                mb="$3"
                br="$3"
                shadowColor="$shadowColor"
                shadowRadius={3}
                shadowOpacity={0.2}
              >
                <Text fs="$3" mb="$1" fw="bold">
                  {formatDate(show.date)}
                </Text>
                <XStack jc="space-between" ai="center" maxW="100%">
                  <Text
                    fs="$2"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    maxW="100%"
                  >
                    {show.venue}
                  </Text>
                  <Text fs="$2" ml="$2" numberOfLines={1} ellipsizeMode="tail">
                    {show.location}
                  </Text>
                </XStack>
              </YStack>
            </Touchable>
          ))}
        </ScrollView>
      )}
    </YStack>
  );
};

export default Explorer;
