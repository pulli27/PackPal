// BackEnd/Controllers/userController.js
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const User = require("../Model/userModel");

// GET /users
async function getAllUsers(_req, res) {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /users
async function addUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: errors.array() });
  }

  try {
    const { firstName, lastName, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hash,
      role: role || "customer",   // ← use the provided role
      status: "active",
    });

    return res.status(201).json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /users/:id
async function getById(req, res) {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Invalid ID" });
  }
}

// PUT /users/:id
async function updateUser(req, res) {
  try {
    const { firstName, lastName, email, role, status } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, role, status },
      { new: true, runValidators: true, select: "-password" }
    );

    if (!updated) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user: updated });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Update failed" });
  }
}

// DELETE /users/:id
async function deleteUser(req, res) {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id).select("-password");
    if (!deleted) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user: deleted });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Delete failed" });
  }
}

module.exports = {
  getAllUsers,
  addUser,
  getById,
  updateUser,
  deleteUser,
};
