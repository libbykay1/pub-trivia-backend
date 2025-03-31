const express = require("express");
const router = express.Router();
const { createGame, getGames, getGameById } = require("../controllers/gamesController");

router.post("/", createGame);
router.get("/", getGames);
router.put("/:id", updateGame);


module.exports = router;
