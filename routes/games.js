const express = require("express");
const router = express.Router();
const {
    createGame,
    getGames,
    getGameById,
    updateGame,
    deleteGame,
    getGameByCode,
    updateCurrentRound
} = require("../controllers/gamesController");

router.post("/", createGame);
router.get("/", getGames);
router.get("/:id", getGameById);
router.put("/:id", updateGame);
router.delete("/:id", deleteGame);
router.get("/code/:code", getGameByCode);
router.put("/:id/current-round", updateCurrentRound);



module.exports = router;
