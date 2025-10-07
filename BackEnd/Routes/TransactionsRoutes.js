// BackEnd/Routes/TransactionsRoutes.js
const express = require("express");
const router = express.Router();
const tx = require("../Controllers/Transactioncontrollers");

// v1 (kept) — supports ?start&end
router.get("/summary-v1", tx.getSummary);

// v2 month-aware (createdAt buckets)
router.get("/summary", tx.getSummaryV2);

// NEW: monthly revenue buckets (supports ?start&end, else last N months)
router.get("/revenue/monthly", tx.getRevenueMonthly);

// CRUD (put static routes before dynamic)
router.get("/", tx.getTransactions);
router.post("/", tx.addTransaction);
router.put("/:id", tx.updateTransaction);
router.delete("/:id", tx.deleteTransaction);

module.exports = router;
