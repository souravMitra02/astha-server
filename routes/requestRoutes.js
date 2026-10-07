const express = require("express");

const {
  createRequest,
  getMyRequests,
  getProviderRequests,
  getProviderStats,
  updateRequestStatus,
  getSingleRequest,
  cancelRequest,
} = require("../controllers/requestController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  createRequest
);

router.get(
  "/my",
  authMiddleware,
  getMyRequests
);

router.get(
  "/provider",
  authMiddleware,
  getProviderRequests
);

router.get(
  "/provider/stats",
  authMiddleware,
  getProviderStats
);

router.patch(
  "/:id/status",
  authMiddleware,
  updateRequestStatus
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  cancelRequest
);

router.get(
  "/:id",
  authMiddleware,
  getSingleRequest
);

module.exports = router;