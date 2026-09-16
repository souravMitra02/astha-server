const express = require("express");
const { createService, getAllServices,getSingleService } = require("../controllers/serviceController");

const router = express.Router();


router.post("/", createService);

router.get("/", getAllServices);

router.get("/:id", getSingleService);


console.log("createService:",createService);
module.exports = router;