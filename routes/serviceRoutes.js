const express = require("express");
const { createService, getAllServices,getSingleService } = require("../controllers/serviceController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


router.post("/", authMiddleware, createService);

router.get("/", getAllServices);

router.get("/:id", getSingleService);


console.log("createService:",createService);
module.exports = router;