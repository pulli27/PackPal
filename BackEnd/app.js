// BackEnd/app.js

try {
  require("dotenv").config();
} catch {
  console.warn("[warn] dotenv not installed — skipping .env load");
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");


const sewingRouter  = require("./Routes/sewingInstructionRoutes"); // exact filename

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) =>
  res.status(200).json({ ok: true, service: "PackPal API", time: new Date().toISOString() })
);


app.use("/api/sewing-instructions", sewingRouter);

app.use((req, res) => res.status(404).json({ message: "Route not found", path: req.originalUrl }));

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://pulmivihansa27:H1234pul@cluster0.mz80y30.mongodb.net/PackPal?retryWrites=true&w=majority";

mongoose.set("strictQuery", true);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Mongo connect error:", err);
    process.exit(1);
  });
