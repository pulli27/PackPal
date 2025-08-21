//pass= H1234pul

const express = require("express");
const mongoose = require("mongoose");

const app = express();

//Middleware
app.use("/",(req, res, next) => {
    res.send("It is Working");
})

mongoose.connect("mongodb+srv://pulmivihansa27:H1234pul@cluster0.uowmnpn.mongodb.net/")
.then(()=> console.log("Connected to MongoDB"))
.then(()=> {
    app.listen(5000);
})
.catch((err)=> console.log((err)));