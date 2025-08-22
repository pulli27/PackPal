
const express=require("express");
const router =express.Router();

//Insert Models
const user=require("../Model/Cartmodel");

//Insert user controller
const Usercontrollers=require("../controllers/Cartcontrollers");
//Get all users
router.get("/",Usercontrollers.getAllCarts);
router.post("/",Usercontrollers.addCarts);
router.get("/:id",Usercontrollers.getById);
router.put("/:id",Usercontrollers.updateCart);
router.delete("/:id",Usercontrollers.deleteCart);


//Export 
module.exports=router;