// BackEnd/app.js
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const inventoryRoutes = require("./Route/InventoryRoute");

// ---- sanity check for env ----
if (!process.env.MONGO_URI) {
  console.error("FATAL: MONGO_URI is missing in BackEnd/.env");
  process.exit(1);
}
const PORT = process.env.PORT || 5000;

// ---- express app ----
const app = express();

// allow your local FE origins (3000 = CRA, 5173 = Vite, etc.)
const devLocalhost = new Set([
  "http://localhost:3000","http://127.0.0.1:3000",
  "http://localhost:3004","http://127.0.0.1:3004",
  "http://localhost:3005","http://127.0.0.1:3005",
  "http://localhost:5173","http://127.0.0.1:5173",
]);
app.use(
  cors({
    origin: (origin, cb) => (!origin || devLocalhost.has(origin)) ? cb(null, true) : cb(null, false),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors());

app.use(express.json());

// routes
app.use("/api/inventory", inventoryRoutes);

// health
app.get("/health", (_req, res) => res.json({ ok: true }));

// error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// ---- start ----
(async () => {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(process.env.MONGO_URI); // ✅ correct var name
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server http://localhost:${PORT}`));
  } catch (e) {
    console.error("❌ Mongo connect error:", e);
    process.exit(1);
  }
})();
