import { createMMKV } from "react-native-mmkv";

/**
 * Synchronous because the playback position is written when the app leaves the
 * foreground, and an async write is not guaranteed to land before iOS suspends.
 */
export const storage = createMMKV({ id: "thewheel" });

/** Falls back rather than throwing, so one corrupt value can't take a screen down. */
export const readJson = <T>(key: string, fallback: T): T => {
  const stored = storage.getString(key);
  if (!stored) {
    return fallback;
  }
  try {
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error(`Could not parse stored "${key}":`, error);
    return fallback;
  }
};

export const writeJson = (key: string, value: unknown) => {
  try {
    storage.set(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Could not store "${key}":`, error);
  }
};
