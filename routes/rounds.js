const express = require("express");
const router = express.Router();
const { saveRound, getRounds } = require("../controllers/roundsController");

router.post("/", saveRound);
router.get("/", getRounds);

module.exports = router;
