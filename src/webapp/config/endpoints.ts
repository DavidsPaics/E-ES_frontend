// src/config/endpoints.ts
//
// Centralized configuration for API and WebSocket endpoints.
// Uses Vite env vars so we can point to dev/stage/prod without code changes.
// Create a .env file with:
//   VITE_API_BASE_URL=https://your-api.example.com
//   VITE_MAPTILER_KEY=your-key

const env = import.meta.env;
export const BASE_URL = env.VITE_API_BASE_URL ?? "https://e-es.lv";

// Auth endpoints
export const ENDPOINT_AUTH_LOGIN = `${BASE_URL}/api/login`;

// User endpoints
export const ENDPOINT_USERS = `${BASE_URL}/api/users`;

// Competitor endpoints
export const ENDPOINT_COMPETITORS = `${BASE_URL}/api/cars`;
export const ENDPOINT_COMPETITORS_START_RACE = `${BASE_URL}/api/race/start`;
export const ENDPOINT_COMPETITORS_FINISH = `${BASE_URL}/api/car/finish`;

// Race endpoints
export const ENDPOINT_RACES = `${BASE_URL}/api/races`;
export const ENDPOINT_RACE_CONFIG = `${BASE_URL}/api/race-config`;

// Results endpoints
export const ENDPOINT_RESULTS = `${BASE_URL}/api/results`;

// Points endpoints
export const ENDPOINT_POINTS = `${BASE_URL}/api/points`;

// Leaderboard endpoints
export const ENDPOINT_LEADERBOARD = `${BASE_URL}/api/leaderboard`;

// Category endpoints
export const ENDPOINT_CATEGORIES = `${BASE_URL}/api/categories`;

// Admin endpoints
export const ENDPOINT_ADMIN = `${BASE_URL}/api/admin`;
export const ENDPOINT_ADMIN_SETTINGS = `${BASE_URL}/api/settings`;
export const ENDPOINT_ADMIN_DELETE = `${BASE_URL}/api/delete`;

// Applications endpoint (public — used by website)
export const ENDPOINT_APPLICATIONS = `${BASE_URL}/api/applications`;

// News endpoints (public website + admin CRUD)
export const ENDPOINT_NEWS = `${BASE_URL}/api/news`;

// Events endpoints (public website + admin CRUD)
export const ENDPOINT_EVENTS = `${BASE_URL}/api/events`;

// WebSocket endpoints
export const ENDPOINT_WS_LIVE = `${BASE_URL.replace(/^http/, "ws")}/ws`;

// MapTiler API key and endpoint
export const MAPTILER_KEY = env.VITE_MAPTILER_KEY ?? "";
export const MAPTILER_TILE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
  : "";
