const Product = require("../Model/ProductModel");

// GET /api/products
exports.list = async (req, res) => {
  try {
    const docs = await Product.find({}).sort({ createdAt: -1 }).lean();
    // Return raw docs; the front-end mapper handles names.
    res.status(200).json(docs);
  } catch (e) {
    console.error("products list error:", e);
    res.status(500).json({ message: "Error fetching products" });
  }
};
