const express = require("express");
const router = express.Router();
const { createGame, getGames } = require("../controllers/gamesController");

router.post("/", createGame);
router.get("/", getGames);

module.exports = router;
