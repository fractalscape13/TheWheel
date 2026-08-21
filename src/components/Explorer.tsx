import { Text, YStack, useTheme, ScrollView, XStack } from "tamagui";
import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FlatList } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Touchable from "@components/Touchable";
import {
  formatDate,
  normalizeShowDate,
  showYear,
} from "@services/utils";
import { Show } from "../types";
import { readFavoriteShowDates } from "@services/favorites";
import { FAVORITES_TAB, SCREEN_PADDING, TODAY_TAB } from "../constants";
import { getSelectedYearData } from "@services/yearsService";
import { years } from "@services/utils";
import { Ionicons } from "@expo/vector-icons";

type ExplorerProps = {
  goToShow: (show: Show | null, availableShowsOnSelectedDate: any) => void;
  setSelectedYear: (year: number) => void;
  selectedYear: number;
  searchTerm: string | undefined;
};

type TabPillProps = {
  active: boolean;
  onPress: () => void;
  label?: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
};

const TabPill: React.FC<TabPillProps> = ({ active, onPress, label, icon }) => {
  const theme = useTheme();
  // Ionicons needs a resolved colour string, not a "$token".
  const foreground = (
    active ? theme?.pillActiveText?.val : theme?.pillText?.val
  ) as string;
  return (
    <Touchable
      onPress={onPress}
      style={{
        backgroundColor: (active
          ? theme?.pillActiveBg?.val
          : theme?.pillBg?.val) as string,
        borderRadius: 8,
        marginRight: 6,
        height: 30,
        width: 60,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon ? (
        <Ionicons name={icon} size={18} color={foreground} />
      ) : (
        <Text fs="$3" fw="700" color={foreground}>
          {label}
        </Text>
      )}
    </Touchable>
  );
};

type ShowRowProps = {
  show: Show;
  onPress: (show: Show) => void;
};

const ShowRow = React.memo(({ show, onPress }: ShowRowProps) => (
  <Touchable onPress={() => onPress(show)}>
    <YStack
      bg="$card"
      px="$3"
      py="$2"
      mb="$3"
      br="$3"
      shadowColor="$shadowColor"
      shadowRadius={3}
      shadowOpacity={0.2}
    >
      <Text fs="$3" mb="$1" fw="700" color="$cardText">
        {formatDate(show.date)}
      </Text>
      <XStack jc="space-between" ai="center" maxW="100%">
        <Text
          fs="$2"
          color="$cardMuted"
          numberOfLines={1}
          ellipsizeMode="tail"
          maxW="100%"
        >
          {show.venue}
        </Text>
        <Text
          fs="$2"
          ml="$2"
          color="$cardMuted"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {show.location}
        </Text>
      </XStack>
    </YStack>
  </Touchable>
));

const Explorer: React.FC<ExplorerProps> = ({
  goToShow,
  setSelectedYear,
  selectedYear,
  searchTerm,
}) => {
  const showListRef = useRef<FlatList<Show>>(null);
  const theme = useTheme();
  const [favoriteShows, setFavoriteShows] = useState<Show[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  const navigation = useNavigation();

  // Filtering + re-rendering the list is the expensive part, so let it lag a frame
  // behind the input rather than blocking each keystroke.
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filterShows = (shows: Show[]) => {
    const term = deferredSearchTerm?.trim().toLowerCase();
    if (!term) {
      return shows;
    }
    // venue/location are absent on a handful of records, so match optionally.
    return shows.filter(
      (show) =>
        show.venue?.toLowerCase().includes(term) ||
        show.location?.toLowerCase().includes(term) ||
        show.date?.includes(term)
    );
  };

  const isPlayable = (show: Show) =>
    Boolean(show.showIdentifier && show.tracks?.length);

  const getUniqueByDate = (shows: Show[]) => {
    // One row per date. A few dates list an incomplete source first (no tracks),
    // so prefer a source that can actually be played; Map keeps date order.
    const byDate = new Map<string, Show>();
    shows.forEach((show) => {
      // Key on the canonical date: a few records spell the same performance
      // differently ("03/21/90" vs "1990-03-21") and would otherwise list twice.
      const key = normalizeShowDate(show.date);
      const existing = byDate.get(key);
      if (!existing || (!isPlayable(existing) && isPlayable(show))) {
        byDate.set(key, show);
      }
    });
    return Array.from(byDate.values());
  };

  const activeCollection = useMemo(() => {
    return getSelectedYearData(selectedYear);
  }, [selectedYear]);

  const uniqueShowDates = useMemo(() => {
    if (!activeCollection) {
      return [];
    }
    // Filter before de-duplicating, so a date survives when any of its sources
    // matches and the row shown is the one that actually matched.
    return getUniqueByDate(filterShows(activeCollection));
  }, [activeCollection, deferredSearchTerm]);

  const handleShowSelect = useCallback((show: Show) => {
    const target = normalizeShowDate(show.date);
    const allAvailableShowsOnSelectedDate = activeCollection.filter(
      (unfilteredShow) => normalizeShowDate(unfilteredShow.date) === target
    );
    return goToShow(show, allAvailableShowsOnSelectedDate);
  }, [activeCollection, goToShow]);

  const handleFavoriteShowSelect = useCallback((show: Show) => {
    const year = showYear(show.date);
    if (year) {
      const collection = getSelectedYearData(year);
      const target = normalizeShowDate(show.date);
      const allAvailableShowsOnSelectedDate = collection.filter(
        (unfilteredShow) => normalizeShowDate(unfilteredShow.date) === target
      );
      return goToShow(show, allAvailableShowsOnSelectedDate);
    }
  }, [goToShow]);

  const handleSelectYear = (year: number) => {
    if (year !== selectedYear) {
      setSelectedYear(year);
      showListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  };

  const filteredFavoriteShows = useMemo(() => {
    if (favoriteShows && deferredSearchTerm) {
      return filterShows(favoriteShows);
    }
    return favoriteShows;
  }, [favoriteShows, deferredSearchTerm]);

  // Recomputed whenever the screen regains focus, so leaving the app open across
  // midnight still shows the correct day rather than a stale one.
  const [todayStamp, setTodayStamp] = useState(() => new Date().toDateString());

  // Shown instead of an empty favorites list: the same calendar day across every year.
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
      }),
    [todayStamp]
  );

  const onThisDayShows = useMemo(() => {
    const now = new Date();
    const monthDay = `-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    const matches: Show[] = [];
    years.forEach((year) => {
      getSelectedYearData(year).forEach((show) => {
        // Normalised, so oddly-formatted dates can still match this calendar day.
        if (normalizeShowDate(show.date).endsWith(monthDay)) {
          matches.push(show);
        }
      });
    });
    return getUniqueByDate(matches);
  }, [todayStamp]);

  const filteredOnThisDayShows = useMemo(
    () => filterShows(onThisDayShows),
    [onThisDayShows, deferredSearchTerm]
  );

  const fetchFavoriteShows = () => {
    const foundShows: Show[] = [];
    readFavoriteShowDates().forEach((favoritedShowDate) => {
      const year = showYear(favoritedShowDate);
      if (!year) {
        return;
      }
      const onThatDate = getSelectedYearData(year).filter(
        (show) => show.date === favoritedShowDate
      );
      // Prefer a source that can actually be played, as the main list does.
      const foundShow = onThatDate.find(isPlayable) ?? onThatDate[0];
      if (foundShow) {
        foundShows.push(foundShow);
      }
    });

    // Always set, so removing your last favorite clears the list.
    setFavoriteShows(foundShows);
    setFavoritesLoaded(true);
  };

  const hasFavorites = favoriteShows.length > 0;

  // Land on Favorites when the user has some, otherwise stay on today's shows.
  // Runs once, so it never fights a manual tab choice.
  const didPickInitialTab = useRef(false);
  useEffect(() => {
    if (didPickInitialTab.current || !favoritesLoaded) {
      return;
    }
    didPickInitialTab.current = true;
    if (hasFavorites) {
      setSelectedYear(FAVORITES_TAB);
    }
  }, [favoritesLoaded, hasFavorites, setSelectedYear]);

  // The heart tab disappears with the last favorite; don't leave the user on it.
  useEffect(() => {
    if (!hasFavorites && favoritesLoaded && selectedYear === FAVORITES_TAB) {
      setSelectedYear(TODAY_TAB);
    }
  }, [hasFavorites, favoritesLoaded, selectedYear, setSelectedYear]);

  useFocusEffect(
    React.useCallback(() => {
      fetchFavoriteShows();
      const currentDay = new Date().toDateString();
      setTodayStamp((prev) => (prev === currentDay ? prev : currentDay));
    }, [])
  );

  return (
    // flex={1} so the lists below are height-bounded and can actually virtualise.
    <YStack flex={1}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Full-bleed: cancel the screen gutter so the strip reaches both edges.
        mx={-SCREEN_PADDING}
        mb="$3"
        // Keep it to its own height; otherwise it stretches down the flex column.
        flexGrow={0}
        flexShrink={0}
      >
        {hasFavorites && (
          <TabPill
            active={selectedYear === FAVORITES_TAB}
            onPress={() => handleSelectYear(FAVORITES_TAB)}
            icon="heart"
          />
        )}
        <TabPill
          active={selectedYear === TODAY_TAB}
          onPress={() => handleSelectYear(TODAY_TAB)}
          icon="today"
        />
        {years?.map((year: number) => (
          <TabPill
            key={year}
            active={year === selectedYear}
            onPress={() => handleSelectYear(year)}
            label={String(year)}
          />
        ))}
      </ScrollView>
      {selectedYear !== FAVORITES_TAB && selectedYear !== TODAY_TAB ? (
        <FlatList
          ref={showListRef}
          data={uniqueShowDates}
          keyExtractor={(show, index) => `${show.date}-${index}`}
          renderItem={({ item }) => (
            <ShowRow show={item} onPress={handleShowSelect} />
          )}
          contentContainerStyle={{ paddingBottom: 300 }}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={12}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={
            <Text color="$text" fs="$3">
              {deferredSearchTerm?.trim()
                ? `No ${selectedYear} shows match "${deferredSearchTerm.trim()}"`
                : `No shows found for ${selectedYear}`}
            </Text>
          }
        />
      ) : selectedYear === FAVORITES_TAB ? (
        <>
          <Text fs="$3" lh="$3" fw="700" ff="$heading" mb="$2" color="$text">
            Favorites
          </Text>
          <FlatList
            data={filteredFavoriteShows}
            keyExtractor={(show, index) => `${show.date}-${index}`}
            renderItem={({ item }) => (
              <ShowRow show={item} onPress={handleFavoriteShowSelect} />
            )}
            contentContainerStyle={{ paddingBottom: 300 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text color="$text" fs="$3">
                {`No favorites match "${deferredSearchTerm?.trim()}"`}
              </Text>
            }
          />
        </>
      ) : (
        <>
          <Text fs="$3" lh="$3" fw="700" ff="$heading" mb="$2" color="$text">
            {`On this day · ${todayLabel}`}
          </Text>
          <FlatList
            data={filteredOnThisDayShows}
            keyExtractor={(show, index) => `${show.date}-${index}`}
            renderItem={({ item }) => (
              <ShowRow show={item} onPress={handleFavoriteShowSelect} />
            )}
            contentContainerStyle={{ paddingBottom: 300 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text color="$text" fs="$3">
                {deferredSearchTerm?.trim()
                  ? `No ${todayLabel} shows match "${deferredSearchTerm.trim()}"`
                  : `No shows on ${todayLabel}.`}
              </Text>
            }
          />
        </>
      )}
    </YStack>
  );
};

export default Explorer;
