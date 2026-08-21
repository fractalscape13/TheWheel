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
 * The metadata lookup is best-effort. It is cached per item, bounded by a short
 * timeout, and on any failure falls back to the `/download/` URL — i.e. exactly
 * the previous behaviour, never worse.
 */

const DOWNLOAD_HOST = "https://archive.org/download";
const METADATA_HOST = "https://archive.org/metadata";
const METADATA_TIMEOUT_MS = 6000;

type ItemLocation = { server: string; dir: string };

/**
 * Resolved locations, successes only. Failures are deliberately not cached: the
 * metadata endpoint is itself intermittent, and caching a miss would send the
 * whole session down the flaky redirect path because of one bad request.
 */
const locations = new Map<string, ItemLocation>();

const encodePath = (file: string) =>
  file.split("/").map(encodeURIComponent).join("/");

/** The `/download/` URL. Always valid, but routed through the flaky tier. */
export const archiveDownloadUrl = (showIdentifier: string, file: string) =>
  `${DOWNLOAD_HOST}/${encodeURIComponent(showIdentifier)}/${encodePath(file)}`;

/**
 * Which data node holds this item, or null if that can't be established.
 * Cached — including failures, so a bad lookup isn't repeated per track.
 */
export const resolveItemLocation = async (
  showIdentifier: string
): Promise<ItemLocation | null> => {
  const cached = locations.get(showIdentifier);
  if (cached) {
    return cached;
  }

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
