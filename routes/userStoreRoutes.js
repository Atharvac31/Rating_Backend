// routes/userStoreRoutes.js
const express = require("express");
const router = express.Router();

const {
  listStoresForUser,
  createRating,
  updateRating,
  getMyRatingForStore,
  updateCurrentUser
} = require("../controllers/userStoreController");

const {
  authMiddleware,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// all these routes require login as NORMAL_USER
router.use(authMiddleware, authorizeRoles("NORMAL_USER"));

// list/search stores with overall rating + my rating
router.get("/stores", listStoresForUser);
router.put("/me", updateCurrentUser);
// create rating for a store
router.post("/stores/:storeId/rating", createRating);

// update existing rating
router.put("/stores/:storeId/rating", updateRating);

// view my rating for a store
router.get("/stores/:storeId/rating/me", getMyRatingForStore);

module.exports = router;
