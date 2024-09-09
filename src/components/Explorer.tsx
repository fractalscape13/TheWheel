import { Text, YStack, useTheme, ScrollView, XStack } from "tamagui";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { years, collectionSelection } from "@services/dataValidationUtils";
import Touchable from "@components/Touchable";
import { formatDate } from "@services/utils";
import { Show } from "../types";
import * as SecureStore from "expo-secure-store";
import { FAVORITE_SHOW } from "../constants";

type ExplorerProps = {
  setSelectedShow: (show: Show) => void;
  setSelectedYear: (year: number | null) => void;
  selectedYear: number | null;
};

const Explorer: React.FC<ExplorerProps> = ({
  setSelectedShow,
  setSelectedYear,
  selectedYear,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const theme = useTheme();
  const [favoriteShow, setFavoriteShow] = useState<Show | null>(null);
  const activeCollection = useMemo(() => {
    if (selectedYear && collectionSelection) {
      const key = `showCollection${selectedYear}`;
      return collectionSelection[key] || null;
    }
    return null;
  }, [selectedYear]);
  const handleSelectYear = (year: number) => {
    if (year === selectedYear) {
      setSelectedYear(null);
    } else {
      setSelectedYear(year);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
    }
  };
  useEffect(() => {
    const fetchFavoriteShow = async () => {
      const favoriteShowDate = await SecureStore.getItemAsync(FAVORITE_SHOW);
      if (favoriteShowDate) {
        let foundShow: Show | null = null;
        for (const year in collectionSelection) {
          const showsInYear = collectionSelection[year];
          foundShow = showsInYear.find(
            (show: Show) => show.date === favoriteShowDate
          );
          if (foundShow) break;
        }
        if (foundShow) {
          setFavoriteShow(foundShow);
        } else {
          console.error("Favorite show not found in collectionSelection.");
        }
      }
    };
    fetchFavoriteShow();
  }, []);
  return (
    <YStack>
      <Text color="$text" fs="$3" mb="$2">
        Select year
      </Text>
      <ScrollView
        horizontal
        contentContainerStyle={{ paddingLeft: 18, marginBottom: 12 }}
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
      {activeCollection && selectedYear ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 300 }}
          ref={scrollViewRef}
        >
          {activeCollection.map((show: Show) => (
            <Touchable key={show.date} onPress={() => setSelectedShow(show)}>
              <YStack
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
      ) : favoriteShow ? (
        <YStack>
          <Text fs="$3" fw="bold" my="$2" color="$text">
            Favorites
          </Text>
          <Touchable onPress={() => setSelectedShow(favoriteShow)}>
            <YStack
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
                {formatDate(favoriteShow.date)}
              </Text>
              <XStack jc="space-between" ai="center" maxW="100%">
                <Text
                  fs="$2"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxW="100%"
                >
                  {favoriteShow.venue}
                </Text>
                <Text fs="$2" ml="$2" numberOfLines={1} ellipsizeMode="tail">
                  {favoriteShow.location}
                </Text>
              </XStack>
            </YStack>
          </Touchable>
        </YStack>
      ) : (
        <Text color="$text" fs="$3" mt="$3">
          You can't go back and you can't stand still
        </Text>
      )}
    </YStack>
  );
};

export default Explorer;
