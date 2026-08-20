import React from "react";
import { XStack, Input, View, useTheme } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import Touchable from "./Touchable";

type SearchBarProps = {
  searchTerm: string | undefined;
  setSearchTerm: (value: string) => void;
};

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm }) => {
  const theme = useTheme();
  return (
    <XStack jc="space-between" ai="center" mb="$3">
      <XStack ai="center" flex={1} bw={1} br={8} bc="$text" h={40} px="$2">
        <Input
          placeholder="Filter by city or venue..."
          placeholderTextColor="$textPlaceholder"
          color="$text"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="never"
          style={{ backgroundColor: theme?.bg?.val }}
          value={searchTerm}
          onChangeText={setSearchTerm}
          flex={1}
          bw={0}
        />
        {searchTerm ? (
          <Touchable
            onPress={() => setSearchTerm("")}
            style={{ marginLeft: 5 }}
          >
            <Ionicons
              name="close-circle"
              size={24}
              color={theme?.$buttonBg?.val}
            />
          </Touchable>
        ) : null}
      </XStack>
      <View
        ai="center"
        jc="center"
        br={99}
        h={30}
        w={30}
        bg="transparent"
        ml="$2"
      >
        <Ionicons name="search" size={28} color={theme?.primary?.val} />
      </View>
    </XStack>
  );
};

export default SearchBar;
