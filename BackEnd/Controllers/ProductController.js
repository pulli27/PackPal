const Product = require("../Model/ProductModel");

// Helper: sanitize/normalize incoming fields
function parseBody(body = {}) {
  const out = {};
  if (body.name != null) out.name = String(body.name).trim();
  if (body.category != null) out.category = String(body.category).trim();
  if (body.img != null) out.img = String(body.img).trim();

  if (body.price != null) out.price = Number(body.price);
  if (body.stock != null) out.stock = Number.parseInt(body.stock, 10);
  if (body.rating != null) out.rating = Number(body.rating);

  if (body.discountType != null) out.discountType = String(body.discountType);
  if (body.discountValue != null) out.discountValue = Number(body.discountValue);

  return out;
}

// GET /api/products
exports.list = async (_req, res) => {
  try {
    const docs = await Product.find({}).sort({ createdAt: -1 }).lean();
    res.status(200).json(docs);
  } catch (e) {
    console.error("products list error:", e);
    res.status(500).json({ message: "Error fetching products" });
  }
};

// GET /api/products/:id
exports.getOne = async (req, res) => {
  try {
    const doc = await Product.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Product not found" });
    res.json(doc);
  } catch (e) {
    console.error("products getOne error:", e);
    res.status(400).json({ message: "Invalid product id" });
  }
};

// POST /api/products
exports.create = async (req, res) => {
  try {
    const data = parseBody(req.body);

    if (!data.name || data.price == null || Number.isNaN(data.price))
      return res.status(400).json({ message: "name and price are required" });

    const created = await Product.create(data);
    res.status(201).json(created);
  } catch (e) {
    console.error("products create error:", e);
    res.status(500).json({ message: "Error creating product" });
  }
};

// PUT /api/products/:id
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const data = parseBody(req.body);

    const updated = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json(updated);
  } catch (e) {
    console.error("products update error:", e);
    // CastError -> invalid ObjectId
    if (e?.name === "CastError") {
      return res.status(400).json({ message: "Invalid product id" });
    }
    res.status(500).json({ message: "Error updating product" });
  }
};

// DELETE /api/products/:id
exports.remove = async (req, res) => {
  try {
    const del = await Product.findByIdAndDelete(req.params.id).lean();
    if (!del) return res.status(404).json({ message: "Product not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("products remove error:", e);
    if (e?.name === "CastError") {
      return res.status(400).json({ message: "Invalid product id" });
    }
    res.status(500).json({ message: "Error deleting product" });
  }
};
