export type RawLapForList = {
  RaceName: string;
  Lap: number;
  Length: number;
};

export type RawResult = {
  RaceName: string;
  Lap: number;
  ID: number;
  Username: string;
  avatar: string;
  "Used energy": number;
  Efficiency: number;
  Shellefficiency: number;
  "Average power": number;
  "Average speed": number;
  "Elapsed time": string;
};

export type TableRow = {
  key: string;
  id: number;
  username: string;
  avatar: string;
  lap: number;
  usedEnergy: number;
  efficiency: number;
  shellEfficiency: number;
  avgPower: number;
  avgSpeed: number;
  elapsedTime: string;
};

export type Competitor = {
  id: number;
  username: string;
  avatar: string;
  U: number;
  I: number;
  m: number;
  ageGroup: string;
};

export type TechnicalScore = {
  design: number;
  team: number;
  additional: number;
};
