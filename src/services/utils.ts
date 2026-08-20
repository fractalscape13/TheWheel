export const secondsToFormattedMinutesSeconds = (seconds: number) => {
  // Round to whole seconds first, so 59.9s formats as 1:00 rather than 0:60.
  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

export const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  // Format in UTC. Building the date at UTC midnight and then formatting in the
  // device's zone shifted every show a day later for anyone at or east of UTC.
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString(undefined, {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const years = [
  1965, 1966, 1967, 1968, 1969, 1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977,
  1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990,
  1991, 1992, 1993, 1994, 1995,
];
