import { Text, YStack, useTheme, ScrollView, XStack } from "tamagui";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { years, collectionSelection } from "@services/dataValidationUtils";
import { showBones1965 } from "@services/1965-bones"; 
import { showBones1966 } from "@services/1966-bones"; 
import { showBones1967 } from "@services/1967-bones"; 
import { showBones1968 } from "@services/1968-bones"; 
import { showBones1969 } from "@services/1969-bones"; 
import { showBones1970 } from "@services/1970-bones"; 
import Touchable from "@components/Touchable";
import { formatDate } from "@services/utils";
import { Show } from "../types";
import * as SecureStore from "expo-secure-store";
import { FAVORITE_SHOWS } from "../constants";

type ExplorerProps = {
  goToShow: (show: Show | null) => void;
  setSelectedYear: (year: number | null) => void;
  selectedYear: number | null;
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
  const [activeShowAlternateSources, setActiveShowAlternateSources] = useState<[] | null>(null);
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

  const activeCollectionPreservedData = useMemo(() => {
    // these if conditions are the boundary between new data and backwards compatibility
    // the year date can be modified as new data is entered
    if (selectedYear && (selectedYear > 1964 && selectedYear < 1971)) { 
      if(selectedYear === 1965) { return showBones1965 }
      if(selectedYear === 1966) { return showBones1966 }
      if(selectedYear === 1967) { return showBones1967 }
      if(selectedYear === 1968) { return showBones1968 }
      if(selectedYear === 1969) { return showBones1969 }
      if(selectedYear === 1970) { return showBones1970 }
    }
    if (selectedYear && (selectedYear >= 1971) && collectionSelection)  {
      const key = `showCollection${selectedYear}`;
      const shows = collectionSelection[key] || [];
      return filterShows(shows);
    } 

    return null;
  }, [selectedYear]);

  const activeCollection = useMemo(() => {
    // these if conditions are the boundary between new data and backwards compatibility
    // the year date can be modified as new data is entered
    if (selectedYear && (selectedYear > 1964 && selectedYear < 1971)) {

      // identify which imported collection to access
      let collection = showBones1965;

      // default to 1965 
      if(selectedYear === 1965) { }
      if(selectedYear === 1966) { collection = showBones1966 }
      if(selectedYear === 1967) { collection =  showBones1967 }
      if(selectedYear === 1968) { collection =  showBones1968 }
      if(selectedYear === 1969) { collection =  showBones1969 }
      if(selectedYear === 1970) { collection =  showBones1970 }

      // create unique show date list
      const getUniqueByDate = (array) => {
        const seenDates = new Set();
        return array.filter(item => {
          const date = item.date;
          if (seenDates.has(date)) {
            return false;
          }
          seenDates.add(date);
          return true;
        });
      };
      
      const uniqueShowsByDate = getUniqueByDate(collection);
      console.log(uniqueShowsByDate);
      return uniqueShowsByDate;
    }
    if (selectedYear && (selectedYear >= 1971) && collectionSelection)  {
      const key = `showCollection${selectedYear}`;
      const shows = collectionSelection[key] || [];
      return filterShows(shows);
    } 

    return null;
  }, [selectedYear]);

  const handleShowSelect = show => {
    const availableShowsOnSelectedDate = activeCollectionPreservedData.filter(unfilteredShow => unfilteredShow.date === show.date);
    setActiveShowAlternateSources(availableShowsOnSelectedDate);
    return goToShow(show, availableShowsOnSelectedDate);
  };

  const filteredFavoriteShows = useMemo(() => {
    if (favoriteShows && searchTerm) {
      return filterShows(favoriteShows);
    }
    return favoriteShows;
  }, [favoriteShows, searchTerm]);

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
    const fetchFavoriteShows = async () => {
      const favoriteShowDatesString = await SecureStore.getItemAsync(
        FAVORITE_SHOWS
      );
      if (favoriteShowDatesString) {
        const favoriteShowDates = JSON.parse(favoriteShowDatesString);
        const foundShows: Show[] = [];
        collectionSelection.forEach((year: number, index:number)  => {
          const showsInYear = collectionSelection[year];
          favoriteShowDates.forEach((date: string) => {
            const foundShow = showsInYear.find(
              (show: Show) => show.date === date
            );
            if (foundShow) foundShows.push(foundShow);
          });
        });
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
          {activeCollection.map((show: Show, index: number) => (
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
