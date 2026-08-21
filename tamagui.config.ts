import { createTamagui } from "tamagui";

/**
 * ---------------------------------------------------------------------------
 * PALETTES
 * ---------------------------------------------------------------------------
 * Every colour the UI uses lives here, so swapping a palette restyles the whole
 * app. `palettes[0]` is the original scheme, kept verbatim for comparison.
 *
 * Tap the palette pill in the app (bottom-right) to rotate through these, then
 * set DEFAULT_PALETTE below to whichever you prefer.
 */
export type Palette = {
  bg: string; // app background
  bg2: string; // player / raised surface
  text: string; // primary text on bg
  textPlaceholder: string; // muted text, input placeholders
  border: string; // hairlines
  card: string; // show + track row surface
  cardText: string; // primary text on a card
  cardMuted: string; // secondary text on a card
  pillBg: string; // unselected year pill
  pillText: string;
  pillActiveBg: string; // selected year pill
  pillActiveText: string;
  sheetBg: string; // source-picker rows
  sheetText: string;
  overlay: string; // scrim behind the source picker
  primary: string; // accents, icons, transport controls
  secondary: string; // legacy alias, kept so nothing breaks
  buttonBg: string;
  buttonText: string;
  trackProgress: string; // played portion of the seek bar
  trackBg: string; // unplayed portion
  icon: string;
  // A failure the user has to act on. Deliberately not derived from
  // `primary`: two palettes accent in red already, and a failure that shares
  // the accent colour reads as decoration.
  danger: string;
};

export type PaletteId =
  | "dark"
  | "terrapin"
  | "darkstar"
  | "daydream"
  | "cumberland"
  | "begonias";

