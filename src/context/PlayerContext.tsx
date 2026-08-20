import React, { createContext, useContext, useEffect, useState } from "react";
import { Show, Track } from "../types";
import {
  addTracks,
  getActiveTrack,
  getActiveTrackIndex,
  getState,
  playTrack,
  reset,
  seekTo,
  selectTrack,
  handlePlayPause,
  nextSongAction,
  previousSongAction,
} from "../services/trackPlayer";
import { getSelectedYearData } from "@services/yearsService";
import {
  useProgress,
  useTrackPlayerEvents,
  Event,
  State,
} from "react-native-track-player";

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
  trackSelectAction: (index: number) => Promise<void>;
  loadAudioAndPlay: (show: Show, trackIndex: number) => Promise<void>;
  setShow: (show: Show | null) => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: any }) => {
  const [show, setShow] = useState<Show | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPlayingSongIndex, setCurrentPlayingSongIndex] = useState<
    number | null
  >(null);
  const [playerState, setPlayerState] = useState<State | null>(null);

  const progress = useProgress();

  const events = [
    Event.PlaybackState,
    Event.PlaybackError,
    Event.PlaybackActiveTrackChanged,
  ];

  useTrackPlayerEvents(events, (event) => {
    if (event.type === Event.PlaybackError) {
      // error state, useful for analytics?
    }
    if (event.type === Event.PlaybackState) {
      setPlayerState(event.state);
    }
    // The player advances by itself at the end of a track (and from the lock
    // screen), so follow its index rather than only tracking our own taps.
    if (event.type === Event.PlaybackActiveTrackChanged) {
      setCurrentPlayingSongIndex(event.index ?? null);
    }
  });

  // The playback service survives a JS reload, so audio can still be playing
  // while React state is empty — which hid the player controls entirely.
  useEffect(() => {
    let cancelled = false;

    const restoreFromNativePlayer = async () => {
      try {
        const activeTrack = await getActiveTrack();
        const showDate = activeTrack?.showDate as string | undefined;
        if (cancelled || !showDate) {
          return;
        }
        const year = parseInt(showDate.split("-")[0], 10);
        if (!year) {
          return;
        }
        const restored = getSelectedYearData(year).find(
          (candidate) =>
            candidate.date === showDate &&
            candidate.showIdentifier === activeTrack?.showIdentifier
        );
        if (!restored || cancelled) {
          return;
        }
        const [activeIndex, state] = await Promise.all([
          getActiveTrackIndex(),
          getState(),
        ]);
        if (cancelled) {
          return;
        }
        setShow(restored);
        setCurrentPlayingSongIndex(activeIndex ?? null);
        setPlayerState(state ?? null);
      } catch {
        // No player set up yet (cold start) — nothing to restore.
      }
    };

    restoreFromNativePlayer();
    return () => {
      cancelled = true;
    };
  }, []);

  const isPlaying = playerState === State.Playing;

  const togglePlayerSize = () => {
    setIsExpanded((prev) => !prev);
  };

  const loadAudioAndPlay = async (show: Show, trackIndex: number) => {
    // A few archive records have no identifier or no track list; without this the
    // URL becomes ".../undefined/..." and the player fails silently.
    if (!show?.showIdentifier || !show?.tracks?.length) {
      return;
    }
    await clearAudioFromStorage();
    setShow(show);
    setCurrentPlayingSongIndex(trackIndex);
    const formattedTracks = show?.tracks?.map((track: Track) => {
      const audioUrl = `https://archive.org/download/${show.showIdentifier}/${track.file}`;
      return {
        artist: "Grateful Dead",
        title: track.title,
        url: audioUrl,
        // Carried so state can be rebuilt after a JS reload; the native
        // playback service keeps going but React state starts empty.
        showDate: show.date,
        showIdentifier: show.showIdentifier,
      };
    });
    if (!formattedTracks?.length) {
      return;
    }
    try {
      setIsLoading(true);
      await addTracks(formattedTracks);
      await selectTrack(trackIndex);
      await playTrack();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAudioFromStorage = async () => {
    setCurrentPlayingSongIndex(null);
    await reset();
  };

  const handleSeek = async (value: number) => {
    await seekTo(value);
  };

  const handleNextSongAction = async () => {
    const lastIndex = (show?.tracks?.length ?? 0) - 1;
    setCurrentPlayingSongIndex((prevIndex) =>
      prevIndex === null ? null : Math.min(prevIndex + 1, lastIndex)
    );
    await nextSongAction();
  };

  const handlePreviousSongAction = async () => {
    setCurrentPlayingSongIndex((prevIndex) =>
      prevIndex === null ? null : Math.max(prevIndex - 1, 0)
    );
    await previousSongAction();
  };

  const trackSelectAction = async (selectedTrackIndex: number) => {
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
