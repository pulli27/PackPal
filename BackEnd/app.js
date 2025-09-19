//pass= H1234pul

const express = require("express");
const mongoose = require("mongoose");
const router = require("./Routes/userRouter");
const app = express();

//Middleware
//app.use("/",(req, res, next) => {     
   // res.send("It is Working");
   app.use(express.json());
app.use("/users", router);


const MONGO_URI = "mongodb+srv://pulmivihansa27:H1234pul@cluster0.2pgj0bt.mongodb.net/PackPal?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(5000, () => console.log("Server running on http://localhost:5000"));
  })
  .catch((err) => console.error("Mongo connect error:", err)); 