const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    First_Name:{
        type: String,
     

    },
       Last_Name:{
        type: String,
        

    }, Gmail:{
        type: String,
        required:true,//validate

         }, Role:{
        type: String,
      
      

         }, Status:{
        type: String,
        required:true,//validate




}
});
module.exports=mongoose.model(
"userModel",//file name
 userSchema//function schema


)
