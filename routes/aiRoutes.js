const express = require("express");
const { askAI } = require("../controllers/aiController");

const router = express.Router();

router.post("/", askAI);

module.exports = router;