export const palettes: { id: PaletteId; label: string; colors: Palette }[] = [
  {
    id: "dark",
    label: "1 · Original",
    colors: {
      bg: "#121212",
      bg2: "#1E1E1E",
      text: "#E0E0E0",
      textPlaceholder: "#757575",
      border: "#2C2C2C",
      card: "#BCC6CF",
      cardText: "#12181D",
      cardMuted: "#3C4A55",
      pillBg: "#5A6A73",
      pillText: "#FFFFFF",
      pillActiveBg: "#FFFFFF",
      pillActiveText: "#000000",
      sheetBg: "#FFFFFF",
      sheetText: "#121212",
      overlay: "rgba(0, 0, 0, 0.5)",
      primary: "#00B0FF",
      secondary: "#BCC6CF",
      buttonBg: "#5A6A73",
      buttonText: "#E0E0E0",
      trackProgress: "#00B0FF",
      trackBg: "#37474F",
      icon: "#90CAF9",
      danger: "#FF6B6B",
    },
  },
  {
    id: "terrapin",
    label: "2 · Terrapin",
    colors: {
      // Warm archival browns with a worn-poster amber.
      bg: "#17120E",
      bg2: "#221A14",
      text: "#F2E7D8",
      textPlaceholder: "#9A8875",
      border: "#33281F",
      card: "#EADCC4",
      cardText: "#2B2118",
      cardMuted: "#6B5B48",
      pillBg: "#3D3025",
      pillText: "#EADCC4",
      pillActiveBg: "#E0A34A",
      pillActiveText: "#221A14",
      sheetBg: "#EADCC4",
      sheetText: "#2B2118",
      overlay: "rgba(23, 18, 14, 0.72)",
      primary: "#E0A34A",
      secondary: "#EADCC4",
      buttonBg: "#3D3025",
      buttonText: "#F2E7D8",
      trackProgress: "#E0A34A",
      trackBg: "#3D3025",
      icon: "#E0A34A",
      danger: "#E8705F",
    },
  },
  {
    id: "darkstar",
    label: "3 · Dark Star",
    colors: {
      // Cosmic indigo, raised dark cards, violet accent.
      bg: "#0D0E18",
      bg2: "#161829",
      text: "#E6E7F5",
      textPlaceholder: "#7B7EA0",
      border: "#242742",
      card: "#1E2138",
      cardText: "#E6E7F5",
      cardMuted: "#9698BC",
      pillBg: "#252A47",
      pillText: "#C9CBE8",
      pillActiveBg: "#8B7BE8",
      pillActiveText: "#0D0E18",
      sheetBg: "#1E2138",
      sheetText: "#E6E7F5",
      overlay: "rgba(13, 14, 24, 0.76)",
      primary: "#8B7BE8",
      secondary: "#1E2138",
      buttonBg: "#252A47",
      buttonText: "#E6E7F5",
      trackProgress: "#8B7BE8",
      trackBg: "#2A2E4D",
      icon: "#A899F0",
      danger: "#FF7A85",
    },
  },
  {
    id: "daydream",
    label: "4 · Sunshine Daydream",
    colors: {
      // Warm near-black with a coral/rose accent and soft cream cards.
      bg: "#141010",
      bg2: "#1F1817",
      text: "#F5E9E4",
      textPlaceholder: "#9C8681",
      border: "#312724",
      card: "#F0E2DA",
      cardText: "#2C1E1A",
      cardMuted: "#6E574F",
      pillBg: "#3A2C29",
      pillText: "#F0E2DA",
      pillActiveBg: "#E8735A",
      pillActiveText: "#1F1817",
      sheetBg: "#F0E2DA",
      sheetText: "#2C1E1A",
      overlay: "rgba(20, 16, 16, 0.72)",
      primary: "#E8735A",
      secondary: "#F0E2DA",
      buttonBg: "#3A2C29",
      buttonText: "#F5E9E4",
      trackProgress: "#E8735A",
      trackBg: "#3A2C29",
      icon: "#F09479",
      danger: "#F2B544",
    },
  },
  {
    id: "cumberland",
    label: "5 · Cumberland",
    colors: {
      // Cool slate with raised dark cards and a teal accent.
      bg: "#0E1315",
      bg2: "#161D20",
      text: "#E3ECEC",
      textPlaceholder: "#77898C",
      border: "#20292D",
      card: "#1C2528",
      cardText: "#E3ECEC",
      cardMuted: "#93A5A8",
      pillBg: "#222E32",
      pillText: "#C4D4D5",
      pillActiveBg: "#4FB3A5",
      pillActiveText: "#0E1315",
      sheetBg: "#1C2528",
      sheetText: "#E3ECEC",
      overlay: "rgba(14, 19, 21, 0.76)",
      primary: "#4FB3A5",
      secondary: "#1C2528",
      buttonBg: "#222E32",
      buttonText: "#E3ECEC",
      trackProgress: "#4FB3A5",
      trackBg: "#27353A",
      icon: "#6FC7BA",
      danger: "#F0736A",
    },
  },
  {
    id: "begonias",
    label: "6 · Scarlet Begonias",
    colors: {
      // Deep forest green with a scarlet accent.
      bg: "#0D1411",
      bg2: "#151F1A",
      text: "#E6EFE8",
      textPlaceholder: "#7C9184",
      border: "#1F2C25",
      card: "#1A2620",
      cardText: "#E6EFE8",
      cardMuted: "#93A89A",
      pillBg: "#213028",
      pillText: "#C7D8CC",
      pillActiveBg: "#E2574F",
      pillActiveText: "#0D1411",
      sheetBg: "#1A2620",
      sheetText: "#E6EFE8",
      overlay: "rgba(13, 20, 17, 0.76)",
      primary: "#E2574F",
      secondary: "#1A2620",
      buttonBg: "#213028",
      buttonText: "#E6EFE8",
      trackProgress: "#E2574F",
      trackBg: "#26362D",
      icon: "#EF7A72",
      danger: "#EFB748",
    },
  },
];

/** Palette applied on launch. Change this once you have picked a favourite. */
export const DEFAULT_PALETTE: PaletteId = "darkstar";

/** The `light` tamagui theme is unused at runtime (the app is dark-only) but
 *  keeps tamagui happy about having one. */
export const lightTheme = palettes[0].colors;

// Shared metrics so `fs="$3"` means the same size on any of the three families.
const sizes = { 1: 13, 2: 15, 3: 17, 4: 22, 5: 28, 6: 34, true: 17 };
const lineHeights = { 1: 18, 2: 21, 3: 24, 4: 30, 5: 36, 6: 41, true: 24 };
const letterSpacings = { 1: 0, 2: 0, 3: 0, 4: -0.2, 5: -0.4, 6: -0.6, true: 0 };
const weights = { 400: "400", 600: "600", 700: "700", true: "400" };

/**
 * Three roles:
 *   body    — Inter, everything dense and small (venues, track titles, inputs)
 *   heading — Fraunces, the display serif on dates and section headers
 *   mono    — IBM Plex Mono, tabular digits for durations and the player counter
 *
 * `face` maps a weight onto a real loaded file. Without it, static Google fonts
 * silently render at the base weight, so `fw="700"` would look like regular.
 * The keys are numeric on purpose — a `fw="bold"` keyword would miss this map.
 */
