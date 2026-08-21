export const secondsToFormattedMinutesSeconds = (seconds: number) => {
  // Round to whole seconds first, so 59.9s formats as 1:00 rather than 0:60.
  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

/** The archive's length field, in seconds, or 0 if it can't be read. Lets the
 *  player show a real total time immediately instead of 0:00, which is all the
 *  native player can report until the remote file has buffered. */
export const trackLengthToSeconds = (length?: string | number) => {
  if (length === undefined || length === null) {
    return 0;
  }
  const raw = String(length).trim();
  const clock = raw.match(/^(\d+):(\d{2})(?::(\d{2}))?/);
  if (clock) {
    const [, a, b, c] = clock;
    return c
      ? Number(a) * 3600 + Number(b) * 60 + Number(c)
      : Number(a) * 60 + Number(b);
  }
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : 0;
};

/** The archive stores track lengths three ways: "MM:SS" (most), raw decimal
 *  seconds like "708.44" (~11% of tracks), and one stray "07:54s". Render them
 *  all as MM:SS so a track list doesn't mix formats. */
export const formatTrackLength = (length?: string | number) => {
  if (length === undefined || length === null) {
    return "";
  }
  const raw = String(length).trim();
  // Already a clock value, possibly with trailing junk ("07:54s").
  const clock = raw.match(/^(\d+):(\d{2})(?::(\d{2}))?/);
  if (clock) {
    const [, a, b, c] = clock;
    return c
      ? `${a}:${b}:${c}`
      : `${a.padStart(2, "0")}:${b}`;
  }
  const seconds = Number(raw);
  if (!Number.isFinite(seconds)) {
    return raw;
  }
  const total = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
    total % 60
  ).padStart(2, "0")}`;
};

/**
 * The archive's date field is mostly `YYYY-MM-DD`, but seven records are not,
 * and every one of them broke something:
 *
 *   "1974-05-17 00:00:00"  a timestamp        -> rendered "Invalid Date"
 *   "1981-07-10 00:00:00"                     -> rendered "Invalid Date"
 *   "1983-06-28 00:00:00"                     -> rendered "Invalid Date"
 *   "1967-04"              month precision    -> rendered "Invalid Date"
 *   "1970-07-00"           day unknown        -> rendered "Jun 30, 1970"
 *   "9-7-1973"             month-day-year     -> rendered "Nov 24, 1914"
 *   "03/21/90"             US short form      -> year parsed as 3
 *
 * The last three are the dangerous ones: each displayed a confidently wrong
 * date, and the last two yielded a nonsense year, so the year lookup that turns
 * a favorite back into a show found nothing and the row silently died.
 *
 * Both were disambiguated against the archive itself rather than guessed:
 * "9-7-1973" is at Nassau Coliseum, Uniondale NY, and 1973-09-07 exists there
 * while 1973-07-09 does not exist at all; "03/21/90" is at Copps Coliseum,
 * Hamilton ON, and 1990-03-21 exists there. Both are month-first.
 */
export type ShowDateParts = { year: number; month?: number; day?: number };

export const parseShowDate = (dateString?: string): ShowDateParts | null => {
  if (!dateString) {
    return null;
  }
  // Drop a trailing time; it is always midnight and carries nothing.
  const datePart = dateString.trim().split(/[ T]/)[0];

  const ymd = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const year = +ymd[1];
    const month = +ymd[2];
    const day = +ymd[3];
    // A zero means the archive doesn't know that part of the date. Passing it to
    // Date.UTC rolled back into the previous month instead.
    if (!month) {
      return { year };
    }
    return day ? { year, month, day } : { year, month };
  }
  const ym = datePart.match(/^(\d{4})-(\d{1,2})$/);
  if (ym) {
    return { year: +ym[1], month: +ym[2] };
  }
  const y = datePart.match(/^(\d{4})$/);
  if (y) {
    return { year: +y[1] };
  }
  const mdy = datePart.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mdy) {
    return { year: +mdy[3], month: +mdy[1], day: +mdy[2] };
  }
  const shortMdy = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (shortMdy) {
    // The archive spans 1965-1995, so a two-digit year is always 19xx.
    return { year: 1900 + +shortMdy[3], month: +shortMdy[1], day: +shortMdy[2] };
  }
  return null;
};

/**
 * A show date reduced to a canonical key, so records that describe the same
 * performance in different formats group together. Without this, "03/21/90" and
 * "1990-03-21" listed the same Copps Coliseum show as two separate rows.
 *
 * Month-precision records keep month precision: "1967-04" must not collapse
 * onto "1967-04-01", which is a different, known show.
 */
export const normalizeShowDate = (dateString?: string) => {
  const parts = parseShowDate(dateString);
  if (!parts) {
    return dateString ?? "";
  }
  const pad = (value: number) => String(value).padStart(2, "0");
  const yearMonth = `${parts.year}-${pad(parts.month ?? 1)}`;
  return parts.day === undefined ? yearMonth : `${yearMonth}-${pad(parts.day)}`;
};

/** The year a record belongs to, for looking it up in the archive. */
export const showYear = (dateString?: string) =>
  parseShowDate(dateString)?.year ?? null;

export const formatDate = (dateString: string) => {
  const parts = parseShowDate(dateString);
  if (!parts) {
    // Unrecognised: show what the archive actually says rather than
    // "Invalid Date" or, worse, a confidently wrong date.
    return dateString;
  }
  // Format in UTC. Building the date at UTC midnight and then formatting in the
  // device's zone shifted every show a day later for anyone at or east of UTC.
  const date = new Date(
    Date.UTC(parts.year, (parts.month ?? 1) - 1, parts.day ?? 1)
  );
  return date.toLocaleDateString(undefined, {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    // One record has month precision only; don't imply a day it doesn't claim.
    ...(parts.day === undefined ? {} : { day: "numeric" }),
  });
};

export const years = [
  1965, 1966, 1967, 1968, 1969, 1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977,
  1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990,
  1991, 1992, 1993, 1994, 1995,
];
