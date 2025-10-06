const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo connected"))
  .catch((e) => console.error(e));

app.use("/api/auth", require("./Routes/authRoutes"));

app.listen(5000, () => console.log("Server running on port 5000"));
