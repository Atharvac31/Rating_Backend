// controllers/ownerController.js
const { Store, Rating, User } = require("../models");

// Get all stores owned by logged-in store owner
const getMyStores = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const stores = await Store.findAll({
      where: { owner_id: ownerId },
      attributes: [
        "id",
        "name",
        "email",
        "address",
        "average_rating",
        "ratings_count",
      ],
    });

    return res.json({ stores });
  } catch (err) {
    console.error("Get my stores error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get users who rated a particular store (owned by this owner)
const getStoreRatingsWithUsers = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const storeId = parseInt(req.params.storeId);

    // verify this store belongs to this owner
    const store = await Store.findOne({
      where: { id: storeId, owner_id: ownerId },
      attributes: [
        "id",
        "name",
        "average_rating",
        "ratings_count",
        "address",
      ],
    });

    if (!store) {
      return res.status(404).json({
        message: "Store not found or you are not the owner",
      });
    }

    const ratings = await Rating.findAll({
      where: { store_id: storeId },
      attributes: ["id", "rating_value", "comment", "created_at"],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "address"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.json({
      store,
      ratings,
    });
  } catch (err) {
    console.error("Get store ratings (owner) error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getMyStores,
  getStoreRatingsWithUsers,
};
