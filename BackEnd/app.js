// BackEnd/app.js
const express = require("express");
const mongoose = require("mongoose");
const financeRoutes = require("./Routes/FinanceSalaryRoute"); // ensure file name & case

const app = express();

// ---------- Middlewares ----------
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Optional health check
app.get("/health", (req, res) => res.json({ ok: true }));

// ---------- Routes ----------
app.use("/finances", financeRoutes); // e.g., /finances, /finances/:id

// ---------- DB connect & start ----------
const PORT = process.env.PORT || 5001;
const DB_NAME = "PackPal";

// use the SRV you provided (ensure this is exactly as in Atlas)
const MONGO_URI =
  "mongodb+srv://pulmivihansa27:H1234pul@cluster0.tknbne0.mongodb.net/?retryWrites=true&w=majority";

(async () => {
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    console.log("Connected to MongoDB");
    console.log("DB Name:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);

    // List collections so you can confirm where data is going
    const cols = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", cols.map((c) => c.name));

    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
})();

// ---------- 404 + error handlers (optional) ----------
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error("[GLOBAL ERROR]", err);
  res.status(500).json({ message: "Unhandled server error" });
});
