// routes/ownerRoutes.js
const express = require("express");
const router = express.Router();

const {
  getMyStores,
  getStoreRatingsWithUsers,
} = require("../controllers/ownerControlller");

const {
  authMiddleware,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// all routes here require STORE_OWNER login
router.use(authMiddleware, authorizeRoles("STORE_OWNER"));

// list my stores with avg rating
router.get("/stores", getMyStores);

// see users + ratings for one of my stores
router.get("/stores/:storeId/ratings", getStoreRatingsWithUsers);

module.exports = router;
