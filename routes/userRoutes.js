const express = require("express");

const router = express.Router();

const {
  registerUser,
  loginUser,
  getProfile,
  getAllProviders,
   getSingleProvider,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/profile", authMiddleware, getProfile);

router.get("/providers", getAllProviders);
router.get("/providers/:id", getSingleProvider);

module.exports = router;

