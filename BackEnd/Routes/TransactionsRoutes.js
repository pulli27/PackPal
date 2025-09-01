const express = require("express");
const router = express.Router();

// Import controller functions correctly
const {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction
} = require("../controllers/Transactioncontrollers");

// Routes
router.get("/", getTransactions);             // Get all transactions
router.post("/", addTransaction);            // Add transaction
router.put("/:id", updateTransaction);       // Update transaction
router.delete("/:id", deleteTransaction);    // Delete transaction

module.exports = router;
