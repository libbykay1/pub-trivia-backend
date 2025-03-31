const express = require("express");
const router = express.Router();
const { createGame, getGames, getGameById, updateGame, deleteGame } = require("../controllers/gamesController");

router.post("/", createGame);
router.get("/", getGames);
router.get("/:id", getGameById);
router.put("/:id", updateGame);
router.delete("/:id", deleteGame)

module.exports = router;
