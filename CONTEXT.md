# Context

Domain language for The Wheel — one entry per term the code is allowed to name things after.
If a module, type, or variable uses a word that isn't here, either it's the wrong word or
this file is out of date.

The app browses and plays the Grateful Dead live archive hosted on archive.org, 1965–1995.

There is a local, git-ignored `docs/` scratchpad for architecture notes. Nothing in it is
authoritative and some of it describes designs that were never built; this file is the
shared reference.

---

## Show

A **performance** — the band playing on one date. **1,952** of them, keyed by
[canonical date](#canonical-date).

Not something the archive stores: it's derived by grouping **Recordings** by date. Users
think in Shows — the browse list renders one row per Show, and a favorite is a Show.

`venue` and `location` live on the **Recording**, not the Show, and the archive disagrees
with itself: 860 dates carry conflicting venue strings, mostly spelling noise
(`Crystal Ballroom` / `The Crystal Ballroom`) but with a genuinely wrong tail — `1967-03-18`
claims both Winterland and the Carousel Ballroom. So a Show has no single agreed venue, and
each screen shows the venue of whichever Recording it is displaying.

**Known conflation:** ~20 dates had both an early and a late performance. Keyed by date they
collapse into one Show holding the recordings of both. Accepted deliberately.

## Recording

A **taped source** of a Show — one archive.org item with its own lineage, track list and
audio files. This is what plays.

**17,341** of them, so a Show averages nine; 1,862 Shows have more than one and the
most-taped has 39. Identified by `showIdentifier`, the archive.org item id. That id is
**not** unique — 35 are duplicated, and one of each pair can be a stub with no tracks — so
lookups prefer a record that has tracks.

Prefer this word over **Source**, which here means the lineage string.

## Source

The **lineage** of a Recording — the `source` field. Free text describing how the tape was
made: `Master Soundboard Reels > Cassette > Reel to Reel > Dat`. Not a synonym for Recording.
The UI's "multiple sources exist" wording is legacy and means multiple Recordings.

## SBD / AUD

The two broad kinds of Recording, read out of the `showIdentifier` and shown as a bold
prefix: **SBD** soundboard (off the desk, cleaner), **AUD** audience (more atmosphere, more
noise). Not part of any preference rule.

## Playable

A Recording is **playable** when it has both a `showIdentifier` and at least one track —
without both, no audio URL can be built. **6** Recordings have no tracks and **1** has no
identifier. A Show is playable when any of its Recordings is. Implemented as `isPlayable`.

## Preferred Recording

The Recording a Show offers by default: the first **playable** one, else the first. One rule
in one place on purpose — the browse list, the favorites list and the detail screen must all
open the same Recording, or the same Show looks like a different show depending on how you
reached it.

## Canonical date

A show date reduced to a comparison key, because six records spell dates differently —
`03/21/90`, `9-7-1973`, `1974-05-17 00:00:00`, `1967-04`. Grouping on the raw string listed
one performance twice and yielded nonsense years, which broke favorites and made rows
untappable.

`YYYY-MM-DD`, except one month-precision record that stays `YYYY-MM` — it must not collapse
onto `1967-04-01`, a different known show. `parseShowDate`, `normalizeShowDate`, `showYear`.

## Now playing

The last Recording and track index the user played, persisted so the player bar survives a
reload. The native player can't be asked: a JS reload rebuilds the native module and the old
player is stopped deliberately (see the `invalidate()` patch in `patches/`), leaving nothing
to read back.

## Data node

The archive.org server actually holding an item, from `archive.org/metadata/{id}`. Audio is
requested from it directly because `archive.org/download/{id}` is a redirect tier that picks
one node per item and sticks to it — measured 4/8 successful there versus 8/8 on the node —
so retrying cannot route around a bad one. Falls back to the `/download/` URL.

## Archive

The whole collection of Shows and Recordings. Currently 31 checked-in data files
(`src/services/*-bones.tsx`, 42 MB) imported eagerly, so all of it is in the JS bundle.

Two shapes to know about across its **360,661** tracks: **60,749** filenames contain
characters needing URL encoding (a space, `'`, `&`, `,`, `#`, `{}`), and **40,487** store
`length` as raw decimal seconds (`"708.44"`) rather than `MM:SS`.

## Bones

The legacy name of those data files (`showBones1977`) — "the raw archive records for one
year". Historical, not a domain concept; don't name anything new after it.
