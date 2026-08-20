import type { AddTrack } from "react-native-track-player";
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  State,
} from "react-native-track-player";

export const setupPlayer = async () => {
  let isSetup = false;
  try {
    await TrackPlayer.getActiveTrackIndex();
    isSetup = true;
    console.log(`Track Player Setup: -->>> ${isSetup}`);
  } catch {
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

    isSetup = true;
    console.log(`Track Player Setup: -->>> ${isSetup}`);
  } finally {
    return isSetup;
  }
};

export const playbackService = async () => {
  console.log("Track Player ::: Setting up playback service");
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    console.log("Track Player ::: Remote play event received");
    TrackPlayer.play();
  });
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    console.log("Track Player ::: Remote pause event received");
    TrackPlayer.pause();
  });
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
