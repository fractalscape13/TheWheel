import React, { createContext, useState, useContext } from "react";
import { Audio } from "expo-av";

type PlayerContextType = {
  isPlaying: boolean;
  isLoading: boolean;
  isExpanded: boolean;
  togglePlayerSize: () => void;
  duration: number;
  position: number;
  currentSongFile: any;
  currentPlayingSongIndex: number;
  showFileCollection: any[];
  showId: string | null;
  handleSeek: (value: number) => Promise<void>;
  handlePlayPause: () => Promise<void>;
  nextSongAction: () => Promise<void>;
  previousSongAction: () => Promise<void>;
  loadAudioAndPlay: (trackDownloadSlug: string) => Promise<void>;
  clearAudioFromStorage: () => Promise<void>;
  setShowFileCollection: (files: any[]) => void;
  setShowId: (id: string | null) => void;
  setCurrentPlayingSongIndex: (index: number) => void;
  setCurrentSongFile: (file: any | null) => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: any }) => {
  const [currentSong, setCurrentSong] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFileCollection, setShowFileCollection] = useState([]);
  const [showId, setShowId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [currentPlayingSongIndex, setCurrentPlayingSongIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [currentSongFile, setCurrentSongFile] = useState<any>(null);

  const togglePlayerSize = () => {
    setIsExpanded((prev) => !prev);
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setDuration(status.durationMillis);
      setPosition(status.positionMillis);

      if (status.didJustFinish) {
        nextSongAction();
      }
    }
  };

  const loadAudioAndPlay = async (trackDownloadSlug: string) => {
    const { sound } = await Audio.Sound.createAsync(
      { uri: trackDownloadSlug },
      { shouldPlay: true },
      (status) => setIsPlaying(status.isLoaded)
    );
    setCurrentSong(sound);
    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
  };

  const clearAudioFromStorage = async () => {
    if (currentSong) {
      await currentSong.stopAsync();
      await currentSong.unloadAsync();
      setDuration(0);
      setPosition(0);
      setCurrentSong(null);
    }
  };

  const handleSeek = async (value: number) => {
    if (currentSong) {
      await currentSong.setPositionAsync(value);
    }
  };

  const handlePlayPause = async () => {
    if (currentSong) {
      const status = await currentSong.getStatusAsync();
      if (status.isPlaying) {
        await currentSong.pauseAsync();
        setIsPlaying(false);
      } else {
        await currentSong.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const nextSongAction = async () => {
    if (currentPlayingSongIndex === showFileCollection.length - 1) {
      return;
    }
    setIsLoading(true);
    const newIndex = currentPlayingSongIndex + 1;
    if (currentSong) {
      await clearAudioFromStorage();
    }
    const newSelectedSong = showFileCollection[newIndex];
    setCurrentSongFile(newSelectedSong);
    const audioUrl = `https://archive.org/download/${showId}/${newSelectedSong.name}`;
    await loadAudioAndPlay(audioUrl);
    setCurrentPlayingSongIndex(newIndex);
  };

  const previousSongAction = async () => {
    if (currentPlayingSongIndex === 0) {
      return;
    }
    setIsLoading(true);
    const newIndex = currentPlayingSongIndex - 1;
    if (currentSong) {
      await clearAudioFromStorage();
    }
    const newSelectedSong = showFileCollection[newIndex];
    setCurrentSongFile(newSelectedSong);
    const audioUrl = `https://archive.org/download/${showId}/${newSelectedSong.name}`;
    await loadAudioAndPlay(audioUrl);
    setCurrentPlayingSongIndex(newIndex);
  };

  return (
    <PlayerContext.Provider
      value={{
        isPlaying,
        isLoading,
        isExpanded,
        togglePlayerSize,
        duration,
        position,
        currentSongFile,
        currentPlayingSongIndex,
        showFileCollection,
        showId,
        handleSeek,
        handlePlayPause,
        nextSongAction,
        previousSongAction,
        loadAudioAndPlay,
        clearAudioFromStorage,
        setShowFileCollection,
        setShowId,
        setCurrentPlayingSongIndex,
        setCurrentSongFile,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

// Hook to use the player context in components
export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};
