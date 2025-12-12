// routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/adminController");

const {
  authMiddleware,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// all routes below require: logged in + SYSTEM_ADMIN
router.use(authMiddleware, authorizeRoles("SYSTEM_ADMIN"));

// Dashboard stats
router.get("/dashboard", getDashboardStats);

// Users
router.post("/users", createUser);      
router.get("/users", listUsers);        
router.get("/users/:id", getUserDetails);
router.put("/users/:id", updateUserByAdmin); 
router.delete("/users/:id", deleteUserByAdmin); 
// delete user by admin
// Stores
router.put("/stores/:id", updateStoreByAdmin); // update store by admin
router.delete("/stores/:id", deleteStoreByAdmin); // delete store by admin
router.post("/stores", createStore);    // add new store
router.get("/stores", listStores);      // list stores with filters
router.get("/stores/:id", getStoreById); // get store details by id
module.exports = router;
