// BackEnd/app.js
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const inventoryRoutes   = require("./Route/InventoryRoute");
const purchaseRoutes    = require("./Route/PurchaseRoute");
const productRoutes     = require("./Route/ProductRoute");
const cartRoutes        = require("./Routes/CartRoutes");
const transactionRoutes = require("./Routes/TransactionsRoutes");

if (!process.env.MONGO_URI) {
  console.error("FATAL: MONGO_URI is missing in BackEnd/.env");
  process.exit(1);
}
const PORT = process.env.PORT || 5000;

const app = express();

// ---- CORS ----
const devLocalhost = new Set([
  "http://localhost:3000","http://127.0.0.1:3000",
  "http://localhost:3004","http://127.0.0.1:3004",
  "http://localhost:3005","http://127.0.0.1:3005",
  "http://localhost:5173","http://127.0.0.1:5173",
]);
app.use(
  cors({
    origin: (origin, cb) =>
      !origin || devLocalhost.has(origin) ? cb(null, true) : cb(null, false),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  })
);
app.options("*", cors());

// ---- BODY PARSERS (raise limits) ----
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// (Only if you have any raw endpoints like webhooks, otherwise remove)
// app.use("/webhook", express.raw({ type: "application/json", limit: "10mb" }));

// ---- ROUTES ----
app.use("/api/inventory",   inventoryRoutes);
app.use("/api/purchases",   purchaseRoutes);
app.use("/api/products",    productRoutes);
app.use("/carts",           cartRoutes);
app.use("/transactions",    transactionRoutes);

// ---- HEALTH ----
app.get("/health", (_req, res) => res.json({ ok: true }));

// ---- ERROR HANDLER ----
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// ---- START ----
(async () => {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server http://localhost:${PORT}`));
  } catch (e) {
    console.error("❌ Mongo connect error:", e);
    process.exit(1);
  }
})();
