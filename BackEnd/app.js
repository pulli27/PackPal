//pass= H1234pul

const express = require("express");
const mongoose = require("mongoose");
const router = require("./Route/InventoryItemRoute");

const app = express();

//Middleware
app.use(express.json());  //postman eke insert karan data tika jason ekt responsive wen widiht hdn ek thm wenneh meke
app.use("/inventories",router);

//app.use("/",(req, res, next) => {
    //res.send("It is Working");


mongoose.connect("mongodb+srv://pulmivihansa27:H1234pul@cluster0.uowmnpn.mongodb.net/")
.then(()=> console.log("Connected to MongoDB"))
.then(()=> {
    app.listen(5000);
})
.catch((err)=> console.log((err)));