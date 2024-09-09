import { Text, YStack, useTheme } from "tamagui";
import React, { useEffect, useState } from "react";
import { years } from "@services/dataValidationUtils";
import Button from "@components/Button";
import Touchable from "@components/Touchable";

type ExplorerProps = {};

const Explorer: React.FC<ExplorerProps> = ({}) => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const theme = useTheme();

  const selectYear = (year: number) => {
    setSelectedYear(year);
  };
  const fetchDataByYearAsync = async (year: number) => {
    let searchURL = `https://archive.org/advancedsearch.php?q=collection:GratefulDead AND year:${year}&fl=identifier,title,date&output=json`;

    const showResponse = await fetch(`https://archive.org/metadata/${showId}`);
    const showData = await showResponse.json();
    const shows = showData.data.response.docs;

    console.log(
      "to do, filter each valid month from data set, specific dates too? how many entries?",
      shows
    );
  };

  useEffect(() => {
    if (selectedYear) {
      fetchDataByYearAsync(selectedYear);
    }
  }, [selectedYear]);

  return (
    <YStack w="100%" h="75%">
      <Text color="$text">Explore By Year</Text>
      <YStack w="100%" h="90%">
        {years.map((year: number) => (
          <Touchable
            onPress={() => selectYear(year)}
            style={{
              backgroundColor: theme?.$buttonBg?.val,
              borderRadius: 90,
              padding: 10,
              fontSize: 24,
              marginRight: 8,
              maxWidth: "20%",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <Text alignSelf="center" fs="$3">
              {year}
            </Text>
          </Touchable>
        ))}
      </YStack>
    </YStack>
  );
};

export default Explorer;
