
const Cart = require("../Model/Cartmodel");

// GET /api/carts
const getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find().sort({ created_at: -1 });
    // Return 200 with possibly empty array (standard API behavior)
    return res.status(200).json({ success: true, carts });
  } catch (err) {
    console.error("Error fetching carts:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// POST /api/carts
const addCarts = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ success: false, message: "Request body is missing" });
    }

    const {
      ProductId, product_name, quantity, product_price,
      product_discounts, selected_variant, //created_at
    } = req.body;

    if (!ProductId || !product_name || !quantity || !product_price || !product_discounts) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: ProductId, product_name, quantity, product_price, product_discounts "
      });
    }

    const cart = new Cart({
      ProductId,
      product_name,
      quantity,//customer_id
      product_price,
      product_discounts,
      selected_variant,
      //created_at
    });

    await cart.save();

    return res.status(201).json({
      success: true,
      message: "Cart added successfully",
      cart
    });
  } catch (err) {
    console.error("Error adding cart:", err);
    return res.status(500).json({
      success: false,
      message: "Unable to add cart",
      error: err.message
    });
  }
};

// GET /api/carts/:id
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const cart = await Cart.findById(id);

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Error fetching cart by ID:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// PUT /api/carts/:id
const updateCart = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ success: false, message: "Request body is missing" });
    }

    const {
      ProductId, product_name, quantity, product_price,
      product_discounts, selected_variant,// created_at
    } = req.body;

    const updatedCart = await Cart.findByIdAndUpdate(
      id,
      { ProductId, product_name, quantity, product_price, product_discounts, selected_variant },
      { new: true, runValidators: true }
    );

    if (!updatedCart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      updatedCart
    });
  } catch (err) {
    console.error("Error updating cart:", err);
    return res.status(500).json({ success: false, message: "Unable to update cart", error: err.message });
  }
};

// DELETE /api/carts/:id
const deleteCart = async (req, res) => {
  try {
    const { id } = req.params;

    const cart = await Cart.findByIdAndDelete(id);

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Cart deleted successfully",
      cart
    });
  } catch (err) {
    console.error("Error deleting cart:", err);
    return res.status(500).json({ success: false, message: "Unable to delete cart", error: err.message });
  }
};

module.exports = {
  getAllCarts,
  addCarts,
  getById,
  updateCart,
  deleteCart
};
