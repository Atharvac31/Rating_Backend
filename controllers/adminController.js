// controllers/adminController.js
const bcrypt = require("bcrypt");
const { Op, fn, col } = require("sequelize");
const { User, Store, Rating, sequelize } = require("../models");

// ---------- DASHBOARD STATS ----------
const getDashboardStats = async (req, res) => {
  try {
    console.log("user", req.user);

    const [totalUsers, totalStores, totalRatings] = await Promise.all([
      User.count(),
      Store.count(),
      Rating.count(),
    ]);

    return res.json({
      totalUsers,
      totalStores,
      totalRatings,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------- CREATE USER (ADMIN-ONLY) ----------
const createUser = async (req, res) => {
  try {
    const { name, email, address, password, role } = req.body;

    if (!name || !email || !address || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const allowedRoles = ["SYSTEM_ADMIN", "NORMAL_USER", "STORE_OWNER"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,16}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be 8-16 chars, include at least one uppercase and one special character",
      });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      address,
      password_hash: hashed,
      role,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Create user error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------- LIST USERS WITH FILTERS + SORT ----------
const listUsers = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      role,
      sortBy = "name",
      sortOrder = "ASC",
      page = 1,
      limit = 10,
    } = req.query;

    const where = {};

    if (name) where.name = { [Op.iLike]: `%${name}%` };
    if (email) where.email = { [Op.iLike]: `%${email}%` };
    if (address) where.address = { [Op.iLike]: `%${address}%` };
    if (role) where.role = role;

    const validSortFields = ["name", "email", "address", "role", "created_at"];
    const orderField = validSortFields.includes(sortBy) ? sortBy : "name";
    const orderDirection = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const offset = (pageNum - 1) * pageSize;

    const { rows, count } = await User.findAndCountAll({
      where,
      order: [[orderField, orderDirection]],
      limit: pageSize,
      offset,
      attributes: ["id", "name", "email", "address", "role", "created_at"],
    });

    return res.json({
      data: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(count / pageSize),
      },
    });
  } catch (err) {
    console.error("List users error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------- USER DETAILS (INCL. STORE OWNER RATING) ----------
const getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "address", "role"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let storeOwnerRating = null;

    if (user.role === "STORE_OWNER") {
      const result = await Rating.findOne({
        attributes: [[fn("AVG", col("rating_value")), "average_rating"]],
        include: [
          {
            model: Store,
            as: "store",
            attributes: [],
            where: { owner_id: user.id }, // FIXED
          },
        ],
        raw: true,
      });

      storeOwnerRating =
        result && result.average_rating ? Number(result.average_rating) : 0;
    }

    return res.json({
      ...user.toJSON(),
      storeOwnerAverageRating: storeOwnerRating,
    });
  } catch (err) {
    console.error("Get user details error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const updateUserByAdmin = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const targetId = req.params.id;

    // basic checks
    if (!targetId) return res.status(400).json({ message: "User id required" });

    // fetch user
    const user = await User.findByPk(targetId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, address, role, password } = req.body;

    // If email is changing, ensure uniqueness
    if (email && email !== user.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) return res.status(409).json({ message: "Email already in use" });
    }

    // Validate role if provided (use same allowed roles as createUser)
    const allowedRoles = ["SYSTEM_ADMIN", "NORMAL_USER", "STORE_OWNER"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Update allowed fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (address !== undefined) user.address = address;
    if (role !== undefined) user.role = role;

    // If password provided — validate & hash
    if (password !== undefined && password !== "") {
      // (reuse same password policy as createUser if desired)
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const hashed = await bcrypt.hash(password, 10);
      // depending on your User model column name:
      if (user.password_hash !== undefined) {
        user.password_hash = hashed;
      } else {
        user.password = hashed;
      }
    }

    await user.save();

    const safeUser = user.toJSON();
    // remove sensitive fields
    delete safeUser.password;
    delete safeUser.password_hash;

    return res.json({ message: "User updated", user: safeUser });
  } catch (err) {
    console.error("updateUserByAdmin error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Admin: delete user by id
 * DELETE /admin/users/:id
 */
const deleteUserByAdmin = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const targetId = req.params.id;

    if (!targetId) return res.status(400).json({ message: "User id required" });

    // Prevent self-delete (optional safety)
    if (String(adminId) === String(targetId)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findByPk(targetId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Optional: prevent deleting the last SYSTEM_ADMIN — implement if needed

    await user.destroy();

    return res.json({ message: "User deleted" });
  } catch (err) {
    console.error("deleteUserByAdmin error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------- CREATE STORE (UPDATED WITH owner_id) ----------
const createStore = async (req, res) => {
  try {
    const { name, email, address, ownerId } = req.body;

    if (!name || !address || !ownerId) {
      return res
        .status(400)
        .json({ message: "Name, address and ownerId are required" });
    }

    const owner = await User.findByPk(ownerId);
    if (!owner) return res.status(404).json({ message: "Owner user not found" });

    if (owner.role !== "STORE_OWNER") {
      return res.status(400).json({ message: "Owner must have role STORE_OWNER" });
    }

    const store = await Store.create({
      name,
      email: email || null,
      address,
      owner_id: ownerId, // FIXED: map to DB column
    });

    return res.status(201).json({
      message: "Store created successfully",
      store,
    });
  } catch (err) {
    console.error("Create store error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------- LIST STORES ----------
const listStores = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      sortBy = "name",
      sortOrder = "ASC",
      page = 1,
      limit = 10,
    } = req.query;

    const where = {};
    if (name) where.name = { [Op.iLike]: `%${name}%` };
    if (email) where.email = { [Op.iLike]: `%${email}%` };
    if (address) where.address = { [Op.iLike]: `%${address}%` };

    const validSortFields = ["name", "email", "address", "average_rating"];
    const orderField = validSortFields.includes(sortBy) ? sortBy : "name";
    const orderDirection = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const offset = (pageNum - 1) * pageSize;

    const { rows, count } = await Store.findAndCountAll({
      where,
      order: [[orderField, orderDirection]],
      limit: pageSize,
      offset,
      attributes: [
        "id",
        "name",
        "email",
        "address",
        "average_rating",
        "ratings_count",
      ],
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    return res.json({
      data: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(count / pageSize),
      },
    });
  } catch (err) {
    console.error("List stores error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const updateStoreByAdmin = async (req, res) => {
  try {
    const storeId = req.params.id;
    if (!storeId) return res.status(400).json({ message: "Store id required" });

    // find store
    const store = await Store.findByPk(storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const { name, email, address, ownerId } = req.body;

    // If ownerId is provided, validate owner exists and has STORE_OWNER role
    if (ownerId !== undefined && ownerId !== null) {
      const owner = await User.findByPk(ownerId);
      if (!owner) return res.status(404).json({ message: "Owner user not found" });
      if (owner.role !== "STORE_OWNER") {
        return res.status(400).json({ message: "Owner must have role STORE_OWNER" });
      }
      store.owner_id = ownerId;
    }

    // Update allowed fields
    if (name !== undefined) store.name = name;
    if (email !== undefined) store.email = email;
    if (address !== undefined) store.address = address;

    await store.save();

    return res.json({
      message: "Store updated successfully",
      store,
    });
  } catch (err) {
    console.error("updateStoreByAdmin error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteStoreByAdmin = async (req, res) => {
  try {
    const storeId = req.params.id;
    if (!storeId) return res.status(400).json({ message: "Store id required" });

    const store = await Store.findByPk(storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    // Optional safety: prevent deletion if store has ratings
    const ratingCount = await Rating.count({ where: { store_id: storeId } });
    if (ratingCount > 0) {
      // If you prefer to allow delete, remove this block.
      return res.status(400).json({
        message: "Cannot delete store with existing ratings. Remove ratings first or use soft-delete.",
      });
    }

    await store.destroy();

    return res.json({ message: "Store deleted" });
  } catch (err) {
    console.error("deleteStoreByAdmin error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// ---------- GET STORE BY ID (ADMIN) ----------
const getStoreById = async (req, res) => {
  try {
    const storeId = req.params.id;

    const store = await Store.findByPk(storeId, {
      attributes: [
        "id",
        "name",
        "email",
        "address",
        "average_rating",
        "ratings_count",
        "owner_id",
      ],
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "email", "role"],
        },
      ],
    });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    return res.json({
      message: "Store fetched successfully",
      store,
    });

  } catch (err) {
    console.error("Get store by ID error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getDashboardStats,
  createUser,
  listUsers,
  getUserDetails,
  createStore,
  updateUserByAdmin,
  deleteUserByAdmin,
  updateStoreByAdmin,
  deleteStoreByAdmin,
  getStoreById,
  listStores,
};
