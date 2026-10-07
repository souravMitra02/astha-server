const express = require("express");

const {
  createReview,
  getRequestReview,
  getProviderReviews,
} = require("../controllers/reviewController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/:requestId",
  authMiddleware,
  createReview
);

router.get(
  "/request/:requestId",
  authMiddleware,
  getRequestReview
);

router.get(
  "/provider/:providerId",
  getProviderReviews
);

module.exports = router;