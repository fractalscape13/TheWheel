import { readJson, writeJson } from "@services/storage";
import { FAVORITE_SHOWS } from "../constants";

/**
 * Favorited Shows, as the raw `date` strings the archive records carry. Raw and
 * not canonical because the lookup that turns a favorite back into a Show
 * matches on `date`, and five dates are spelled two ways in the archive.
 */
export const readFavoriteShowDates = (): string[] => {
  const stored = readJson<unknown>(FAVORITE_SHOWS, []);
  if (!Array.isArray(stored)) {
    return [];
  }
  return stored.filter((date): date is string => typeof date === "string");
};

export const isFavorited = (date: string) =>
  readFavoriteShowDates().includes(date);

/** Adds or removes, and reports the state it left things in. */
export const toggleFavoriteShowDate = (date: string) => {
  const current = readFavoriteShowDates();
  const wasFavorited = current.includes(date);
  writeJson(
    FAVORITE_SHOWS,
    wasFavorited ? current.filter((stored) => stored !== date) : [...current, date]
  );
  return !wasFavorited;
};
