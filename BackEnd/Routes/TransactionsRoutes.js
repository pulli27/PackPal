const express = require("express");
const router = express.Router();

const {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
} = require("../controllers/Transactioncontrollers");

// Summary route
router.get("/summary", getSummary);

// CRUD routes
router.get("/", getTransactions);
router.post("/", addTransaction);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

module.exports = router;
