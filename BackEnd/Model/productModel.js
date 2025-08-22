const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
    ProductId:{
        type: Number,
        required:true,//validate
    },

    BagType:{
        type:String,
    },

    person:{
        type:String,
    },

    Deadline:{
        type:String,
    },

    Priority:{
        type:String,
    },
    QualityCheck:{
        type:Boolean,
    },
});

module.exports = mongoose.model(
    "productModel", //file name
    productSchema  //function schema

)