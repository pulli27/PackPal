/*
const express = require("express");
const {
    getAllUsers,
    addUser,
    getUserById,
    updateUser,
    deleteUser
} = require("../controllers/productController");

const router = express.Router();

router.get("/", getAllUsers);
router.post("/", addUser);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;*/
const express = require("express");
const {
    getProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    applyDiscount
} = require("../controllers/Cartcontrollers");

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", addProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.put("/:id/discount", applyDiscount);

module.exports = router;
