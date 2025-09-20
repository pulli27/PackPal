const express = require("express");
const Inventory = require("../models/InventoryItem");
const Product = require("../models/Product"); // <-- add this
const router = express.Router();

/** Helper: effective unit price after discount */
function effectivePrice(p) {
  const price = Number(p?.price ?? 0);
  const type  = (p?.discountType || "none").toLowerCase();
  const val   = Number(p?.discountValue ?? 0);

  if (type === "percentage") return Math.max(0, price * (1 - val / 100));
  if (type === "flat")       return Math.max(0, price - val);
  return Math.max(0, price);
}

/** Still available for debugging */
router.get("/debug", async (_req, res) => {
  try {
    const invCount = await Inventory.countDocuments();
    const prodCount = await Product.countDocuments();
    res.json({ invCount, prodCount });
  } catch (e) {
    console.error("[inventory:debug]", e);
    res.status(500).json({ message: "debug failed" });
  }
});

/** GET /inventory/summary  (Inventory + Products) */
router.get("/summary", async (_req, res) => {
  try {
    // Load both in parallel
    const [invDocs, prodDocs] = await Promise.all([
      Inventory.find({}, { quantity: 1, unitPrice: 1 }).lean(),
      Product.find({}, { price: 1, stock: 1, discountType: 1, discountValue: 1 }).lean(),
    ]);

    // ---- Inventory totals ----
    let invItemCount = 0, invQty = 0, invValue = 0, invUnitSum = 0;
    for (const d of invDocs) {
      const q = Number(d?.quantity ?? 0);
      const p = Number(d?.unitPrice ?? 0);
      if (!Number.isFinite(q) || !Number.isFinite(p)) continue;
      invItemCount += 1;
      invQty += q;
      invValue += q * p;
      invUnitSum += p;
    }
    const invAvgUnit = invItemCount ? invUnitSum / invItemCount : 0;

    // ---- Product totals (use effective discounted price) ----
    let prodItemCount = 0, prodQty = 0, prodValue = 0, prodUnitSum = 0;
    for (const p of prodDocs) {
      const q = Number(p?.stock ?? 0);
      const eff = effectivePrice(p);
      if (!Number.isFinite(q) || !Number.isFinite(eff)) continue;
      prodItemCount += 1;
      prodQty += q;
      prodValue += q * eff;
      prodUnitSum += eff;
    }
    const prodAvgUnit = prodItemCount ? prodUnitSum / prodItemCount : 0;

    // ---- Combined ----
    const round = (n) => Math.round(Number(n || 0));
    const totalValue = invValue + prodValue;
    const totalQty   = invQty + prodQty;
    const itemCount  = invItemCount + prodItemCount;

    res.json({
      // What your KPI uses today:
      totalValue: round(totalValue),
      totalQty: round(totalQty),
      itemCount,

      // Bonus: detailed breakdown if you want to show later
      inventory: {
        itemCount: invItemCount,
        totalQty: round(invQty),
        totalValue: round(invValue),
        avgUnitPrice: Math.round((invAvgUnit + Number.EPSILON) * 100) / 100,
      },
      products: {
        itemCount: prodItemCount,
        totalQty: round(prodQty),
        totalValue: round(prodValue),
        avgUnitPrice: Math.round((prodAvgUnit + Number.EPSILON) * 100) / 100,
      },
    });
  } catch (e) {
    console.error("[inventory:summary]", e);
    res.status(500).json({ message: "Failed to load inventory summary" });
  }
});

module.exports = router;
