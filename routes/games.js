const express = require("express");
const router = express.Router();
const { createGame, getGames, getGameById, updateGame } = require("../controllers/gamesController");

router.post("/", createGame);
router.get("/", getGames);
router.get("/:id", getGameById);
router.put("/:id", updateGame);

module.exports = router;
