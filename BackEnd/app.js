const express = require("express");
const mongoose = require("mongoose");


const router = require("./Routes/FinanceSalaryRoute");

const app = express();
const cors = require("cors");

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/finances", router);

// ---- MongoDB connection (NOTE the DB name: PackPal) ----
const MONGO_URI = "mongodb+srv://pulmivihansa27:H1234pul@cluster0.tknbne0.mongodb.net/PackPal?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(5000, () => console.log("Server running on http://localhost:5000"));
  })
  .catch((err) => console.error("Mongo connect error:", err));