// BackEnd/Route/InventoryRoute.js
const express = require("express");
const Inventory = require("../Model/InventoryItem");
const Product = require("../Model/Product");
const router = express.Router();

/** Effective unit price (supports unitPrice OR price, with discounts) */
function effectivePrice(p) {
  const base = Number(p?.unitPrice ?? p?.price ?? 0);
  const type = String(p?.discountType || "none").toLowerCase();
  const val = Number(p?.discountValue ?? 0);
  if (type === "percentage") return Math.max(0, base * (1 - val / 100));
  if (type === "flat") return Math.max(0, base - val);
  return Math.max(0, base);
}

/** Optional: quick sanity check for counts/fields */
router.get("/debug", async (_req, res) => {
  try {
    const invCount = await Inventory.countDocuments();
    const prodCount = await Product.countDocuments();
    const sampleInv = await Inventory.findOne({}, { quantity: 1, unitPrice: 1, name: 1 }).lean();
    const sampleProd = await Product.findOne(
      { },
      { unitPrice: 1, price: 1, stock: 1, discountType: 1, discountValue: 1, name: 1 }
    ).lean();
    res.json({ invCount, prodCount, sampleInv, sampleProd });
  } catch (e) {
    res.status(500).json({ message: "debug failed", error: String(e) });
  }
});

/**
 * GET /inventory/summary
 * Returns combined totals for inventory items and products.
 */
router.get("/summary", async (_req, res) => {
  try {
    const [invDocs, prodDocs] = await Promise.all([
      // inventory: quantity + unitPrice (tolerate qty|quantity, unitPrice|price)
      Inventory.find({}, { quantity: 1, qty: 1, unitPrice: 1, price: 1 }).lean(),
      // products: read BOTH unitPrice and price
      Product.find({}, { unitPrice: 1, price: 1, stock: 1, discountType: 1, discountValue: 1 }).lean(),
    ]);

    // ---- Inventory totals ----
    let invItemCount = 0, invQty = 0, invValue = 0, invUnitSum = 0;
    for (const d of invDocs) {
      const q = Number(d?.quantity ?? d?.qty ?? 0);
      const u = Number(d?.unitPrice ?? d?.price ?? 0);
      if (!Number.isFinite(q) || !Number.isFinite(u)) continue;
      invItemCount += 1;
      invQty += q;
      invValue += q * u;
      invUnitSum += u;
    }
    const invAvgUnit = invItemCount ? invUnitSum / invItemCount : 0;

    // ---- Product totals ----
    let prodItemCount = 0, prodQty = 0, prodValue = 0, prodUnitSum = 0;
    for (const p of prodDocs) {
      const q = Number(p?.stock ?? 0);
      const u = effectivePrice(p);
      if (!Number.isFinite(q) || !Number.isFinite(u)) continue;
      prodItemCount += 1;
      prodQty += q;
      prodValue += q * u;
      prodUnitSum += u;
    }
    const prodAvgUnit = prodItemCount ? prodUnitSum / prodItemCount : 0;

    const round = (n) => Math.round(Number(n || 0));
    res.json({
      // Combined
      totalValue: round(invValue + prodValue),
      totalQty: round(invQty + prodQty),
      itemCount: invItemCount + prodItemCount,

      // Breakdown
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
