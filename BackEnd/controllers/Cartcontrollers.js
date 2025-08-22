
/*
const User = require("../Model/Cartmodel");

//  Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();

        if (!users || users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }

        return res.status(200).json({ users });
    } catch (err) {
        console.error("Error fetching users:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

//  Add new user
const addUsers = async (req, res) => {
    const { ProductId, product_name, quantity, price_per_unit, customer_id, selected_variant, created_at } = req.body;

    try {
        const user = new User({
            ProductId,
            product_name,
            quantity,
            price_per_unit,
            customer_id,
            selected_variant,
            created_at
        });

        await user.save();
        return res.status(201).json({ message: "User added successfully", user });

    } catch (err) {
        console.error("Error adding user:", err);
        return res.status(500).json({ message: "Unable to add user", error: err.message });
    }
};

//  Get user by ID
const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

//  Update user details
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { ProductId, product_name, quantity, price_per_unit, customer_id, selected_variant, created_at } = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { ProductId, product_name, quantity, price_per_unit, customer_id, selected_variant, created_at },
            { new: true, runValidators: true } // ✅ Return updated user + validate data
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User updated successfully", updatedUser });
    } catch (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({ message: "Unable to update user", error: err.message });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User deleted successfully", user });
    } catch (err) {
        console.error("Error deleting user:", err);
        return res.status(500).json({ message: "Unable to delete user", error: err.message });
    }
};

module.exports = {
    getAllUsers,
    addUsers,
    getById,
    updateUser,
    deleteUser
};

*/
/*const Cart = require("../Model/Cartmodel");

// ✅ Get all users / cart items
const getAllCarts= async (req, res) => {
    try {
        const carts = await Cart.find();

        if (!carts || carts.length === 0) {
            return res.status(404).json({ success: false, message: "No carts found" });
        }

        return res.status(200).json({ success: true, carts });
    } catch (err) {
        console.error("Error fetching carts:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// ✅ Add new user / cart item
const  addCarts= async (req, res) => {
    try {
        // ✅ Check if req.body exists
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ success: false, message: "Request body is missing" });
        }

        const { ProductId, product_name, quantity, price_per_unit, customer_id, selected_variant, created_at } = req.body;

        // ✅ Validate required fields
        if (!ProductId || !product_name || !quantity || !price_per_unit || !customer_id) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: ProductId, product_name, quantity, price_per_unit, customer_id"
            });
        }

        const cart = new Cart({
            ProductId,
            product_name,
            quantity,
            price_per_unit,
            customer_id,
            selected_variant,
            created_at
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

// ✅ Get user / cart item by ID
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

// ✅ Update user / cart item
const updateCart = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ success: false, message: "Request body is missing" });
        }

        const { ProductId, product_name, quantity, price_per_unit, customer_id, selected_variant, created_at } = req.body;

        const updatedCart = await Cart.findByIdAndUpdate(
            id,
            { ProductId, product_name, quantity, price_per_unit, customer_id, selected_variant, created_at },
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

// ✅ Delete user / cart item
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
}; */
const User = require("../Model/Cartmodel");

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
      ProductId, product_name, quantity, price_per_unit,
      customer_id, selected_variant, created_at
    } = req.body;

    if (!ProductId || !product_name || !quantity || !price_per_unit || !customer_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: ProductId, product_name, quantity, price_per_unit, customer_id"
      });
    }

    const cart = new Cart({
      ProductId,
      product_name,
      quantity,
      price_per_unit,
      customer_id,
      selected_variant,
      created_at
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
      ProductId, product_name, quantity, price_per_unit,
      customer_id, selected_variant, created_at
    } = req.body;

    const updatedCart = await Cart.findByIdAndUpdate(
      id,
      { ProductId, product_name, quantity, price_per_unit, customer_id, selected_variant, created_at },
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
