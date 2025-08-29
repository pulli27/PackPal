//pass= H1234pul

const express = require("express");
const mongoose = require("mongoose");
const router = require("./Routes/productRoutes");

const app = express();

//Middleware
app.use(express.json());  //postman eke insert karan data tika jason ekt responsive wen widiht hdn ek thm wenneh meke
app.use("/products",router);

//app.use("/",(req, res, next) => {
    //res.send("It is Working");


const MONGO_URI = "mongodb+srv://pulmivihansa27:H1234pul@cluster0.mz80y30.mongodb.net/PackPal?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)w
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(5000, () => console.log("Server running on http://localhost:5000"));
  })
  .catch((err) => console.error("Mongo connect error:", err));