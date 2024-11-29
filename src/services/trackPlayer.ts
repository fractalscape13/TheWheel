import TrackPlayer, {
  Event,
  RepeatMode,
  AppKilledPlaybackBehavior,
} from "react-native-track-player";

export const setupPlayer = async () => {
  let isSetup = false;
  try {
    await TrackPlayer.getActiveTrackIndex();
    isSetup = true;
  } catch {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
    });
    isSetup = true;
  } finally {
    console.log(`Track Player Setup: -->>> ${isSetup}`);
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
