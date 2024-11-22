import { Text, YStack, useTheme, ScrollView, XStack } from "tamagui";
import React, { useMemo, useRef, useState, useEffect } from "react";

import { years, collectionSelection } from "@services/dataValidationUtils";
import { showBones1965 } from "@services/1965-bones";
import { showBones1966 } from "@services/1966-bones";
import { showBones1967 } from "@services/1967-bones";
import { showBones1968 } from "@services/1968-bones";
import { showBones1969 } from "@services/1969-bones";
import { showBones1970 } from "@services/1970-bones";
import { showBones1971 } from "@services/1971-bones";
import { showBones1972 } from "@services/1972-bones";
import { showBones1973 } from "@services/1973-bones";
import { showBones1974 } from "@services/1974-bones";
import { showBones1975 } from "@services/1975-bones";
import { showBones1976 } from "@services/1976-bones";
import { showBones1977 } from "@services/1977-bones";
import { showBones1978 } from "@services/1978-bones";
import { showBones1979 } from "@services/1979-bones";
import { showBones1980 } from "@services/1980-bones";
import { showBones1981 } from "@services/1981-bones";
import { showBones1982 } from "@services/1982-bones";
import { showBones1983 } from "@services/1983-bones";
import { showBones1984 } from "@services/1984-bones";
import { showBones1985 } from "@services/1985-bones";
import { showBones1986 } from "@services/1986-bones";
import { showBones1987 } from "@services/1987-bones";
import { showBones1988 } from "@services/1988-bones";
import { showBones1989 } from "@services/1989-bones";
import { showBones1990 } from "@services/1990-bones";
import { showBones1991 } from "@services/1991-bones";
// import { showBones1992 } from "@services/1992-bones";
// import { showBones1993 } from "@services/1993-bones";
// import { showBones1994 } from "@services/1994-bones";
// import { showBones1995 } from "@services/1995-bones";

import Touchable from "@components/Touchable";
import { formatDate } from "@services/utils";
import { Show } from "../types";
import * as SecureStore from "expo-secure-store";
import { FAVORITE_SHOWS } from "../constants";

type ExplorerProps = {
  goToShow: (show: Show | null, availableShowsOnSelectedDate:any) => void;
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
    if (selectedYear && (selectedYear > 1964 && selectedYear < 1992)) { 
      if(selectedYear === 1965) { return showBones1965 }
      if(selectedYear === 1966) { return showBones1966 }
      if(selectedYear === 1967) { return showBones1967 }
      if(selectedYear === 1968) { return showBones1968 }
      if(selectedYear === 1969) { return showBones1969 }
      if(selectedYear === 1970) { return showBones1970 }
      if(selectedYear === 1971) { return showBones1971 }
      if(selectedYear === 1972) { return showBones1972 }
      if(selectedYear === 1973) { return showBones1973 }
      if(selectedYear === 1974) { return showBones1974 }
      if(selectedYear === 1975) { return showBones1975 }
      if(selectedYear === 1976) { return showBones1976 }
      if(selectedYear === 1977) { return showBones1977 }
      if(selectedYear === 1978) { return showBones1978 }
      if(selectedYear === 1979) { return showBones1979 }
      if(selectedYear === 1980) { return showBones1980 }
      if(selectedYear === 1981) { return showBones1981 }
      if(selectedYear === 1982) { return showBones1982 }
      if(selectedYear === 1983) { return showBones1983 }
      if(selectedYear === 1984) { return showBones1984 }
      if(selectedYear === 1985) { return showBones1985 }
      if(selectedYear === 1986) { return showBones1986 }
      if(selectedYear === 1987) { return showBones1987 }
      if(selectedYear === 1988) { return showBones1988 }
      if(selectedYear === 1989) { return showBones1989 }
      if(selectedYear === 1990) { return showBones1990 }
      if(selectedYear === 1991) { return showBones1991 }

    }

    if (selectedYear && (selectedYear >= 1991) && collectionSelection)  {
      const key = `showCollection${selectedYear}`;
      const shows = collectionSelection[key] || [];
      return filterShows(shows);
    } 

    return null;
  }, [selectedYear]);

  const activeCollection = useMemo(() => {
    // these if conditions are the boundary between new data and backwards compatibility
    // the year date can be modified as new data is entered
    if (selectedYear && (selectedYear > 1964 && selectedYear < 1992)) {

      // identify which imported collection to access
      let collection = showBones1965;

      // default to 1965 
      if(selectedYear === 1965) { }
      if(selectedYear === 1966) { collection = showBones1966 }
      if(selectedYear === 1967) { collection =  showBones1967 }
      if(selectedYear === 1968) { collection =  showBones1968 }
      if(selectedYear === 1969) { collection =  showBones1969 }
      if(selectedYear === 1970) { collection =  showBones1970 }
      if(selectedYear === 1971) { collection =  showBones1971 }
      if(selectedYear === 1972) { collection =  showBones1972 }
      if(selectedYear === 1973) { collection =  showBones1973 }
      if(selectedYear === 1974) { collection =  showBones1974 }
      if(selectedYear === 1975) { collection =  showBones1975 }
      if(selectedYear === 1976) { collection =  showBones1976 }
      if(selectedYear === 1977) { collection =  showBones1977 }
      if(selectedYear === 1978) { collection =  showBones1978 }
      if(selectedYear === 1979) { collection =  showBones1979 }
      if(selectedYear === 1980) { collection =  showBones1980 }
      if(selectedYear === 1981) { collection =  showBones1981 }
      if(selectedYear === 1982) { collection =  showBones1982 }
      if(selectedYear === 1983) { collection =  showBones1983 }
      if(selectedYear === 1984) { collection =  showBones1984 }
      if(selectedYear === 1985) { collection =  showBones1985 }
      if(selectedYear === 1986) { collection =  showBones1986 }
      if(selectedYear === 1987) { collection =  showBones1987 }
      if(selectedYear === 1988) { collection =  showBones1988 }
      if(selectedYear === 1989) { collection =  showBones1989 }
      if(selectedYear === 1990) { collection =  showBones1990 }
      if(selectedYear === 1991) { collection =  showBones1991 }

      // create unique show date list
      const getUniqueByDate = (array:[]) => {
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
      return uniqueShowsByDate;
    }
    if (selectedYear && (selectedYear >= 1991) && collectionSelection)  {
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
