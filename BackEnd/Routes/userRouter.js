// BackEnd/Routes/userRouter.js
const express = require("express");
const { body } = require("express-validator");
const userController = require("../Controllers/userController");

const router = express.Router();

// quick sanity check (remove later)
if (process.env.NODE_ENV !== "production") {
  console.log("[userRouter] handlers:", {
    getAllUsers: typeof userController.getAllUsers,
    addUser: typeof userController.addUser,
    getById: typeof userController.getById,
    updateUser: typeof userController.updateUser,
    deleteUser: typeof userController.deleteUser,
  });
}

// Validation rules
const createRules = [
  body("firstName").trim().isLength({ min: 2 }).withMessage("First name required"),
  body("lastName").trim().isLength({ min: 2 }).withMessage("Last name required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  }).withMessage("Weak password"),
];

router.get("/", userController.getAllUsers);
router.post("/", ...createRules, userController.addUser);   // spread array -> individual fns
router.get("/:id", userController.getById);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
