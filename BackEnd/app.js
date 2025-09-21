// BackEnd/app.js
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// ---- Modern routers (current) ----
const inventoryRoutes     = require("./Route/InventoryRoute");
const purchaseRoutes      = require("./Route/PurchaseRoute");
const productRoutes       = require("./Route/ProductRoute");
const cartRoutes          = require("./Routes/CartRoutes");
const transactionRoutes   = require("./Routes/TransactionsRoutes");
const userRouter          = require("./Routes/userRouter");

const financeRoutes       = require("./Route/FinanceSalaryRoute");
const attendanceRoutes    = require("./Route/AttendanceRoute");
const advanceRoutes       = require("./Route/AdvanceRoute");
const salaryRoutes        = require("./Route/SalaryRoute");
const transferRoutes      = require("./Route/TransferRoute");
const contributions       = require("./Route/contributions");

// ---- Legacy routers (kept, mounted under /legacy) ----
const inventoryRoutesLegacy    = require("./Routes/Inventory");
const transactionnRoutesLegacy = require("./Route/transactions");
const purchaseeRoutesLegacy    = require("./Routes/Purchases");

if (!process.env.MONGO_URI) {
  console.error("FATAL: MONGO_URI is missing in BackEnd/.env");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
const app = express();

// ---- CORS ----
const devLocalhost = new Set([
  "http://localhost:3000", "http://127.0.0.1:3000",
  "http://localhost:3004", "http://127.0.0.1:3004",
  "http://localhost:3005", "http://127.0.0.1:3005",
  "http://localhost:5173", "http://127.0.0.1:5173",
]);

app.use(
  cors({
    origin: (origin, cb) => (!origin || devLocalhost.has(origin)) ? cb(null, true) : cb(null, false),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  })
);
app.options("*", cors());

app.use(express.json());

// =========================
//       API  ( /api )
// =========================
app.use("/api/inventory",     inventoryRoutes);
app.use("/api/purchases",     purchaseRoutes);
app.use("/api/products",      productRoutes);
app.use("/api/transactions",  transactionRoutes);   // for /transactions/revenue
app.use("/api/salary",        salaryRoutes);        // for /salary/summary
app.use("/api/contributions", contributions);       // for /contributions/summary

// (Optional) expose others under /api too if you need them later:
app.use("/api/finances",      financeRoutes);
app.use("/api/attendance",    attendanceRoutes);
app.use("/api/advance",       advanceRoutes);
app.use("/api/transfers",     transferRoutes);

// =========================
//  Non-API (back-compat)
// =========================
app.use("/carts",             cartRoutes);
app.use("/transactions",      transactionRoutes);
app.use("/users",             userRouter);

app.use("/finances",          financeRoutes);
app.use("/attendance",        attendanceRoutes);
app.use("/advance",           advanceRoutes);
app.use("/salary",            salaryRoutes);
app.use("/transfers",         transferRoutes);
app.use("/contributions",     contributions);

// =========================
//       Legacy mounts
// =========================
app.use("/legacy/inventory",    inventoryRoutesLegacy);
app.use("/legacy/transactions", transactionnRoutesLegacy);
app.use("/legacy/purchases",    purchaseeRoutesLegacy);

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// Start
(async () => {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Helpful once while stabilizing models
    console.log("[models]", mongoose.modelNames());

    app.listen(PORT, () => console.log(`🚀 Server http://localhost:${PORT}`));
  } catch (e) {
    console.error("❌ Mongo connect error:", e);
    process.exit(1);
  }
})();
