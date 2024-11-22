import { Text, YStack, useTheme, ScrollView, XStack } from "tamagui";
import React, { useMemo, useRef, useState, useEffect } from "react";

import Touchable from "@components/Touchable";
import { formatDate } from "@services/utils";
import { Show } from "../types";
import * as SecureStore from "expo-secure-store";
import { FAVORITE_SHOWS } from "../constants";
import { getSelectedYearData } from "@services/yearsService"
import { years } from "@services/utils"


type ExplorerProps = {
  goToShow: (show: Show | null, availableShowsOnSelectedDate:any) => void;
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

  const activeCollection = useMemo(() => {
    return getSelectedYearData(selectedYear);
  }, [selectedYear]);

  const uniqueShowDates = useMemo(() => {
    const getUniqueByDate = (array:[]) => {
      const seenDates = new Set();
      return array.filter(show => {
        const date = show.date;
        if (seenDates.has(date)) {
          return false;
        }
        seenDates.add(date);
        return true;
      });
    };
    
    return getUniqueByDate(activeCollection);
  }, [activeCollection]);

  const handleShowSelect = show => {
    const allAvailableShowsOnSelectedDate = activeCollection.filter(unfilteredShow => unfilteredShow.date === show.date);
    return goToShow(show, allAvailableShowsOnSelectedDate);
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

  useEffect(() => {
    const fetchFavoriteShows = async () => {
      const favoriteShowDatesString = await SecureStore.getItemAsync(
        FAVORITE_SHOWS
      );
      if (favoriteShowDatesString) {
        const favoriteShowDates = JSON.parse(favoriteShowDatesString);
        const foundShows: Show[] = [];
     
        // to do: replace with update logic 
        // fix favorite shows by locating shows here
        
        if (foundShows.length > 0) {
          setFavoriteShows(foundShows);
        } else {
          console.error("No favorite shows found in collectionSelection.");
        }
      }
    };
    fetchFavoriteShows();
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
              <Text fs="$3" fw="bold" color={year === selectedYear ?  "black" : "white"}>
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
      ) : (
        filteredFavoriteShows?.length > 0 && (
          <YStack>
            <Text fs="$3" fw="bold" my="$2" color="$text">
              Favorites
            </Text>
            {filteredFavoriteShows.map((show, index) => (
              <Touchable
                onPress={() => handleShowSelect(show)}
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
                    <Text
                      fs="$2"
                      ml="$2"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {show.location}
                    </Text>
                  </XStack>
                </YStack>
              </Touchable>
            ))}
          </YStack>
        )
      )}
    </YStack>
  );
};

export default Explorer;
