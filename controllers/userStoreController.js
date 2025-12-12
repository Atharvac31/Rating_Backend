// controllers/userStoreController.js
const { Op, fn, col } = require("sequelize");
const { Store, Rating, User } = require("../models");


const updateCurrentUser = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, email, address, password } = req.body;

    // minimal validation
    if (email && typeof email !== "string") {
      return res.status(400).json({ message: "Invalid email" });
    }

    // fetch user
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // update allowed fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (address !== undefined) user.address = address;

    // if password provided — hash it
    if (password !== undefined && password !== "") {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const saltRounds = 10;
      const hashed = await bcrypt.hash(password, saltRounds);
      user.password = hashed;
    }

    await user.save();

    // Remove sensitive fields before sending response
    const userSafe = user.toJSON();
    delete userSafe.password;

    return res.json({ message: "Profile updated", user: userSafe });
  } catch (err) {
    console.error("updateCurrentUser error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// helper: recalculate store average rating + count
const recalculateStoreRating = async (storeId) => {
  const stats = await Rating.findOne({
    where: { store_id: storeId },
    attributes: [
      [fn("AVG", col("rating_value")), "avg"],
      [fn("COUNT", col("id")), "count"],
    ],
    raw: true,
  });

  const avg = stats && stats.avg ? Number(stats.avg) : 0;
  const count = stats && stats.count ? Number(stats.count) : 0;

  await Store.update(
    {
      average_rating: avg,
      ratings_count: count,
    },
    { where: { id: storeId } }
  );
};

// ---------- LIST STORES FOR NORMAL USER ----------
const listStoresForUser = async (req, res) => {
  try {
    const userId = req.user.id; // from JWT

    const {
      name,
      address,
      sortBy = "name",
      sortOrder = "ASC",
      page = 1,
      limit = 10,
    } = req.query;

    const where = {};
    if (name) where.name = { [Op.iLike]: `%${name}%` };
    if (address) where.address = { [Op.iLike]: `%${address}%` };

    const validSortFields = ["name", "address", "average_rating", "ratings_count"];
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
        "address",
        "average_rating",
        "ratings_count",
      ],
      include: [
        {
          model: Rating,
          as: "ratings",
          where: { user_id: userId },
          required: false,
          attributes: ["id", "rating_value", "comment"],
        },
      ],
    });


    const data = rows.map((store) => {
      const plain = store.toJSON();
      const myRating = plain.ratings && plain.ratings[0] ? plain.ratings[0] : null;
      delete plain.ratings;

      return {
        ...plain,
        myRating, 
      };
    });

    return res.json({
      data,
      pagination: {
        total: count,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(count / pageSize),
      },
    });
  } catch (err) {
    console.error("List stores (user) error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const createRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const storeId = parseInt(req.params.storeId);
    const { rating_value, comment } = req.body;

    if (!rating_value) {
      return res.status(400).json({ message: "rating_value is required" });
    }

    if (rating_value < 1 || rating_value > 5) {
      return res
        .status(400)
        .json({ message: "rating_value must be between 1 and 5" });
    }


    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // check if rating already exists
    const existing = await Rating.findOne({
      where: { store_id: storeId, user_id: userId },
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Rating already exists. Use update instead." });
    }

    const rating = await Rating.create({
      store_id: storeId,
      user_id: userId,
      rating_value,
      comment: comment || null,
    });

    await recalculateStoreRating(storeId);

    return res.status(201).json({
      message: "Rating created successfully",
      rating,
    });
  } catch (err) {
    console.error("Create rating error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const updateRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const storeId = parseInt(req.params.storeId);
    const { rating_value, comment } = req.body;

    if (rating_value && (rating_value < 1 || rating_value > 5)) {
      return res
        .status(400)
        .json({ message: "rating_value must be between 1 and 5" });
    }

    const rating = await Rating.findOne({
      where: { store_id: storeId, user_id: userId },
    });

    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    if (rating_value !== undefined) {
      rating.rating_value = rating_value;
    }
    if (comment !== undefined) {
      rating.comment = comment;
    }

    await rating.save();
    await recalculateStoreRating(storeId);

    return res.json({
      message: "Rating updated successfully",
      rating,
    });
  } catch (err) {
    console.error("Update rating error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------- GET CURRENT USER'S RATING FOR A STORE ----------
const getMyRatingForStore = async (req, res) => {
  try {
    const userId = req.user.id;
    const storeId = parseInt(req.params.storeId);

    const rating = await Rating.findOne({
      where: { store_id: storeId, user_id: userId },
      attributes: ["id", "rating_value", "comment", "created_at", "updated_at"],
    });

    return res.json({ rating });
  } catch (err) {
    console.error("Get my rating error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  listStoresForUser,
  createRating,
  updateRating,
  getMyRatingForStore,
  updateCurrentUser,
};
