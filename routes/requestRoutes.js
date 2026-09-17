const express = require("express");
const router = express.Router();

const {
    createRequest,
    getMyRequests,
    getProviderRequests,
    updateRequestStatus,
     getSingleRequest,
} = require("../controllers/requestController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createRequest);
router.get("/my-requests", authMiddleware, getMyRequests);
router.get("/provider-requests", authMiddleware, getProviderRequests);
router.patch("/:id/status", authMiddleware, updateRequestStatus);
router.get("/:id", authMiddleware, getSingleRequest);


module.exports = router;