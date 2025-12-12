// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const { signup, login, changePassword } = require("../controllers/authControllers");
const { authMiddleware } = require("../middleware/authMiddleware");

// Normal user signup
router.post("/signup", signup);

// Login for all roles
router.post("/login", login);

// Change password (must be logged in)
router.post("/change-password", authMiddleware, changePassword);

module.exports = router;
