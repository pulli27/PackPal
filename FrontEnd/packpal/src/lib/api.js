// src/lib/api.js
import axios from "axios";

// CRA uses REACT_APP_* env vars.
// Set REACT_APP_API_URL=http://localhost:5000 in a .env file (next step).
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});
