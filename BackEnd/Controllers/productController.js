const Product = require("../Model/productModel");

// Get all products
const getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find();

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    return res.status(200).json({ products });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error fetching products" });
  }
};

// Add a new product
const addProduct = async (req, res, next) => {
  const { ProductId, BagType, person, Deadline,Priority,QualityCheck } = req.body;

  try {
    const product = new Product({
      ProductId,
      BagType, 
      person, 
      Deadline,
      Priority,
      QualityCheck: QualityCheck === "YES" || QualityCheck === true,
    });

    await product.save();

    return res.status(201).json({ product });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error adding product" });
  }
};

// Get product by ID
const getById = async (req, res, next) => {
  const id = req.params.id;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ product });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update product details
const updateProduct = async (req, res, next) => {
  const id = req.params.id;
  const { ProductId, BagType, person, Deadline,Priority,QualityCheck } = req.body;

  try {
    const oldProduct = await Product.findById(id);
    if (!oldProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        ProductId,
        BagType, 
        person, 
        Deadline,
        Priority,
        QualityCheck: QualityCheck === "YES" || QualityCheck === true,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Product updated successfully",
      beforeUpdate: oldProduct,
      afterUpdate: updatedProduct,
    });
  } catch (err) {
    console.error("Error updating product:", err);
    return res.status(500).json({ message: "Server error while updating product" });
  }
};

// Delete product
const deleteProduct = async (req, res, next) => {
  const id = req.params.id;

  try {
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product deleted successfully",
      deletedProduct: product,
    });
  } catch (err) {
    console.error("Error deleting product:", err);
    return res.status(500).json({ message: "Unable to delete product" });
  }
};

// Exports
exports.getAllProducts = getAllProducts;
exports.addProduct = addProduct;
exports.getById = getById;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
