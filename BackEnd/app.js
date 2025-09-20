// BackEnd/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const financeRoutes = require("./Routes/FinanceSalaryRoute");
const attendanceRoutes = require("./Routes/AttendanceRoute");
const advanceRoutes = require("./Routes/AdvanceRoute");
const salaryRoutes = require("./Routes/SalaryRoute");
const transferRoutes = require("./Routes/TransferRoute");
const contributions = require("./Routes/contributions");
const inventoryRoutes = require("./Routes/Inventory");
const transactionRoutes = require("./Routes/transactions");
const purchaseRoutes = require("./Routes/Purchases");

const app = express();

/* ---------- CORS ---------- */
const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ].filter(Boolean)
);
// BackEnd/app.js
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.has(origin)) return cb(null, true);
      return cb(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // <-- add PATCH
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());

/* ---------- Parsers & tiny logger ---------- */
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}  Origin: ${req.headers.origin || "n/a"}`);
  next();
});

/* ---------- Routes ---------- */
app.use("/finances", financeRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/advance", advanceRoutes);
app.use("/salary", salaryRoutes);
app.use("/transfers", transferRoutes);
app.use("/contributions", contributions);
app.use("/inventory", inventoryRoutes);
console.log("Mounted /inventory routes"); 
app.use("/transactions", transactionRoutes);
app.use("/purchases", purchaseRoutes);
/* ---------- Health/Debug ---------- */
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/__debug/db", async (_req, res) => {
  try {
    const conn = mongoose.connection;
    const collections = (await conn.db.listCollections().toArray()).map(c => c.name);
    res.json({ connected: conn.readyState === 1, dbName: conn.name, collections });
  } catch (e) {
    res.status(500).json({ connected: false, error: String(e?.message || e) });
  }
});

/* ---------- Global error handler ---------- */
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

/* ---------- DB connect + start ---------- */
const PORT = process.env.PORT || 5000;
(async () => {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Mongo connect error:", err);
    process.exit(1);
  }
})();
