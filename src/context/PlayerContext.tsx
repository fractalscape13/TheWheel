import React, { createContext, useState, useContext } from "react";
import { Show, Track } from "../types";
import { addTracks, playTrack, reset, seekTo, selectTrack, handlePlayPause, nextSongAction, previousSongAction } from "../services/trackPlayer";
import { useProgress, useTrackPlayerEvents, Event, State } from 'react-native-track-player';

type PlayerContextType = {
  isLoading: boolean;
  isPlaying: boolean;
  isExpanded: boolean;
  togglePlayerSize: () => void;
  duration: number;
  position: number;
  show: Show | null;
  currentPlayingSongIndex: number | null;
  handleSeek: (value: number) => Promise<void>;
  handlePlayPause: () => Promise<void>;
  nextSongAction: () => Promise<void>;
  previousSongAction: () => Promise<void>;
  trackSelectAction: (index:number) => Promise<void>;
  loadAudioAndPlay: (show: Show, trackIndex: number) => Promise<void>;
  setShow: (show: Show | null) => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: any }) => {
  const [show, setShow] = useState<Show | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPlayingSongIndex, setCurrentPlayingSongIndex] = useState<number | null>(null);
  const [playerState, setPlayerState] = useState(null)

  const progress = useProgress();

  const events = [
    Event.PlaybackState,
    Event.PlaybackError,
  ];

  useTrackPlayerEvents(events, (event) => {
    if (event.type === Event.PlaybackError) {
      // error state, useful for analytics?
    }
    if (event.type === Event.PlaybackState) {
      setPlayerState(event.state);
    }
  });

  const isPlaying = playerState === State.Playing;

  const togglePlayerSize = () => {
    setIsExpanded((prev) => !prev);
  };

  const loadAudioAndPlay = async (show: Show, trackIndex: number) => {
    await clearAudioFromStorage();
    setShow(show);
    setCurrentPlayingSongIndex(trackIndex);
    const formattedTracks = show?.tracks?.map((track: Track) => {
      const audioUrl = `https://archive.org/download/${show.showIdentifier}/${track.file}`;
      return {
        artist: "Grateful Dead",
        title: track.title,
        url: audioUrl,
      }
    });
    await addTracks(formattedTracks);
    await selectTrack(trackIndex);
    await playTrack();
  };

  const clearAudioFromStorage = async () => { 
    setCurrentPlayingSongIndex(null);
    await reset();
  };

  const handleSeek = async (value: number) => {
    await seekTo(value);
  };

  const handleNextSongAction = async () => {
    setCurrentPlayingSongIndex((prevIndex:number | null) => prevIndex ? prevIndex + 1 : null)
    await nextSongAction();
  };

  const handlePreviousSongAction = async () => {
    setCurrentPlayingSongIndex((prevIndex:number | null) => prevIndex ? prevIndex - 1 : null)
    await previousSongAction();
  };

  const trackSelectAction = async (selectedTrackIndex:number) => {
    setCurrentPlayingSongIndex(selectedTrackIndex);
    await selectTrack(selectedTrackIndex);
  };

  return (
    <PlayerContext.Provider
      value={{
        isPlaying,
        isLoading,
        isExpanded,
        togglePlayerSize,
        duration: progress.duration,
        position: progress.position,
        show,
        currentPlayingSongIndex,
        handleSeek,
        handlePlayPause,
        nextSongAction: handleNextSongAction,
        previousSongAction: handlePreviousSongAction,
        trackSelectAction,
        loadAudioAndPlay,
        setShow,
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