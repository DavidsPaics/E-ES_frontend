// src/data/fakeData.ts
// Centralized fake data for visualization and demo purposes

// ============================================
// COMPETITORS
// ============================================
export type FakeCompetitor = {
  id: number;
  username: string;
  U: number;
  I: number;
  m: number;
  ageGroup: string;
  avatar: string;
};

export const fakeCompetitors: FakeCompetitor[] = [
  { id: 1, username: "Lightning McQueen", U: 48, I: 12, m: 85, ageGroup: "A", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=1" },
  { id: 2, username: "Speed Racer", U: 52, I: 10, m: 78, ageGroup: "A", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=2" },
  { id: 3, username: "Turbo Thunder", U: 45, I: 15, m: 92, ageGroup: "A", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=3" },
  { id: 4, username: "Electric Eagle", U: 50, I: 11, m: 80, ageGroup: "B", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=4" },
  { id: 5, username: "Volt Viper", U: 48, I: 14, m: 88, ageGroup: "B", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=5" },
  { id: 6, username: "Spark Storm", U: 55, I: 9, m: 75, ageGroup: "B", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=6" },
  { id: 7, username: "Watt Warrior", U: 46, I: 13, m: 82, ageGroup: "C", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=7" },
  { id: 8, username: "Amp Avenger", U: 51, I: 12, m: 90, ageGroup: "C", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=8" },
  { id: 9, username: "Current Cruiser", U: 49, I: 11, m: 77, ageGroup: "C", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=9" },
  { id: 10, username: "Battery Blitz", U: 53, I: 10, m: 84, ageGroup: "A", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=10" },
  { id: 11, username: "Ohm Overlord", U: 47, I: 14, m: 86, ageGroup: "B", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=11" },
  { id: 12, username: "Circuit Chaser", U: 50, I: 12, m: 81, ageGroup: "C", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=12" },
];

// ============================================
// LEADERBOARD DATA
// ============================================
export type FakeLeaderboardEntry = {
  ID: number;
  username: string;
  avatar: string;
  position_change: number;
  "Category names": string[];
  "Category points": number[];
};

const categoryNames = ["EkoRace", "MainRace", "DragRace", "ShuttleRun", "SteeringTest", "BrakingTest"];

export const fakeLeaderboardAll: FakeLeaderboardEntry[] = fakeCompetitors.map((c) => ({
  ID: c.id,
  username: c.username,
  avatar: c.avatar,
  position_change: Math.floor(Math.random() * 5) - 2,
  "Category names": categoryNames,
  "Category points": categoryNames.map(() => Math.floor(Math.random() * 100) + 20),
}));

export const fakeLeaderboardByAgeGroup: Record<string, FakeLeaderboardEntry[]> = {
  all: fakeLeaderboardAll,
  A: fakeLeaderboardAll.filter((_, i) => fakeCompetitors[i].ageGroup === "A"),
  B: fakeLeaderboardAll.filter((_, i) => fakeCompetitors[i].ageGroup === "B"),
  C: fakeLeaderboardAll.filter((_, i) => fakeCompetitors[i].ageGroup === "C"),
};

// ============================================
// LIVE DATA (WebSocket simulation)
// ============================================
export type FakeLiveRow = {
  key: string;
  ID: number;
  username: string;
  avatar: string;
  status: "online" | "offline" | "ping";
  position: number;
  lat: number;
  lon: number;
  spd: number;
  power: number;
  acceleration: number;
  voltage: number;
  updatedAt: string;
};

// Jelgava track area coordinates (approximately)
const baseCoords = { lat: 56.66090993638844, lon: 23.74363904512851 };

export const fakeLiveData: FakeLiveRow[] = fakeCompetitors.slice(0, 8).map((c, idx) => ({
  key: `live-${c.id}`,
  ID: c.id,
  username: c.username,
  avatar: c.avatar,
  status: idx < 5 ? "online" : idx < 7 ? "ping" : "offline",
  position: idx + 1,
  lat: baseCoords.lat + (Math.random() - 0.5) * 0.005,
  lon: baseCoords.lon + (Math.random() - 0.5) * 0.008,
  spd: Math.floor(Math.random() * 40) + 15,
  power: Math.floor(Math.random() * 500) + 100,
  acceleration: parseFloat((Math.random() * 3).toFixed(2)),
  voltage: 36 + Math.random() * 12,
  updatedAt: new Date(Date.now() - Math.random() * 60000).toISOString(),
}));

// Function to generate updated live data (for simulating WebSocket updates)
export const generateUpdatedLiveData = (): FakeLiveRow[] => {
  return fakeLiveData.map(row => ({
    ...row,
    lat: row.lat + (Math.random() - 0.5) * 0.0005,
    lon: row.lon + (Math.random() - 0.5) * 0.0008,
    spd: Math.max(0, Math.min(60, row.spd + (Math.random() - 0.5) * 10)),
    power: Math.max(50, Math.min(800, row.power + (Math.random() - 0.5) * 100)),
    acceleration: parseFloat((Math.random() * 3).toFixed(2)),
    voltage: Math.max(32, Math.min(48, row.voltage + (Math.random() - 0.5) * 2)),
    updatedAt: new Date().toISOString(),
    position: Math.floor(Math.random() * 8) + 1,
  }));
};

// ============================================
// RESULTS DATA
// ============================================
export type FakeResultEntry = {
  ID: number;
  Username: string;
  avatar: string;
  "Used energy": number;
  "Average power": number;
  "Average speed": number;
  "Elapsed time": string;
  Points: number;
};

export const fakeRaceConfigs = [
  { RaceName: "EkoRace", Length: 2.5, Coef: 1.2, SortBy: "efficiency", Distribution: [100, 80, 65, 50, 40, 30, 25, 20, 15, 10] },
  { RaceName: "MainRace", Length: 5.0, Coef: 1.0, SortBy: "time", Distribution: [100, 80, 65, 50, 40, 30, 25, 20, 15, 10] },
  { RaceName: "DragRace", Length: 0.4, Coef: 1.5, SortBy: "time", Distribution: [100, 80, 65, 50, 40, 30, 25, 20, 15, 10] },
  { RaceName: "ShuttleRun", Length: 1.0, Coef: 1.3, SortBy: "time", Distribution: [100, 80, 65, 50, 40, 30, 25, 20, 15, 10] },
  { RaceName: "SteeringTest", Length: 0.5, Coef: 1.1, SortBy: "time", Distribution: [100, 80, 65, 50, 40, 30, 25, 20, 15, 10] },
  { RaceName: "BrakingTest", Length: 0.3, Coef: 1.4, SortBy: "distance", Distribution: [100, 80, 65, 50, 40, 30, 25, 20, 15, 10] },
];

const generateTime = (baseMinutes: number, variation: number): string => {
  const totalSeconds = baseMinutes * 60 + (Math.random() - 0.5) * variation;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const cs = Math.floor((seconds % 1) * 100);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(Math.floor(seconds)).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
};

export const fakeResultsByRace: Record<string, FakeResultEntry[]> = {
  EkoRace: fakeCompetitors.map((c, idx) => ({
    ID: c.id,
    Username: c.username,
    avatar: c.avatar,
    "Used energy": parseFloat((Math.random() * 50 + 30).toFixed(2)),
    "Average power": parseFloat((Math.random() * 200 + 150).toFixed(2)),
    "Average speed": parseFloat((Math.random() * 20 + 25).toFixed(2)),
    "Elapsed time": generateTime(8, 120),
    Points: Math.max(0, 100 - idx * 8),
  })),
  MainRace: fakeCompetitors.map((c, idx) => ({
    ID: c.id,
    Username: c.username,
    avatar: c.avatar,
    "Used energy": parseFloat((Math.random() * 80 + 60).toFixed(2)),
    "Average power": parseFloat((Math.random() * 300 + 200).toFixed(2)),
    "Average speed": parseFloat((Math.random() * 25 + 30).toFixed(2)),
    "Elapsed time": generateTime(15, 180),
    Points: Math.max(0, 100 - idx * 8),
  })),
  DragRace: fakeCompetitors.map((c, idx) => ({
    ID: c.id,
    Username: c.username,
    avatar: c.avatar,
    "Used energy": parseFloat((Math.random() * 15 + 10).toFixed(2)),
    "Average power": parseFloat((Math.random() * 500 + 400).toFixed(2)),
    "Average speed": parseFloat((Math.random() * 15 + 45).toFixed(2)),
    "Elapsed time": generateTime(0.5, 15),
    Points: Math.max(0, 100 - idx * 8),
  })),
  ShuttleRun: fakeCompetitors.map((c, idx) => ({
    ID: c.id,
    Username: c.username,
    avatar: c.avatar,
    "Used energy": parseFloat((Math.random() * 30 + 20).toFixed(2)),
    "Average power": parseFloat((Math.random() * 250 + 180).toFixed(2)),
    "Average speed": parseFloat((Math.random() * 18 + 28).toFixed(2)),
    "Elapsed time": generateTime(3, 60),
    Points: Math.max(0, 100 - idx * 8),
  })),
  SteeringTest: fakeCompetitors.map((c, idx) => ({
    ID: c.id,
    Username: c.username,
    avatar: c.avatar,
    "Used energy": parseFloat((Math.random() * 20 + 15).toFixed(2)),
    "Average power": parseFloat((Math.random() * 180 + 120).toFixed(2)),
    "Average speed": parseFloat((Math.random() * 12 + 18).toFixed(2)),
    "Elapsed time": generateTime(2, 45),
    Points: Math.max(0, 100 - idx * 8),
  })),
  BrakingTest: fakeCompetitors.map((c, idx) => ({
    ID: c.id,
    Username: c.username,
    avatar: c.avatar,
    "Used energy": parseFloat((Math.random() * 10 + 5).toFixed(2)),
    "Average power": parseFloat((Math.random() * 150 + 100).toFixed(2)),
    "Average speed": parseFloat((Math.random() * 10 + 30).toFixed(2)),
    "Elapsed time": generateTime(0.3, 10),
    Points: Math.max(0, 100 - idx * 8),
  })),
};

// ============================================
// RACE CONFIGURATION
// ============================================
export type FakeRace = {
  RaceName: string;
  Lap: number;
  Length: number;
};

export const fakeRaces: FakeRace[] = [
  { RaceName: "EkoRace", Lap: 1, Length: 2.5 },
  { RaceName: "EkoRace", Lap: 2, Length: 2.5 },
  { RaceName: "EkoRace", Lap: 3, Length: 2.5 },
  { RaceName: "MainRace", Lap: 1, Length: 5.0 },
  { RaceName: "MainRace", Lap: 2, Length: 5.0 },
  { RaceName: "MainRace", Lap: 3, Length: 5.0 },
  { RaceName: "DragRace", Lap: 1, Length: 0.4 },
  { RaceName: "DragRace", Lap: 2, Length: 0.4 },
  { RaceName: "ShuttleRun", Lap: 1, Length: 1.0 },
  { RaceName: "ShuttleRun", Lap: 2, Length: 1.0 },
  { RaceName: "SteeringTest", Lap: 1, Length: 0.5 },
  { RaceName: "SteeringTest", Lap: 2, Length: 0.5 },
  { RaceName: "BrakingTest", Lap: 1, Length: 0.3 },
  { RaceName: "BrakingTest", Lap: 2, Length: 0.3 },
];

// ============================================
// POINTS DATA (for Points page)
// ============================================
export type FakeRawResult = {
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

export const fakePointsResults: FakeRawResult[] = fakeCompetitors.flatMap((c) =>
  fakeRaces.filter(r => r.RaceName === "EkoRace" || r.RaceName === "MainRace").map(race => ({
    RaceName: race.RaceName,
    Lap: race.Lap,
    ID: c.id,
    Username: c.username,
    avatar: c.avatar,
    "Used energy": parseFloat((Math.random() * 50 + 30).toFixed(2)),
    Efficiency: parseFloat((Math.random() * 30 + 70).toFixed(2)),
    Shellefficiency: parseFloat((Math.random() * 20 + 75).toFixed(2)),
    "Average power": parseFloat((Math.random() * 200 + 150).toFixed(2)),
    "Average speed": parseFloat((Math.random() * 20 + 25).toFixed(2)),
    "Elapsed time": generateTime(8, 120),
  }))
);

// ============================================
// ADMIN SETTINGS
// ============================================
export const fakeAdminSettings = {
  PowerCoef: 1.5,
  MaxSpd: 60,
  FullRaceLength: 0,
  DragRaceLength: 0,
};

// ============================================
// CATEGORY PAGE COMPETITORS (with timer states)
// ============================================
export type FakeCategoryCompetitor = {
  id: number;
  username: string;
  avatar: string;
  startedAt?: string;
  finishedAt?: string;
};

export const fakeCategoryCompetitors: FakeCategoryCompetitor[] = fakeCompetitors.map((c, idx) => ({
  id: c.id,
  username: c.username,
  avatar: c.avatar,
  // Some competitors already have times
  startedAt: idx < 4 ? new Date(Date.now() - (300000 + Math.random() * 600000)).toISOString() : undefined,
  finishedAt: idx < 2 ? `0${Math.floor(Math.random() * 5) + 3}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}.${String(Math.floor(Math.random() * 100)).padStart(2, "0")}` : undefined,
}));

// ============================================
// MAIN PAGE STATISTICS
// ============================================
export const fakeMainPageStats = {
  totalCompetitors: fakeCompetitors.length,
  activeRaces: 3,
  completedRaces: 2,
  upcomingRaces: 1,
  topCompetitors: fakeLeaderboardAll.slice(0, 5).map(e => ({
    id: e.ID,
    username: e.username,
    avatar: e.avatar,
    totalPoints: e["Category points"].reduce((a, b) => a + b, 0),
  })),
  recentActivity: [
    { type: "finish", competitor: "Lightning McQueen", race: "EkoRace", time: "5 minutes ago" },
    { type: "start", competitor: "Speed Racer", race: "MainRace", time: "12 minutes ago" },
    { type: "finish", competitor: "Turbo Thunder", race: "DragRace", time: "25 minutes ago" },
    { type: "registration", competitor: "Electric Eagle", time: "1 hour ago" },
    { type: "finish", competitor: "Volt Viper", race: "ShuttleRun", time: "2 hours ago" },
  ],
  raceStatus: [
    { name: "EkoRace", status: "In Progress", participants: 8, completed: 5 },
    { name: "MainRace", status: "In Progress", participants: 10, completed: 3 },
    { name: "DragRace", status: "Completed", participants: 12, completed: 12 },
    { name: "ShuttleRun", status: "In Progress", participants: 6, completed: 4 },
    { name: "SteeringTest", status: "Upcoming", participants: 0, completed: 0 },
    { name: "BrakingTest", status: "Upcoming", participants: 0, completed: 0 },
  ],
};
