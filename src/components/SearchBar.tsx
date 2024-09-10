import React from "react";
import { XStack, Input, View, useTheme } from "tamagui";
import { ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type SearchBarProps = {
  searchTerm: string | undefined;
  setSearchTerm: (value: string) => void;
  isLoading: boolean;
};

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  setSearchTerm,
  isLoading,
}) => {
  const theme = useTheme();
  return (
    <XStack jc="space-between" ai="center" mb="$3">
      <Input
        placeholder="Filter by city or venue..."
        placeholderTextColor="$textPlaceholder"
        color="$text"
        value={searchTerm}
        onChangeText={setSearchTerm}
        h={40}
        flex={1}
        bw={1}
        br={8}
        bc="$text"
        mr="$3"
      />
      <View ai="center" jc="center" br={99} h={30} w={30} bg="transparent">
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Ionicons name="search" size={28} color={theme?.$buttonBg?.val} />
        )}
      </View>
    </XStack>
  );
};

export default SearchBar;
