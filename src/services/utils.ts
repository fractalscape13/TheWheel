export const millisToMinutesAndSeconds = (millis: number) => {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

export const formatDate = (dateString: string, abbreviated?: boolean) => {
  const [year, month, day] = dateString.split("-").map(Number); 
  const date = new Date(Date.UTC(year, month - 1, (day + 1)));
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: abbreviated ? "short" : "long",
    day: "numeric",
  });
};

export const years = [
  1965,
  1966,
  1967,
  1968,
  1969,
  1970,
  1971,
  1972,
  1973,
  1974,
  1975,
  1976,
  1977,
  1978,
  1979,
  1980,
  1981,
  1982,
  1983,
  1984,
  1985,
  1986,
  1987,
  1988,
  1989,
  1990,
  1991,
  1992,
  1993,
  1994,
  1995,
];