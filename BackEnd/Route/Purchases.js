// Routes/Purchases.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// flexible schema; uses the 'purchases' collection
const purchaseSchema = new mongoose.Schema({}, { strict: false });
const Purchase = mongoose.model("Purchase", purchaseSchema, "purchases");

const toNum = (v) => {
  const n = Number(String(v ?? 0).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/**
 * GET /purchases/summary?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Sums total purchase spend in the window.
 * Tries: total | amount | grandTotal OR items[].qty*items[].unitPrice fallback.
 */
router.get("/summary", async (req, res) => {
  try {
    const { start, end } = req.query;

    // try to filter by createdAt OR date, whichever your docs have
    const q = {};
    if (start || end) {
      const s = start ? new Date(start) : new Date("1970-01-01");
      const e = end ? new Date(end) : new Date();
      q.$or = [{ createdAt: { $gte: s, $lt: e } }, { date: { $gte: s, $lt: e } }];
    }

    const docs = await Purchase.find(q).lean().exec();

    let total = 0;
    let count = 0;

    for (const d of docs) {
      // direct total fields
      let t =
        toNum(d.total) ||
        toNum(d.amount) ||
        toNum(d.grandTotal);

      // fallback: items array
      if (!t && Array.isArray(d.items)) {
        let sub = 0;
        for (const it of d.items) {
          const q = toNum(it.qty ?? it.quantity ?? 1);
          const p = toNum(it.unitPrice ?? it.price ?? it.cost);
          sub += q * p;
        }
        if (sub) {
          total += sub;
          count += 1;
          continue;
        }
      }

      // fallback: single qty/price on doc
      if (!t) {
        const qn = toNum(d.qty ?? d.quantity);
        const pr = toNum(d.unitPrice ?? d.price ?? d.cost);
        if (qn && pr) t = qn * pr;
      }

      if (t) {
        total += t;
        count += 1;
      }
    }

    res.json({ total: Math.round(total), count });
  } catch (e) {
    console.error("[purchases:summary]", e);
    res.status(500).json({ message: "Failed to load purchases summary" });
  }
});

module.exports = router;
