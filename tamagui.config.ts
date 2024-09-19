import { createTamagui } from "tamagui";

export const lightTheme = {
  bg: "#FFFFFF",                // White background
  bg2: "#F0F0F0",               // Slightly darker background for contrast
  text: "#000000",              // Black text for readability
  textPlaceholder: "#808080",   // Gray for placeholders
  border: "#E0E0E0",            // Light gray for borders
  buttonBg: "#00B0FF",          // Cyan button background
  buttonText: "#FFFFFF",        // White text on buttons
  trackProgress: "#00B0FF",     // Cyan for progress bar
  trackBg: "#D0D0D0",           // Light gray for track background
  icon: "#000000",              // Black icons
  primary: "#00B0FF",           // Cyan for primary actions or highlights
  secondary: "#9BB4C6",         // Light blue for secondary actions or highlights
};


export const darkTheme = {
  bg: "#121212",               // Dark background
  bg2: "#1E1E1E",              // Slightly lighter background for contrast
  text: "#E0E0E0",             // Light gray text for readability
  textPlaceholder: "#757575",  // Muted gray for placeholders
  border: "#2C2C2C",           // Darker gray for borders
  buttonBg: "#5A6A73",         // Gray button background
  buttonText: "#E0E0E0",       // Light text on buttons
  trackProgress: "#00B0FF",    // Cyan for progress bar
  trackBg: "#37474F",          // Slate gray for track background
  icon: "#90CAF9",             // Light blue for icons
  primary: "#00B0FF",          // Cyan for primary actions or highlights
  secondary: "#9BB4C6",        // Light blue for secondary actions or highlights
};

export const fonts = {
  body: {
    family: "System",
    weight: {
      400: "normal",
      700: "bold",
    },
    size: {
      $1: 12,
      $2: 14,
      $3: 16,
      $4: 20,
      $5: 24,
    },
    lineHeight: {
      $1: 16,
      $2: 18,
      $3: 22,
      $4: 28,
      $5: 32,
    },
    letterSpacing: {
      $1: 0,
      $2: 0.5,
      $3: 1,
    },
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
    $1: 3,
    $2: 6,
    $3: 9,
    $4: 12,
    $5: 15,
    $6: 24,
    $7: 32,
    $8: 40,
    true: 12, // Added default space key
  },
  size: {
    $1: 8,
    $2: 16,
    $3: 24,
    $4: 32,
    $5: 40,
    $6: 48,  // Add this size
    $8: 64,  // Add this size
    $10: 80, // Add this size
    true: 16,  
  },
  fontSize: {
    $1: 12,
    $2: 14,
    $3: 16,
    $4: 20,
    $5: 24,
    $6: 32,
    true: 16,
  },  
  radius: {
    $1: 4,
    $2: 8,
    $3: 12,
    $4: 16,
    $5: 20,
  },
  zIndex: {
    $1: 1,
    $2: 10,
    $3: 100,
    $4: 1000,
    $5: 10000,
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
};

export const config = createTamagui({
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  tokens,
  shorthands,
  fonts,
});

export default config;
