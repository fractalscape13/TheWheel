import React, { createContext, useContext, useEffect, useRef, useState } from "react";
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
  skipToTrack,
  retryPlayback,
  handlePlayPause,
  nextSongAction,
  previousSongAction,
} from "../services/trackPlayer";
import { getSelectedYearData } from "@services/yearsService";
import { showYear } from "@services/utils";
import {
  archiveTrackUrl,
  resolveItemLocation,
} from "@services/archiveUrl";
import {
  readNowPlaying,
  saveNowPlaying,
} from "@services/nowPlaying";
import {
  useProgress,
  useTrackPlayerEvents,
  Event,
  State,
} from "react-native-track-player";

type PlayerContextType = {
  isLoading: boolean;
  /** Which row is mid-load, so a track list can indicate it in place rather
   *  than unmounting itself behind a spinner. */
  loadingTrack: { showIdentifier: string; index: number } | null;
  /** Queued and waiting on the network. archive.org often takes 5s+ to first
   *  byte, and without this the bar just sits at 0:00 looking broken. */
  isBuffering: boolean;
  /** Whether the native player is on the track being displayed, so a caller
   *  knows if `duration` describes that track or the previous one. */
  durationIsForCurrentTrack: boolean;
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
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: any }) => {
  const [show, setShow] = useState<Show | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTrack, setLoadingTrack] = useState<{
    showIdentifier: string;
    index: number;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPlayingSongIndex, setCurrentPlayingSongIndex] = useState<
    number | null
  >(null);
  const [playerState, setPlayerState] = useState<State | null>(null);
  // Increments on every load; the newest tap wins. A load that finds the counter
  // moved on has been superseded and does nothing at all.
  const loadToken = useRef(0);
  // Loads run strictly one after another. Without this, a superseded load had
  // already issued its native reset(), which could land *after* the winning
  // load's add() — wiping the queue, so the following skip() threw
  // "The track index is out of bounds" and the load died mid-flight.
  const loadChain = useRef<Promise<void>>(Promise.resolve());
  // Which recording is currently queued natively. Tapping another track in the
  // same recording only needs a skip — not a reset and a re-add of every track.
  const queuedIdentifier = useRef<string | null>(null);
  // archive.org's datanodes return 5xx a large fraction of the time; measured
  // ~50% on one item. A couple of retries turns that into a usually-works.
  const retriesLeft = useRef(0);
  const MAX_PLAYBACK_RETRIES = 3;
  // Set when the retries are used up. Without it the native state stays
  // "buffering" forever and the bar spins indefinitely on a track that has
  // already definitively failed.
  const [playbackFailed, setPlaybackFailed] = useState(false);
  // Whether the user actually wants audio right now. The native player reports
  // "loading"/"buffering" merely from preparing a queue — which the start-up
  // restore does deliberately without playing — so intent is what decides
  // whether a buffering spinner is honest.
  const [intendsToPlay, setIntendsToPlay] = useState(false);
  // The track index is set optimistically so the bar names the right track at
  // once, which desynchronises it from the native player's `duration` — that
  // still describes the track the player is really on. Until it catches up,
  // `duration` must not be trusted, or the bar pairs a new title with the
  // previous track's length.
  const [durationIsForCurrentTrack, setDurationIsForCurrentTrack] =
    useState(false);
  // Something has been loaded by the user, so the restore below must not
  // overwrite it with whatever the native player was on at mount.
  const playbackClaimed = useRef(false);

  // Read inside the player-event handler, which must not close over a stale
  // render's `show`.
  const showRef = useRef<Show | null>(null);
  showRef.current = show;

  const progress = useProgress();

  const events = [
    Event.PlaybackState,
    Event.PlaybackError,
    Event.PlaybackActiveTrackChanged,
  ];

  useTrackPlayerEvents(events, (event) => {
    if (event.type === Event.PlaybackError) {
      // Was silently swallowed, which is why a track that failed to stream was
      // indistinguishable from one still loading.
      if (retriesLeft.current > 0) {
        retriesLeft.current -= 1;
        retryPlayback().catch(() => {
          /* the next error event will decide what happens */
        });
        return;
      }
      console.error("Playback failed after retries:", JSON.stringify(event));
      setPlaybackFailed(true);
      setLoadingTrack(null);
      setIsLoading(false);
    }
    if (event.type === Event.PlaybackState) {
      if (event.state === State.Playing) {
        // Only clear the failure flag. Deliberately does not refill the retry
        // budget or assert intent: a stream that flaps — plays a second, fails,
        // plays a second, fails — would top the budget up on every recovery and
        // retry forever. The budget is refilled per user action and per track
        // change instead.
        setPlaybackFailed(false);
      }
      setPlayerState(event.state);
    }
    // The player advances by itself at the end of a track (and from the lock
    // screen), so follow its index rather than only tracking our own taps.
    if (event.type === Event.PlaybackActiveTrackChanged) {
      // A different track is a fresh problem, so give it its own retry budget —
      // one bad track must not spend the whole queue's allowance as the player
      // advances through it.
      retriesLeft.current = MAX_PLAYBACK_RETRIES;
      // The player has moved: its duration now describes what we display.
      setDurationIsForCurrentTrack(true);
      setCurrentPlayingSongIndex(event.index ?? null);
      // Keep the saved position in step with advances we didn't initiate —
      // the end of a track, the lock screen, next/previous.
      const current = showRef.current;
      if (current?.showIdentifier && typeof event.index === "number") {
        void saveNowPlaying({
          date: current.date,
          showIdentifier: current.showIdentifier,
          trackIndex: event.index,
        });
      }
    }
  });

  // Bring the player bar back on start-up. Two cases, in order of preference.
  useEffect(() => {
    let cancelled = false;
    const superseded = () => cancelled || playbackClaimed.current;

    // 1. The native player still holds a queue and may still be playing — e.g.
    //    Android keeping playback alive after the app was killed. Adopt it.
    const adoptLivePlayer = async () => {
      const activeTrack = await getActiveTrack();
      const showDate = activeTrack?.showDate as string | undefined;
      const identifier = activeTrack?.showIdentifier as string | undefined;
      if (!showDate || !identifier) {
        return false;
      }
      const restored = findRecording(showDate, identifier);
      if (!restored || superseded()) {
        return false;
      }
      const [activeIndex, state] = await Promise.all([
        getActiveTrackIndex(),
        getState(),
      ]);
      if (superseded()) {
        return false;
      }
      queuedIdentifier.current = restored.showIdentifier ?? null;
      setShow(restored);
      setCurrentPlayingSongIndex(activeIndex ?? null);
      setPlayerState(state ?? null);
      return true;
    };

    // 2. Nothing is loaded natively — the usual case after a JS reload, since
    //    the old player is deliberately stopped and cleared. Rebuild from what
    //    was last saved, and re-queue it paused so the controls work.
    const rehydrateFromStorage = async () => {
      const saved = await readNowPlaying();
      if (!saved || superseded()) {
        return;
      }
      const restored = findRecording(saved.date, saved.showIdentifier);
      if (!restored?.tracks?.length || superseded()) {
        return;
      }
      const trackIndex = Math.min(
        Math.max(saved.trackIndex, 0),
        restored.tracks.length - 1
      );
      setShow(restored);
      setCurrentPlayingSongIndex(trackIndex);
      setDurationIsForCurrentTrack(false);

      const queue = await toQueue(restored);
      if (!queue.length || superseded()) {
        return;
      }
      // Load without playing: the bar comes back where it was, and the user
      // decides whether to resume.
      await addTracks(queue);
      if (superseded()) {
        return;
      }
      await skipToTrack(trackIndex);
      queuedIdentifier.current = restored.showIdentifier ?? null;
    };

    const restore = async () => {
      try {
        if (await adoptLivePlayer()) {
          return;
        }
        await rehydrateFromStorage();
      } catch {
        // No player set up yet (cold start) — nothing to restore.
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const isPlaying = playerState === State.Playing;
  // Not buffering once we've given up, however the native player still reports
  // itself — otherwise the bar spins forever on a track that will never load.
  const isBuffering =
    intendsToPlay &&
    !playbackFailed &&
    (playerState === State.Loading || playerState === State.Buffering);

  // Everything that means "the user wants audio now": fresh retry budget, clear
  // any previous failure, and mark intent so a buffering spinner is honest.
  const armPlayback = () => {
    retriesLeft.current = MAX_PLAYBACK_RETRIES;
    setPlaybackFailed(false);
    setIntendsToPlay(true);
  };

  const togglePlayerSize = () => {
    setIsExpanded((prev) => !prev);
  };

  // Shared by the load path and the mount-time restore.
  const toQueue = async (show: Show) => {
    const showIdentifier = show.showIdentifier;
    if (!showIdentifier) {
      return [];
    }
    // Which data node holds this item. Cached per item, short timeout, and falls
    // back to the /download/ URL — so this can only help, never block playback.
    const location = await resolveItemLocation(showIdentifier);
    return (show.tracks ?? []).map((track: Track) => ({
      artist: "Grateful Dead",
      title: track.title,
      url: archiveTrackUrl(showIdentifier, track.file, location),
      // Carried so the native player can identify what it holds.
      showDate: show.date,
      showIdentifier,
    }));
  };

  /** The archive record for a saved/queued identifier, preferring one with tracks. */
  const findRecording = (date: string, showIdentifier: string) => {
    const year = showYear(date);
    if (!year) {
      return undefined;
    }
    const candidates = getSelectedYearData(year).filter(
      (candidate) =>
        candidate.date === date && candidate.showIdentifier === showIdentifier
    );
    // Some identifiers appear on more than one archive record, and one of them
    // can be a stub with no track list.
    return candidates.find((candidate) => candidate.tracks?.length) ?? candidates[0];
  };

  const loadAudioAndPlay = async (show: Show, trackIndex: number) => {
    // A few archive records have no identifier or no track list; without this the
    // URL becomes ".../undefined/..." and the player fails silently.
    if (!show?.showIdentifier || !show?.tracks?.length) {
      return;
    }
    const token = ++loadToken.current;
    const superseded = () => loadToken.current !== token;
    // Tells the mount-time restore not to overwrite this.
    playbackClaimed.current = true;

    // Everything the player bar displays is already known from the archive
    // record, so show it now rather than after a ~100ms reset and a network
    // round-trip. Only the playhead has to wait for the native player.
    setShow(show);
    setCurrentPlayingSongIndex(trackIndex);
    setDurationIsForCurrentTrack(false);

    armPlayback();

    // Same recording already queued: a skip is all that's needed.
    const alreadyQueued = queuedIdentifier.current === show.showIdentifier;
    if (!alreadyQueued) {
      setLoadingTrack({ showIdentifier: show.showIdentifier, index: trackIndex });
      setIsLoading(true);
    }

    const run = loadChain.current.then(async () => {
      // Superseded while queued behind an earlier load: issue nothing.
      if (superseded()) {
        return;
      }
      if (alreadyQueued) {
        await skipToTrack(trackIndex);
        return;
      }
      queuedIdentifier.current = null;
      const formattedTracks = await toQueue(show);
      if (!formattedTracks.length || superseded()) {
        return;
      }
      await clearAudioFromStorage();
      if (superseded()) {
        return;
      }
      await addTracks(formattedTracks);
      if (superseded()) {
        return;
      }
      await skipToTrack(trackIndex);
      queuedIdentifier.current = show.showIdentifier ?? null;
      void saveNowPlaying({
        date: show.date,
        showIdentifier: show.showIdentifier!,
        trackIndex,
      });
    });

    // Keep the chain alive regardless of how this load ends.
    loadChain.current = run.then(
      () => undefined,
      () => undefined
    );

    try {
      await run;
      if (!superseded()) {
        await playTrack();
      }
    } catch (error) {
      console.error("Could not start playback:", error);
    } finally {
      // Only the newest load owns the spinner; an older one must not clear it.
      if (!superseded()) {
        setLoadingTrack(null);
        setIsLoading(false);
      }
    }
  };

  const clearAudioFromStorage = async () => {
    queuedIdentifier.current = null;
    await reset();
  };

  const handleSeek = async (value: number) => {
    await seekTo(value);
  };

  // These deliberately do not set `currentPlayingSongIndex`. The native player
  // owns it and reports every change through Event.PlaybackActiveTrackChanged —
  // including advances we didn't ask for, like skipping a track that failed to
  // stream. Writing it here too made two writers disagree: a single "next" tap
  // could jump three tracks because the optimistic +1 raced the real index.
  const handleNextSongAction = async () => {
    armPlayback();
    await nextSongAction();
  };

  const handlePreviousSongAction = async () => {
    armPlayback();
    await previousSongAction();
  };

  const trackSelectAction = async (selectedTrackIndex: number) => {
    armPlayback();
    await selectTrack(selectedTrackIndex);
  };

  const togglePlayPause = async () => {
    if (isPlaying) {
      setIntendsToPlay(false);
    } else {
      // Resuming a restored queue needs its own retry budget: the archive fails
      // a large fraction of requests, and without this the first one was fatal.
      armPlayback();
    }
    await handlePlayPause();
  };

  return (
    <PlayerContext.Provider
      value={{
        isPlaying,
        isLoading,
        loadingTrack,
        isBuffering,
        durationIsForCurrentTrack,
        isExpanded,
        togglePlayerSize,
        duration: progress.duration,
        position: progress.position,
        show,
        currentPlayingSongIndex,
        handleSeek,
        handlePlayPause: togglePlayPause,
        nextSongAction: handleNextSongAction,
        previousSongAction: handlePreviousSongAction,
        trackSelectAction,
        loadAudioAndPlay,
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
