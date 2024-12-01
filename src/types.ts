export interface Show {
  date: string;
  index: number;
  location: string;
  showIdentifier: string;
  source: string;
  venue: string;
  type: string;
  tracks?: {
    file: string;
    length: string;
    title: string;
  }[];
}

export interface Track {
  title: string;
  length: string;
  file: string;
}
