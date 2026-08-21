/**
 * Audio URLs for archive.org items.
 *
 * Two problems this solves.
 *
 * 1. Encoding. 17% of the archive's track filenames contain characters that are
 *    invalid in a URL path — 60,749 tracks carry a space, and others hold `'`,
 *    `&`, `,`, `>`, `(`, `)` or `#`. Interpolating them raw produced a malformed
 *    URL the native player silently refused, so those recordings never played.
 *    A few filenames (215) are genuinely subdirectory paths, so `/` must survive:
 *    each segment is encoded separately.
 *
 * 2. Routing. `archive.org/download/{id}/{file}` is a redirect tier that picks a
 *    data node per item and sticks to it — measured 8/8 requests to the same
 *    node — and the node it picks is often unhealthy. Measured twice, hours
 *    apart: the redirect served 4/8 and 4/9, while the item's own data node,
 *    named by `archive.org/metadata/{id}`, served 8/8 and 9/9. Because the
 *    redirect is sticky, retrying cannot route around a bad node; using the data
 *    node directly can.
 *
 * The metadata lookup is best-effort and never on the critical path. Playback used
 * to await it for up to 6s before a queue was even built, which — against an
 * endpoint measured succeeding 1 time in 8 — usually meant a six-second stall
 * followed by the `/download/` fallback anyway. Now a caller waits `LOCATION_WAIT_MS`
 * at most and the request outlives that deadline, so a lookup too slow for this
 * play still warms the cache for the next one. Prefetch it when a recording comes
 * on screen (`prefetchItemLocation`) and the wait is usually zero.
 *
 * On any failure it falls back to the `/download/` URL — i.e. exactly the previous
 * behaviour, never worse.
 */

const DOWNLOAD_HOST = "https://archive.org/download";
const METADATA_HOST = "https://archive.org/metadata";
/** Ceiling on the request itself, independent of how long any one caller waits. */
const METADATA_TIMEOUT_MS = 6000;
/** How long a caller that needs a URL *now* will wait before falling back. The
 *  request is not cancelled when this expires — see `resolveItemLocation`. */
const LOCATION_WAIT_MS = 800;

type ItemLocation = { server: string; dir: string };

/**
 * Resolved locations, successes only. Failures are deliberately not cached: the
 * metadata endpoint is itself intermittent, and caching a miss would send the
 * whole session down the flaky redirect path because of one bad request.
 */
const locations = new Map<string, ItemLocation>();

/**
 * Lookups currently on the wire, keyed by item. A prefetch and the play that
 * follows it join one request instead of issuing two, and a caller that gives up
 * waiting doesn't cancel it for everyone else.
 */
const inFlight = new Map<string, Promise<ItemLocation | null>>();

const encodePath = (file: string) =>
  file.split("/").map(encodeURIComponent).join("/");

/** The `/download/` URL. Always valid, but routed through the flaky tier. */
export const archiveDownloadUrl = (showIdentifier: string, file: string) =>
  `${DOWNLOAD_HOST}/${encodeURIComponent(showIdentifier)}/${encodePath(file)}`;

/** The network call. Bounded only by its own ceiling, never by a caller's patience. */
const requestLocation = async (
  showIdentifier: string
): Promise<ItemLocation | null> => {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), METADATA_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${METADATA_HOST}/${encodeURIComponent(showIdentifier)}`,
      { signal: timeout.signal }
    );
    if (!response.ok) {
      console.warn(`Archive metadata HTTP ${response.status}; using /download/`);
      return null;
    }
    const metadata = await response.json();
    const server = metadata?.server;
    const dir = metadata?.dir;
    if (typeof server !== "string" || typeof dir !== "string" || !server || !dir) {
      console.warn("Archive metadata had no server/dir; using /download/");
      return null;
    }
    const location = { server, dir };
    locations.set(showIdentifier, location);
    return location;
  } catch (error) {
    console.warn(
      `Archive metadata unavailable (${String(error)}); using /download/`
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
};

/** Joins the lookup already running for this item, or starts one. */
const lookup = (showIdentifier: string): Promise<ItemLocation | null> => {
  const running = inFlight.get(showIdentifier);
  if (running) {
    return running;
  }
  const request = requestLocation(showIdentifier).finally(() => {
    inFlight.delete(showIdentifier);
  });
  inFlight.set(showIdentifier, request);
  return request;
};

/**
 * Start the lookup without waiting for it. Call this when a recording comes on
 * screen: the user reads a track list for seconds before tapping one, which is
 * long enough for the lookup to land, so the tap then starts on the item's own
 * data node with no wait at all.
 */
export const prefetchItemLocation = (showIdentifier?: string | null) => {
  if (!showIdentifier || locations.has(showIdentifier)) {
    return;
  }
  void lookup(showIdentifier);
};

/**
 * Which data node holds this item, or null if that can't be established in the
 * time the caller has. Successes are cached; failures are not, so one bad request
 * doesn't send the rest of the session down the flaky redirect path.
 */
export const resolveItemLocation = async (
  showIdentifier: string,
  waitMs: number = LOCATION_WAIT_MS
): Promise<ItemLocation | null> => {
  const cached = locations.get(showIdentifier);
  if (cached) {
    return cached;
  }

  const request = lookup(showIdentifier);
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Losing this race is not a failure. The request keeps running and caches its
  // result, so the wait is spent once per item rather than once per play.
  const gaveUp = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), waitMs);
  });
  try {
    return await Promise.race([request, gaveUp]);
  } finally {
    clearTimeout(timer);
  }
};

/** Audio URL for one track, using the item's data node when it is known. */
export const archiveTrackUrl = (
  showIdentifier: string,
  file: string,
  location?: ItemLocation | null
) => {
  if (!location) {
    return archiveDownloadUrl(showIdentifier, file);
  }
  return `https://${location.server}${location.dir}/${encodePath(file)}`;
};
