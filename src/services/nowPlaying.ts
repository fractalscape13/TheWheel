import { readJson, writeJson } from "@services/storage";

const NOW_PLAYING = "nowPlaying";

/** Enough to rebuild the player bar and its queue from the archive. */
export type NowPlaying = {
  date: string;
  showIdentifier: string;
  trackIndex: number;
  /** Seconds into the track. Optional — older records without it resume from 0. */
  position?: number;
};

/**
 * The last thing the user played. The native player can't be asked: a JS reload
 * rebuilds the module and the old player is stopped deliberately (see the
 * `invalidate()` patch), leaving nothing to read back.
 */
export const saveNowPlaying = (nowPlaying: NowPlaying) => {
  writeJson(NOW_PLAYING, nowPlaying);
};

export const readNowPlaying = (): NowPlaying | null => {
  const parsed = readJson<Partial<NowPlaying> | null>(NOW_PLAYING, null);
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
    // A bad position costs the user their place in one track; returning null
    // would lose the show and the track too.
    position:
      typeof parsed.position === "number" && Number.isFinite(parsed.position)
        ? Math.max(0, parsed.position)
        : 0,
  };
};
