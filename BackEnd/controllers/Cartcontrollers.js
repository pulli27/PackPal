
const Product = require("../Model/CartModel");

// @desc    Get all products
// @route   GET /api/products
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch products", error: err.message });
    }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        res.status(200).json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch product", error: err.message });
    }
};

// @desc    Add new product
// @route   POST /api/products
exports.addProduct = async (req, res) => {
    try {
        const { name, category, img, price, stock, rating } = req.body;

        if (!name || !price) {
            return res.status(400).json({ success: false, message: "Name and price are required" });
        }

        const newProduct = await Product.create({
            name,
            category,
            img,
            price,
            stock,
            rating,
            discountType: "none",
            discountValue: 0
        });

        res.status(201).json({ success: true, message: "Product added successfully", data: newProduct });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to add product", error: err.message });
    }
};

// @desc    Update product details
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!updatedProduct) return res.status(404).json({ success: false, message: "Product not found" });

        res.status(200).json({ success: true, message: "Product updated successfully", data: updatedProduct });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to update product", error: err.message });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ success: false, message: "Product not found" });

        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to delete product", error: err.message });
    }
};

// @desc    Apply discount to a product
// @route   PUT /api/products/:id/discount
exports.applyDiscount = async (req, res) => {
    try {
        const { discountType, discountValue } = req.body;

        if (!["none", "percentage", "fixed"].includes(discountType)) {
            return res.status(400).json({ success: false, message: "Invalid discount type" });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { discountType, discountValue },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json({ success: true, message: "Discount applied successfully", data: updatedProduct });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to apply discount", error: err.message });
    }
};