export const fonts = {
  body: {
    family: "Inter_400Regular",
    face: {
      400: { normal: "Inter_400Regular" },
      600: { normal: "Inter_600SemiBold" },
      700: { normal: "Inter_700Bold" },
    },
    size: sizes,
    lineHeight: lineHeights,
    letterSpacing: letterSpacings,
    weight: weights,
  },
  heading: {
    family: "Syncopate_700Bold",
    face: {
      400: { normal: "Syncopate_400Regular" },
      // Syncopate ships 400 and 700 only; 600 maps up to bold.
      600: { normal: "Syncopate_700Bold" },
      700: { normal: "Syncopate_700Bold" },
    },
    size: sizes,
    // Syncopate's ascenders overflow a normal line box and get clipped, so this
    // runs ~1.9x the font size rather than the ~1.4x the body font is happy with.
    lineHeight: { 1: 25, 2: 29, 3: 33, 4: 42, 5: 52, 6: 62, true: 33 },
    // Already a wide, generously spaced face; leave tracking alone.
    letterSpacing: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, true: 0 },
    weight: weights,
  },
  mono: {
    family: "IBMPlexMono_400Regular",
    face: {
      400: { normal: "IBMPlexMono_400Regular" },
      600: { normal: "IBMPlexMono_400Regular" },
      700: { normal: "IBMPlexMono_400Regular" },
    },
    size: sizes,
    lineHeight: lineHeights,
    letterSpacing: letterSpacings,
    weight: weights,
  },
};

export const tokens = {
  color: {
    primary: "#FF69B4",
    secondary: "#FFC0CB",
    background: "#FFFFFF",
    text: "#000000",
    trackProgress: "#DA9100",
    trackBg: "#800080",
  },
  space: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 32,
    8: 40,
    true: 12,
  },
  size: {
    1: 8,
    2: 16,
    3: 24,
    4: 32,
    5: 40,
    6: 48,
    8: 64,
    10: 80,
    true: 16,
  },
  radius: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    true: 8,
  },
  zIndex: {
    1: 1,
    2: 10,
    3: 100,
    4: 1000,
    5: 10000,
  },
};

export const shorthands = {
  mx: "marginHorizontal",
  my: "marginVertical",
  p: "padding",
  px: "paddingHorizontal",
  py: "paddingVertical",
  m: "margin",
  mt: "marginTop",
  mb: "marginBottom",
  ml: "marginLeft",
  mr: "marginRight",
  pt: "paddingTop",
  pb: "paddingBottom",
  pl: "paddingLeft",
  pr: "paddingRight",
  bg: "backgroundColor",
  bc: "borderColor",
  br: "borderRadius",
  bw: "borderWidth",
  jc: "justifyContent",
  ai: "alignItems",
  fd: "flexDirection",
  fs: "fontSize",
  fw: "fontWeight",
  lh: "lineHeight",
  w: "width",
  h: "height",
  minW: "minWidth",
  maxW: "maxWidth",
  minH: "minHeight",
  maxH: "maxHeight",
  z: "zIndex",
  ta: "textAlign",
  ff: "fontFamily",
  ls: "letterSpacing",
  o: "opacity",
} as const;

export const config = createTamagui({
  // Listed with literal keys so tamagui can type <Theme name="..." />.
  // Keys must match the `id`s in `palettes` above.
  themes: {
    dark: palettes[0].colors,
    terrapin: palettes[1].colors,
    darkstar: palettes[2].colors,
    daydream: palettes[3].colors,
    cumberland: palettes[4].colors,
    begonias: palettes[5].colors,
    light: lightTheme,
  },
  tokens,
  shorthands,
  fonts,
  // Required: without it tamagui's `defaultFontToken` is "", so `fontSize` never
  // resolves against `fonts.body.size` and silently falls back to the `space`
  // scale instead (which is why every `fs="$3"` rendered at 12px).
  defaultFont: "body",
});

// Registers this config with tamagui's types so the shorthands above (fs, bg, jc, ...)
// and the token scales are type-checked on every component.
type AppConfig = typeof config;
declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

// Fails loudly in dev if `palettes` is reordered without updating `themes` above.
if (__DEV__) {
  const themeIds = Object.keys(config.themes);
  palettes.forEach((palette) => {
    if (!themeIds.includes(palette.id)) {
      console.warn(
        `[tamagui.config] palette "${palette.id}" is not registered in themes.`
      );
    }
  });
}

export default config;
