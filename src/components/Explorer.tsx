import { Text, YStack, useTheme, ScrollView, XStack } from "tamagui";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Touchable from "@components/Touchable";
import { formatDate } from "@services/utils";
import { Show } from "../types";
import * as SecureStore from "expo-secure-store";
import { FAVORITE_SHOWS } from "../constants";
import { getSelectedYearData } from "@services/yearsService";
import { years } from "@services/utils";
import { Ionicons } from "@expo/vector-icons";

type ExplorerProps = {
  goToShow: (show: Show | null, availableShowsOnSelectedDate: any) => void;
  setSelectedYear: (year: number) => void;
  selectedYear: number;
  isLoading: boolean;
  searchTerm: string | undefined;
};

const Explorer: React.FC<ExplorerProps> = ({
  goToShow,
  setSelectedYear,
  selectedYear,
  searchTerm,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const theme = useTheme();
  const [favoriteShows, setFavoriteShows] = useState<Show[]>([]);

  const navigation = useNavigation();

  const filterShows = (shows: Show[]) => {
    if (searchTerm && searchTerm.length > 0) {
      return shows.filter(
        (show) =>
          show.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
          show.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          show.date.includes(searchTerm)
      );
    }
    return shows;
  };

  const getUniqueByDate = (array: []) => {
    const seenDates = new Set();
    return array.filter((show: Show) => {
      const date = show.date;
      if (seenDates.has(date)) {
        return false;
      }
      seenDates.add(date);
      return true;
    });
  };

  const activeCollection = useMemo(() => {
    return getSelectedYearData(selectedYear);
  }, [selectedYear]);

  const uniqueShowDates = useMemo(() => {
    if (activeCollection) {
      return getUniqueByDate(activeCollection);
    } else {
      return null;
    }
  }, [activeCollection]);

  const handleShowSelect = (show: Show) => {
    const allAvailableShowsOnSelectedDate = activeCollection.filter(
      (unfilteredShow) => unfilteredShow.date === show.date
    );
    const isFavorite = favoriteShows.includes(show.date) || false;
    return goToShow(show, allAvailableShowsOnSelectedDate);
  };

  const handleFavoriteShowSelect = (show: Show) => {
    const year = parseInt(show.date.split("-")[0]) || null;
    if (year) {
      const collection = getSelectedYearData(year);
      const allAvailableShowsOnSelectedDate = collection.filter(
        (unfilteredShow) => unfilteredShow.date === show.date
      );
      return goToShow(show, allAvailableShowsOnSelectedDate);
    }
  };

  const handleSelectYear = (year: number) => {
    if (year !== selectedYear) {
      setSelectedYear(year);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
    }
  };

  const filteredFavoriteShows = useMemo(() => {
    if (favoriteShows && searchTerm) {
      return filterShows(favoriteShows);
    }
    return favoriteShows;
  }, [favoriteShows, searchTerm]);

  const fetchFavoriteShows = async () => {
    const favoriteShowDatesString = await SecureStore.getItemAsync(
      FAVORITE_SHOWS
    );
    if (favoriteShowDatesString) {
      const favoriteShowDates = JSON.parse(favoriteShowDatesString);
      const favorites = favoriteShowDates;
      let foundShows: Show[] = [];
      favorites.forEach((favoritedShowDate: string) => {
        const year = parseInt(favoritedShowDate.split("-")[0]) || null;
        if (year) {
          const collection = getSelectedYearData(year);
          const foundShow = collection.find(
            (show) => show.date === favoritedShowDate
          );
          if (foundShow) {
            foundShows.push(foundShow);
          }
        }
      });

      if (foundShows.length > 0) {
        setFavoriteShows(foundShows);
      } else {
        console.error("No favorite shows found in collectionSelection.");
      }
    }
  };

  useEffect(() => {
    if (selectedYear === 0) {
      fetchFavoriteShows();
    }
  }, [selectedYear]);

  useFocusEffect(
    React.useCallback(() => {
      fetchFavoriteShows();
    }, [])
  );

  return (
    <YStack>
      <Text color="$text" fs="$3" mb="$2">
        Select year
      </Text>
      <ScrollView
        horizontal
        contentContainerStyle={{ paddingLeft: 18, marginBottom: 12 }}
      >
        <Touchable
          style={{
            backgroundColor:
              selectedYear === 0 ? "white" : theme?.$buttonBg?.val,
            borderRadius: 8,
            marginRight: 6,
            height: 30,
            width: 60,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => handleSelectYear(0)}
          children={
            <Text
              fs="$3"
              fw="bold"
              color={selectedYear === 0 ? "black" : "white"}
            >
              <Ionicons
                name={"heart"}
                size={18}
                color={selectedYear === 0 ? "black" : "white"}
              />
            </Text>
          }
        />
        {years?.map((year: number) => (
          <Touchable
            key={year}
            style={{
              backgroundColor:
                year === selectedYear ? "white" : theme?.$buttonBg?.val,
              borderRadius: 8,
              marginRight: 6,
              height: 30,
              width: 60,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => handleSelectYear(year)}
            children={
              <Text
                fs="$3"
                fw="bold"
                color={year === selectedYear ? "black" : "white"}
              >
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
          {uniqueShowDates.map((show: Show, index: number) => (
            <Touchable
              key={`${show.date}-${index}`}
              onPress={() => handleShowSelect(show)}
            >
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
      ) : selectedYear === 0 && filteredFavoriteShows?.length > 0 ? (
        <YStack>
          <Text fs="$3" fw="bold" my="$2" color="$text">
            Favorites
          </Text>
          {filteredFavoriteShows.map((show, index) => (
            <Touchable
              onPress={() => handleFavoriteShowSelect(show)}
              key={`${index}-${show.date}`}
            >
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
        </YStack>
      ) : (
        <YStack>
          <Text color="$text">
            This is default state, no selected year and no favorited shows
          </Text>
          <Text color="$text">Add a call to action here? Graphic?</Text>
        </YStack>
      )}
    </YStack>
  );
};

export default Explorer;
