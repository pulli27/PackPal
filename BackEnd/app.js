//pass= H1234pul

/*const express = require("express");
const mongoose = require("mongoose");
const router=require('./Routes/CartRoutes');

const app = express();



app.use("/users",router) ;
app.use(express.json());

//Middleware
/*app.use("/",(req, res, next) => {
    res.send("It is Working");
})*/

/*mongoose.connect("mongodb+srv://pulmivihansa27:H1234pul@cluster0.uowmnpn.mongodb.net/")
.then(()=> console.log("Connected to MongoDB"))
.then(()=> {
    app.listen(5000);
})
.catch((err)=> console.log((err)));*/

//pass= H1234pul

const express = require("express");
const mongoose = require("mongoose");
const router = require('./Routes/CartRoutes');

const app = express();

// ✅ Middleware to parse JSON MUST come first
app.use(express.json());  // <-- This parses req.body
app.use(express.urlencoded({ extended: true })); // optional for form data

// ✅ Your routes
app.use("/carts", router);
// Optional test route
app.get("/", (req, res) => {
    res.send("Server is working!");
});

// ✅ Connect to MongoDB
mongoose.connect("mongodb+srv://pulmivihansa27:H1234pul@cluster0.uowmnpn.mongodb.net/")
.then(() => console.log("Connected to MongoDB"))
.then(() => {
    app.listen(5000);/* () => console.log("Server running on port 5000"));*/
})
.catch((err) => console.log(err));
