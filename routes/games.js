const express = require("express");
const router = express.Router();
const { createGame, getGames, getGameById } = require("../controllers/gamesController");

router.post("/", createGame);
router.get("/", getGames);
router.get("/:id", getGameById);

module.exports = router;
