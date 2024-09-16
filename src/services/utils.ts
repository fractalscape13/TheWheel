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