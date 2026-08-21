import type { AddTrack } from "react-native-track-player";
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  State,
} from "react-native-track-player";

export const setupPlayer = async () => {
  try {
    // Throws until the player has been set up, so a successful read means
    // there's nothing to do — e.g. after a JS reload with audio still playing.
    await TrackPlayer.getActiveTrackIndex();
    return true;
  } catch {
    // Not set up yet. Fall through; a failure below is a real failure and must
    // reach the caller rather than be reported as `false`.
  }

  await TrackPlayer.setupPlayer();
  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior:
        AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
    },
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.Stop,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause],
    notificationCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
    ],
  });

  return true;
};

export const playbackService = async () => {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
};

/** Reads back what the native player is currently on, for rehydrating after a
 *  JS reload — the playback service outlives the JS context. */
export const getActiveTrack = async () => TrackPlayer.getActiveTrack();

export const getActiveTrackIndex = async () => TrackPlayer.getActiveTrackIndex();

export const addTracks = async (tracks: AddTrack[]) => {
  await TrackPlayer.add(tracks);
};

export const playTrack = async () => {
  await TrackPlayer.play();
};

export const reset = async () => {
  await TrackPlayer.reset();
};

export const seekTo = async (value: number) => {
  await TrackPlayer.seekTo(value);
};

export const nextSongAction = async () => {
  await TrackPlayer.skipToNext();
};

export const previousSongAction = async () => {
  await TrackPlayer.skipToPrevious();
};

export const selectTrack = async (selectedTrackIndex: number) => {
  await TrackPlayer.skip(selectedTrackIndex);
  return await TrackPlayer.play();
};

/** Re-attempt the current track after a playback error. archive.org's datanodes
 *  fail intermittently, so a failed stream is often fine on a second try. */
export const retryPlayback = async () => {
  await TrackPlayer.retry();
};

/** Skip without starting playback, so a caller can finish preparing the queue
 *  before handing off to the player. */
export const skipToTrack = async (selectedTrackIndex: number) => {
  await TrackPlayer.skip(selectedTrackIndex);
};

export const getState = async () => {
  return (await TrackPlayer.getPlaybackState()).state;
};

export const handlePlayPause = async () => {
  const { state } = await TrackPlayer.getPlaybackState();
  if (state === State.Playing) {
    return TrackPlayer.pause();
  } else {
    return TrackPlayer.play();
  }
};
