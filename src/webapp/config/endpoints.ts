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
export const ENDPOINT_AUTH_REGISTER = `${BASE_URL}/api/register-account`;

// User endpoints
export const ENDPOINT_USERS = `${BASE_URL}/api/users`;
export const ENDPOINT_ACCOUNTS = `${BASE_URL}/api/accounts`;
export const ENDPOINT_ACCOUNT = `${BASE_URL}/api/account`;
export const ENDPOINT_UNVERIFIED_ACCOUNTS = `${BASE_URL}/api/unverified-accounts`;
export const ENDPOINT_ACCOUNT_APPLICATIONS = ENDPOINT_UNVERIFIED_ACCOUNTS;
export const ENDPOINT_ACCOUNT_VERIFICATION_INFO = `${BASE_URL}/api/account-verification-info`;
export const ENDPOINT_VERIFY_ACCOUNT = `${BASE_URL}/api/verify-account`;
export const ENDPOINT_VERIFY_ACCOUNT_APPLICATION = ENDPOINT_VERIFY_ACCOUNT;
export const ENDPOINT_ADMIN_ACCOUNTS = `${BASE_URL}/api/admin-accounts`;

// Competitor endpoints
export const ENDPOINT_COMPETITORS = `${BASE_URL}/api/cars`;
export const ENDPOINT_COMPETITORS_START_RACE = `${BASE_URL}/api/race/start`;
export const ENDPOINT_COMPETITORS_FINISH = `${BASE_URL}/api/car/finish`;

// Race endpoints
export const ENDPOINT_RACES = `${BASE_URL}/api/races`;

// Results endpoints
export const ENDPOINT_RESULTS = `${BASE_URL}/api/results`;
export const ENDPOINT_RACE_RESULTS_ALL = `${BASE_URL}/api/race-results/all`;

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
export const ENDPOINT_TEAM_APPLICATIONS = `${BASE_URL}/api/team-applications`;
export const ENDPOINT_TEAMS = ENDPOINT_TEAM_APPLICATIONS;
export const ENDPOINT_TEAM_APPLICATION = `${BASE_URL}/api/team-application`;
export const ENDPOINT_TEAM_APPLICATION_UPDATE = `${BASE_URL}/api/team`;
export const ENDPOINT_TEAM = `${BASE_URL}/api/team`;
export const ENDPOINT_APPLICATIONS = ENDPOINT_TEAMS;

// News endpoints (public website + admin CRUD)
export const ENDPOINT_NEWS = `${BASE_URL}/api/news`;

// Events endpoints (public website + admin CRUD)
export const ENDPOINT_EVENTS = `${BASE_URL}/api/events`;

// WebSocket endpoints
export const ENDPOINT_WS_LIVE = `${BASE_URL.replace(/^http/, "ws")}/ws`;

// MQTT endpoints
export const ENDPOINT_MQTT_LOGS = `${BASE_URL}/api/mqtt-logs`;
export const ENDPOINT_MQTT_MESSAGE = `${BASE_URL}/api/mqtt-message`;

// MapTiler API key and endpoint
export const MAPTILER_KEY = env.VITE_MAPTILER_KEY ?? "";
export const MAPTILER_TILE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/openstreetmap/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
  : "";
