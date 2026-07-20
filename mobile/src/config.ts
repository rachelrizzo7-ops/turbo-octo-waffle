// Set EXPO_PUBLIC_API_URL in mobile/.env to your backend's reachable address,
// e.g. http://192.168.1.42:4000 (your machine's LAN IP — NOT "localhost",
// since the Expo Go app runs on a separate physical/simulated device).
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";
