const express = require("express");
const {
getAllProducts,
addProduct,
getById,
updateProduct,
deleteProduct,
} = require("../Controllers/productController");

const router = express.Router();

// GET all products
router.get("/", getAllProducts);

// POST a new product
router.post("/", addProduct);

// GET a single product by ID
router.get("/:id", getById);

// PUT (update) a product by ID
router.put("/:id", updateProduct);

// DELETE a product by ID
router.delete("/:id", deleteProduct);

module.exports = router;