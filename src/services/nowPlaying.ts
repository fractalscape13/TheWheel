import * as SecureStore from "expo-secure-store";

const NOW_PLAYING = "nowPlaying";

/** Enough to rebuild the player bar and its queue from the archive. */
export type NowPlaying = {
  date: string;
  showIdentifier: string;
  trackIndex: number;
};

/**
 * The last thing the user played.
 *
 * The native player cannot be relied on for this: on a JS reload the whole
 * native module is rebuilt, and the old player is stopped and cleared (see the
 * `invalidate()` patch in patches/react-native-track-player) precisely so it
 * can't keep playing as an orphan. That leaves nothing to read back, so what
 * was playing has to be recorded here instead.
 *
 * Best-effort throughout: losing this is a cosmetic regression, never a reason
 * to fail a playback action.
 */
export const saveNowPlaying = async (nowPlaying: NowPlaying) => {
  try {
    await SecureStore.setItemAsync(NOW_PLAYING, JSON.stringify(nowPlaying));
  } catch (error) {
    console.error("Could not save now-playing:", error);
  }
};

export const readNowPlaying = async (): Promise<NowPlaying | null> => {
  try {
    const stored = await SecureStore.getItemAsync(NOW_PLAYING);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored) as Partial<NowPlaying>;
    if (
      typeof parsed?.date !== "string" ||
      typeof parsed?.showIdentifier !== "string" ||
      typeof parsed?.trackIndex !== "number"
    ) {
      return null;
    }
    return {
      date: parsed.date,
      showIdentifier: parsed.showIdentifier,
      trackIndex: parsed.trackIndex,
    };
  } catch (error) {
    console.error("Could not read now-playing:", error);
    return null;
  }
};
