export interface Show {
  date: string;
  location: string;
  venue: string;
  tracks?: { title: string }[];
}

export interface Track {
  title: string;
  length: string;
  file: string;
};
