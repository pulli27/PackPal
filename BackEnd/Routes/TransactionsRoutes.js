// BackEnd/Routes/TransactionsRoutes.js
const express = require("express");
const router = express.Router();
const tx = require("../Controllers/Transactioncontrollers");

// Guard: throw early if handlers are missing (helps catch typos/casing)
[
  "getTransactions",
  "addTransaction",
  "updateTransaction",
  "deleteTransaction",
  "getSummary",
  "getSummaryV2",
  "getRevenueMonthly",
].forEach((k) => {
  if (typeof tx[k] !== "function") {
    throw new Error(`[TransactionsRoutes] Missing controller function: ${k}`);
  }
});

// v1 — supports ?start&end
router.get("/summary-v1", tx.getSummary);

// v2 — richer summary (today/thisMonth/lastMonth + optional range)
router.get("/summary", tx.getSummaryV2);

// Monthly revenue buckets (?start&end or ?months=N)
router.get("/revenue/monthly", tx.getRevenueMonthly);

// CRUD
router.get("/", tx.getTransactions);
router.post("/", tx.addTransaction);
router.put("/:id", tx.updateTransaction);
router.delete("/:id", tx.deleteTransaction);

module.exports = router;
