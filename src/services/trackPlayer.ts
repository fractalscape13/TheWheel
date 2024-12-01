import TrackPlayer, {
  Event,
  State,
} from "react-native-track-player";

export const setupPlayer = async () => {
  let isSetup = false;
  try {
    await TrackPlayer.getCurrentTrack();
    isSetup = true;
    console.log(`Track Player Setup: -->>> ${isSetup}`);
  }
  catch {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      stopWithApp: true,
      capabilities: [
          TrackPlayer.CAPABILITY_PLAY,
          TrackPlayer.CAPABILITY_PAUSE,
          TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
          TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
          TrackPlayer.CAPABILITY_STOP,
      ],
      compactCapabilities: [
          TrackPlayer.CAPABILITY_PLAY,
          TrackPlayer.CAPABILITY_PAUSE,
      ],
      notificationCapabilities: [
          TrackPlayer.CAPABILITY_PLAY,
          TrackPlayer.CAPABILITY_PAUSE,
          TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
          TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
      ],
  });

    isSetup = true;
    console.log(`Track Player Setup: -->>> ${isSetup}`);
  }
  finally {
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

export const addTracks = async (tracks: []) => { await TrackPlayer.add(tracks) }

export const playTrack = async () => { await TrackPlayer.play() }

export const reset = async () => { await TrackPlayer.reset() }

export const seekTo = async (value:number) => { await TrackPlayer.seekTo(value) };

export const nextSongAction = async () => { await TrackPlayer.skipToNext() };

export const previousSongAction = async () => { await TrackPlayer.skipToPrevious() };

export const selectTrack = async (selectedTrackIndex:number) => { 
  await TrackPlayer.skip(selectedTrackIndex)
  return await TrackPlayer.play()
 };

export const getState = async () => { await TrackPlayer.getState() };

export const handlePlayPause = async () => {
  const state = await TrackPlayer.getState();
  if (state === State.Playing) {
    return TrackPlayer.pause();
  } else {
    return TrackPlayer.play();
  }
};





