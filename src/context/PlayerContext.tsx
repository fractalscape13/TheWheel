import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
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
import { showYear, trackLengthToSeconds } from "@services/utils";
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
  /** The retry budget is spent and this track will not load without another
   *  attempt. Distinct from paused: nothing is going to happen on its own. */
  playbackFailed: boolean;
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
  retryCurrentTrack: () => Promise<void>;
  loadAudioAndPlay: (show: Show, trackIndex: number) => Promise<void>;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

/** Playback continues in the background, so checkpoints alone can go stale for
 *  a long time before the app is killed. This bounds what's lost. */
const POSITION_SAVE_INTERVAL_MS = 15000;

/** Below this, seeking just forces a re-buffer for nothing. */
const RESUME_FLOOR_SECONDS = 3;
/** Above this the user would resume in the outro, or past the end. */
const RESUME_END_MARGIN_SECONDS = 5;

const resumePosition = (saved: number | undefined, track?: Track) => {
  if (!saved || saved < RESUME_FLOOR_SECONDS) {
    return 0;
  }
  const length = trackLengthToSeconds(track?.length);
  if (length > 0 && saved > length - RESUME_END_MARGIN_SECONDS) {
    return 0;
  }
  return saved;
};

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
  // Shown until the native player reports a position of its own, which it can't
  // until the queue is built. Tagged with its track so it expires on its own.
  const [restoredPosition, setRestoredPosition] = useState<{
    index: number;
    seconds: number;
  } | null>(null);

  // Read inside the player-event handler, which must not close over a stale
  // render's `show`.
  const showRef = useRef<Show | null>(null);
  showRef.current = show;

  const progress = useProgress();

  // Same reason as showRef — the listeners below run outside the render that
  // created them.
  const currentIndexRef = useRef<number | null>(null);
  currentIndexRef.current = currentPlayingSongIndex;
  // Assigned below from the resolved position, not the raw native one.
  const positionRef = useRef(0);

  // Lets the throttle skip a write when the position hasn't moved.
  const lastWriteRef = useRef({ at: 0, position: -1 });

  // Set while we drive the native player ourselves, so a checkpoint that fires
  // mid-restore can't record a position the seek hasn't reached yet.
  const suppressTrackWritesRef = useRef(false);

  // The index we last deliberately skipped to, cleared once the player reports
  // it. `addTracks` announces index 0 before the skip lands, and those events
  // arrive asynchronously — so a plain time window doesn't hold, and persisting
  // the stray 0 reset the saved track to 1. While a skip is outstanding only the
  // matching index is believed; once reached, later changes are genuine advances.
  const intendedIndexRef = useRef<number | null>(null);

  /** Stable and render-free, so listeners can call it without invalidating. */
  const persistNowPlaying = useCallback(
    (overrides?: { trackIndex?: number; position?: number }) => {
      if (suppressTrackWritesRef.current) {
        return;
      }
      const current = showRef.current;
      const trackIndex = overrides?.trackIndex ?? currentIndexRef.current;
      if (!current?.showIdentifier || typeof trackIndex !== "number") {
        return;
      }
      const position = Math.max(0, overrides?.position ?? positionRef.current);
      lastWriteRef.current = { at: Date.now(), position };
      saveNowPlaying({
        date: current.date,
        showIdentifier: current.showIdentifier,
        trackIndex,
        position,
      });
    },
    []
  );

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
      // A natural checkpoint — no reason to wait for the throttle.
      if (event.state === State.Paused) {
        persistNowPlaying();
      }
      setPlayerState(event.state);
    }
    // The player advances by itself at the end of a track (and from the lock
    // screen), so follow its index rather than only tracking our own taps.
    if (event.type === Event.PlaybackActiveTrackChanged) {
      const next = event.index ?? null;
      const previous = currentIndexRef.current;
      const asked = intendedIndexRef.current !== null && next === intendedIndexRef.current;
      // A stream that fails outright drops the native player back to index 0.
      // Following that moved the user to track 1 and saved it there, so only a
      // skip we asked for is allowed to move backwards; anything else must be
      // the player advancing on its own.
      if (!asked && previous !== null && next !== null && next < previous) {
        return;
      }
      if (asked) {
        intendedIndexRef.current = null;
      }
      // A different track is a fresh problem, so give it its own retry budget —
      // one bad track must not spend the whole queue's allowance as the player
      // advances through it.
      retriesLeft.current = MAX_PLAYBACK_RETRIES;
      // The player has moved: its duration now describes what we display.
      setDurationIsForCurrentTrack(true);
      setCurrentPlayingSongIndex(next);
      // Position is pinned to 0, not read from the ref, which still holds the
      // outgoing track's position.
      if (next !== null) {
        persistNowPlaying({ trackIndex: next, position: 0 });
      }
    }
  });

  // Bring the player bar back on start-up. Two cases, in order of preference.
  useEffect(() => {
    let cancelled = false;
    const superseded = () => cancelled || playbackClaimed.current;

    // Adopt a player that is still holding audio — e.g. Android keeping
    // playback alive after the app was killed.
    const adoptLivePlayer = async () => {
      const [activeTrack, state] = await Promise.all([
        getActiveTrack(),
        getState(),
      ]);
      // Only a player that is actually running is worth adopting, and this has
      // to be decided *before* touching any UI state. A JS reload leaves the
      // outgoing queue readable for a moment while it is being torn down, and
      // adopting that is what flashed the previous track on every reload.
      const isLive =
        state === State.Playing ||
        state === State.Buffering ||
        state === State.Loading;
      if (!isLive) {
        return false;
      }
      const showDate = activeTrack?.showDate as string | undefined;
      const identifier = activeTrack?.showIdentifier as string | undefined;
      if (!showDate || !identifier) {
        return false;
      }
      const restored = findRecording(showDate, identifier);
      if (!restored || superseded()) {
        return false;
      }
      const activeIndex = await getActiveTrackIndex();
      if (superseded()) {
        return false;
      }
      queuedIdentifier.current = restored.showIdentifier ?? null;
      setShow(restored);
      setCurrentPlayingSongIndex(activeIndex ?? null);
      setPlayerState(state ?? null);
      // Its own position is authoritative; drop anything the storage pass showed.
      setRestoredPosition(null);
      return true;
    };

    // 2. Show what was saved. Everything here is local — a keychain read and an
    //    array scan — so the bar comes back on the right track, at the right
    //    place, without waiting on the network or the native player.
    type Resumable = { show: Show; trackIndex: number; resumeAt: number };

    const showSaved = (): Resumable | null => {
      const saved = readNowPlaying();
      if (!saved || superseded()) {
        return null;
      }
      const restored = findRecording(saved.date, saved.showIdentifier);
      if (!restored?.tracks?.length || superseded()) {
        return null;
      }
      const trackIndex = Math.min(
        Math.max(saved.trackIndex, 0),
        restored.tracks.length - 1
      );
      const resumeAt = resumePosition(
        saved.position,
        restored.tracks[trackIndex]
      );
      setShow(restored);
      setCurrentPlayingSongIndex(trackIndex);
      setDurationIsForCurrentTrack(false);
      setRestoredPosition({ index: trackIndex, seconds: resumeAt });
      return { show: restored, trackIndex, resumeAt };
    };

    // Queue it up paused so the controls work; changes nothing on screen.
    const queueSaved = async ({ show, trackIndex, resumeAt }: Resumable) => {
      const queue = await toQueue(show);
      if (!queue.length || superseded()) {
        return;
      }
      await addTracks(queue);
      if (superseded()) {
        return;
      }
      intendedIndexRef.current = trackIndex;
      await skipToTrack(trackIndex);
      queuedIdentifier.current = show.showIdentifier ?? null;
      if (resumeAt > 0 && !superseded()) {
        await seekTo(resumeAt);
      }
    };

    const restore = async () => {
      suppressTrackWritesRef.current = true;
      try {
        // Saved state first: reading the native player first rendered whatever
        // the dying queue reported, flashing the previous track on every reload.
        const resumable = showSaved();
        if (await adoptLivePlayer()) {
          return;
        }
        if (resumable) {
          await queueSaved(resumable);
        }
      } catch {
        // No player set up yet (cold start) — nothing to restore.
      } finally {
        suppressTrackWritesRef.current = false;
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const isPlaying = playerState === State.Playing;

  // The native position wins once it has one; until then show where the restore
  // is putting the user back, so the bar never reads 0:00 for a resumed track.
  const position =
    progress.position > 0
      ? progress.position
      : restoredPosition?.index === currentPlayingSongIndex
        ? restoredPosition.seconds
        : progress.position;
  positionRef.current = position;
  // Not buffering once we've given up, however the native player still reports
  // itself — otherwise the bar spins forever on a track that will never load.
  const isBuffering =
    intendsToPlay &&
    !playbackFailed &&
    (playerState === State.Loading || playerState === State.Buffering);

  // The last reliable moment before iOS may suspend the app. Playback continues
  // past this, which is what the throttle below covers.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        persistNowPlaying();
      }
    });
    return () => {
      // Also covers the provider itself going away — a JS reload tears this
      // context down without any AppState transition at all.
      persistNowPlaying();
      subscription.remove();
    };
  }, [persistNowPlaying]);

  // No timer of its own: this rides the render useProgress already causes every
  // second, and only writes when the position actually advanced.
  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    if (Date.now() - lastWriteRef.current.at < POSITION_SAVE_INTERVAL_MS) {
      return;
    }
    if (Math.abs(progress.position - lastWriteRef.current.position) < 1) {
      return;
    }
    persistNowPlaying();
  }, [isPlaying, progress.position, persistNowPlaying]);

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
    // Which data node holds this item. Bounded to a fraction of a second and
    // falling back to the /download/ URL, so this can only help; ShowDetails
    // prefetches it, which is what usually makes the wait zero.
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
        intendedIndexRef.current = trackIndex;
        await skipToTrack(trackIndex);
        return;
      }
      queuedIdentifier.current = null;
      const formattedTracks = await toQueue(show);
      if (!formattedTracks.length || superseded()) {
        return;
      }
      suppressTrackWritesRef.current = true;
      try {
        await clearAudioFromStorage();
        if (superseded()) {
          return;
        }
        await addTracks(formattedTracks);
        if (superseded()) {
          return;
        }
        intendedIndexRef.current = trackIndex;
        await skipToTrack(trackIndex);
        queuedIdentifier.current = show.showIdentifier ?? null;
      } finally {
        suppressTrackWritesRef.current = false;
      }
      persistNowPlaying({ trackIndex, position: 0 });
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
    // Declared, or the backwards move reads as a failure artifact and is ignored.
    const current = currentIndexRef.current;
    if (current !== null && current > 0) {
      intendedIndexRef.current = current - 1;
    }
    await previousSongAction();
  };

  const trackSelectAction = async (selectedTrackIndex: number) => {
    armPlayback();
    intendedIndexRef.current = selectedTrackIndex;
    await selectTrack(selectedTrackIndex);
  };

  // `TrackPlayer.retry()` rather than `play()`: after a PlaybackError the native
  // player is sitting on an item it has already given up on, and play() does not
  // re-attempt it. This is the same call the automatic budget makes.
  const retryCurrentTrack = async () => {
    armPlayback();
    try {
      await retryPlayback();
    } catch (error) {
      // The error event won't fire for a retry that never started, so put the
      // failure back rather than leaving the bar in a spinner it can't leave.
      console.error("Retry could not be started:", error);
      setPlaybackFailed(true);
    }
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
        playbackFailed,
        isLoading,
        loadingTrack,
        isBuffering,
        durationIsForCurrentTrack,
        isExpanded,
        togglePlayerSize,
        duration: progress.duration,
        position,
        show,
        currentPlayingSongIndex,
        handleSeek,
        handlePlayPause: togglePlayPause,
        nextSongAction: handleNextSongAction,
        previousSongAction: handlePreviousSongAction,
        trackSelectAction,
        retryCurrentTrack,
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
