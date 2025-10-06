// BackEnd/Controllers/userController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../Model/userModel");

// ----- helpers -----
const normalizeEmail = (s = "") => s.trim().toLowerCase();
const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role || "customer" },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: "7d" }
  );
const safeUser = (u) => ({
  _id: u._id,
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  role: u.role,
  status: u.status,
  createdAt: u.createdAt,
});

// ==================== AUTH ENDPOINTS ====================

// POST /api/auth/register  (public signup used by CreateAccount.jsx)
async function registerUser(req, res) {
  try {
    const { firstName, lastName, email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const emailNorm = normalizeEmail(email);

    const exists = await User.findOne({ email: emailNorm });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName,
      lastName,
      email: emailNorm,
      password: hash,
      role: "customer",
      status: "active",
    });

    const token = signToken(user);
    return res.status(201).json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    console.error("REGISTER_ERR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/auth/login  (used by Login.jsx)
async function loginUser(req, res) {
  try {
    const email = normalizeEmail(req.body?.email || "");
    const password = String(req.body?.password || "");

    if (!email || !password)
      return res.status(400).json({ message: "Invalid email or password." });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password." });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(401).json({ message: "Invalid email or password." });

    const token = signToken(user);
    return res.json({
      success: true,
      token,
      user: safeUser(user),
      route: "/maindashboard",
    });
  } catch (err) {
    console.error("LOGIN_ERR:", err);
    return res.status(500).json({ message: "Invalid email or password." });
  }
}

// ==================== EXISTING CRUD =====================

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

// POST /users  (admin-create user)
async function addUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: errors.array() });
  }

  try {
    const { firstName, lastName, email, password, role } = req.body;

    const emailNorm = normalizeEmail(email);
    const exists = await User.findOne({ email: emailNorm });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName,
      lastName,
      email: emailNorm,
      password: hash,
      role: role || "customer",
      status: "active",
    });

    return res.status(201).json({ user: safeUser(user) });
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

    const patch = { firstName, lastName, role, status };
    if (email) patch.email = normalizeEmail(email);

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      patch,
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
  // auth
  registerUser,
  loginUser,
  // crud
  getAllUsers,
  addUser,
  getById,
  updateUser,
  deleteUser,
};
