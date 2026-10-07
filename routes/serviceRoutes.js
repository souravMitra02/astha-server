const express = require("express");

const {
  createService,
  getAllServices,
  getSingleService,
  findAvailableServices,
  getServicesByProvider,
  getMyServices,
  updateService,
  deleteService,
} = require("../controllers/serviceController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createService);

router.get("/", getAllServices);

router.get("/my", authMiddleware, getMyServices);

router.get("/provider/:providerId", getServicesByProvider);

router.get("/available", findAvailableServices);

router.patch("/:id", authMiddleware, updateService);

router.delete("/:id", authMiddleware, deleteService);

router.get("/:id", getSingleService);

module.exports = router;