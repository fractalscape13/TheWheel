import { Text, YStack, useTheme, ScrollView, Stack} from "tamagui";
import React, { useMemo, useState } from "react";
import { years, collectionSelection } from "@services/dataValidationUtils";
import Touchable from "@components/Touchable";
import { Ionicons } from "@expo/vector-icons";

type ExplorerProps = {};

const Explorer: React.FC<ExplorerProps> = ({}) => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const theme = useTheme();
  const activeCollection = useMemo(() => {
    if (selectedYear && collectionSelection) {
      const key = `showCollection${selectedYear}`;
      return collectionSelection[key] || null;
    }
    return null;
  }, [selectedYear]);

  return (
    <YStack w="100%" h="100%">
      <Touchable onPress={() => setSelectedYear(null)} >
        <Stack ai="center" jc="flex-start" flexDirection="row" >
            {selectedYear && <Ionicons name="arrow-back-outline" size={40} color="#FF69B4" />}
            <Text color="$text" fs="$5">
                Explore By Year
            </Text>
        </Stack>
      </Touchable>
      {!selectedYear && (
        <ScrollView horizontal>
          {years.map((year: number) => (
            <Touchable
              key={year}
              ai="center"
              jc="flex-start"
              w="100%"
              onPress={() => setSelectedYear(year)}
              children={
                <Text fs="$5" color="$text" bg="$secondary" o={0.9} padding={20} mr={5}>
                  {year}
                </Text>
              }
            />
          ))}
        </ScrollView>
      )}
      {activeCollection && (
        <ScrollView>
          {activeCollection.map((show) => (
            <Text
              color="$text"
              key={show.date}
              fs="$1"
            >{`${show.date} - ${show.venue} - ${show.location}`}</Text>
          ))}
        </ScrollView>
      )}
    </YStack>
  );
};

export default Explorer;
