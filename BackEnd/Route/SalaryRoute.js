// Routes/SalaryRoute.js
const express = require("express");
const { calculateSalary, salarySummary } = require("../Controllers/SalaryController");

const router = express.Router();

// per-employee preview
router.get("/calc", calculateSalary);

// <-- NEW: total NET across all employees for a period
router.get("/summary", salarySummary);

module.exports = router;
