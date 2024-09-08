import React, { useEffect, useState } from "react";
import { Button, Text, YStack, Stack, Image, Slider, Input, styled, useTheme } from "tamagui";
import { Audio } from "expo-av";

type HomeProps = {
  toggleTheme: () => void;
};

const CustomTrack = styled(YStack, {
  width: '100%',
  height: 8,
  borderRadius: 10,
  backgroundColor: '#e0e0e0',
  position: 'relative',
});

const CustomThumb = styled(YStack, {
  width: 20,
  height: 20,
  borderRadius: 50,
  backgroundColor: '#4caf50',
  position: 'absolute',
  top: '50%',
  transform: [{ translateY: -10 }],
});

const Home: React.FC<HomeProps> = ({ toggleTheme }) => {
  const theme = useTheme();
  const themeName = theme?.name?.toString();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean | null>(true);
  const [duration, setDuration] = useState<number | null>(0);
  const [position, setPosition] = useState<number | null>(0);
  const [showData, setShowData] = useState(null);



  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis);
      setPosition(status.positionMillis);

      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  const fetchAndPlaySong = async () => {
    try {
      // Adjusted query to target audio mediatype
      const response = await fetch(
        "https://archive.org/advancedsearch.php?q=Grateful+Dead+AND+mediatype:audio+AND+year:1972&fl[]=identifier&fl[]=title&rows=1&page=1&output=json"
      );
      const data = await response.json();
      const showId = data.response.docs[0].identifier;

      // Fetch the specific show details to get the audio files
      const showResponse = await fetch(
        `https://archive.org/metadata/${showId}`
      );
      const showData = await showResponse.json();

      // Try to find an MP3 or other audio file
      const audioFile = showData.files.find(
        (file: any) =>
          (file.format.includes("MP3") ||
            file.format.includes("FLAC") ||
            file.format.includes("OGG")) &&
          file.name.includes("Uncle")
      );

      if (!audioFile) {
        console.log("No playable audio file found.");
        return;
      }

      // Construct the audio file URL
      const audioUrl = `https://archive.org/download/${showId}/${audioFile.name}`;
      console.log("Playing audio file:", audioUrl);

      // Play the audio file
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      setSound(sound);
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate); // Listen to playback updates

      // Try to find an image file (prefer PNG or JPEG)
      const imageFile = showData.files.find(
        (file: any) =>
          file.format.includes("JPEG") || file.format.includes("PNG")
      );

      if (imageFile) {
        const imageUrl = `https://archive.org/download/${showId}/${imageFile?.name}`;
        setImageUrl(imageUrl);
        console.log("Image found:", imageUrl);
      } else {
        console.log("No image found for this show.");
      }
    } catch (error) {
      console.error("Error fetching song:", error);
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setDuration(0);
      setPosition(0);
      setSound(null);
    }
  }

  const handleSeek = async (value) => {
    if (sound) {
      await sound.setPositionAsync(value);
    }
  };

  const millisToMinutesAndSeconds = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handlePlayPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSearch = async () => {
    const query = encodeURIComponent(`Grateful Dead ${searchTerm}`);
    const url = `https://archive.org/advancedsearch.php?q=${query}&output=json&rows=5`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
      const results = data.response.docs;

      for (const result of results) {
        const showId = result.identifier;
        const showResponse = await fetch(
          `https://archive.org/metadata/${showId}`
        );
        const showData = await showResponse.json();
        setShowData(showData);  // setting show data to local state, not used currently but could be explored
        const audioFile = showData.files.find(
          (file: any) =>
            (file.format.includes("MP3") ||
              file.format.includes("FLAC") ||
              file.format.includes("OGG") ||
              file.format.includes("VBR MP3")
            )
        );

        if (audioFile) {
          const audioUrl = `https://archive.org/download/${showId}/${audioFile.name}`;   
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: true }
          );
          setSound(sound);
          sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate); 
          return
        }
      }
    } catch (error) {
      console.error('Error fetching Grateful Dead song:', error);
    }
  }
  
  return (
    <YStack flex={1} jc="center" ai="center" bg="$background" p="$6">
      {sound && (
        <Stack 
          w="100%"          
          jc="center" 
          ai="center"
        >
          <Slider
            w="90%"
            defaultValue={[0]}
            value={position}
            min={0}
            maxValue={duration || 0}
            step={1}
            onValueChangeEnd={(val) => handleSeek(val[0])}
          >
            <CustomTrack>
              <YStack
                bg="$secondary"
                height="100%"
                width={`${(position / duration) * 100}%`}
              />
            </CustomTrack>
            <CustomThumb
              left={`${(position / duration) * 100}%`}
            />
          </Slider>
          <Text>
            {millisToMinutesAndSeconds(position)} / {millisToMinutesAndSeconds(duration)}
          </Text>
          <Stack
            h={50}
            br="$2"
            w="90%"
            my="$3"
            bg="$secondary"
            ai="center"
            jc="center"
            onPress={handlePlayPause}
          >
            <Text color="$buttonText">{isPlaying ? "Pause" : "Resume"}</Text>
          </Stack>
          <Stack
            h={50}
            br="$2"
            w="90%"
            my="$3"
            bg="$secondary"
            ai="center"
            jc="center"
            onPress={stopAudio}
          >
            <Text color="$buttonText">Clear Audio Selection</Text>
          </Stack>
        </Stack>
      )}
      <Input
        placeholder=""
        value={searchTerm}
        onChangeText={setSearchTerm}
        w={250}
        h="75"
        borderWidth={1}
      />
      <Text>
        You typed: {searchTerm}
      </Text>
      <Stack
        h={50}
        br="$2"
        w="90%"
        my="$3"
        bg="$secondary"
        ai="center"
        jc="center"
        onPress={handleSearch}
      >
        <Text color="$buttonText">Search</Text>
      </Stack>
      <Text fontWeight="bold" color="$text" mb="$2">
        The Wheel is Turning
      </Text>
      <Stack
        h={50}
        br="$2"
        w="90%"
        my="$3"
        bg="$buttonBackground"
        ai="center"
        jc="center"
        onPress={toggleTheme}
      >
        <Text color="$buttonText">
          Toggle to {themeName === "light" ? "Dark" : "Light"} Mode
        </Text>
      </Stack>
      <Stack
        h={50}
        br="$2"
        w="90%"
        my="$3"
        bg="$secondary"
        ai="center"
        jc="center"
        onPress={fetchAndPlaySong}
      >
        <Text color="$buttonText">Play a Grateful Dead Song from 1972</Text>
      </Stack>
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 300, height: 400, marginTop: 20 }}
          resizeMode="contain"
        />
      )}
    </YStack>
  );
};

export default Home;
