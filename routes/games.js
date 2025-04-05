const express = require("express");
const router = express.Router();
const {
    createGame,
    getGames,
    getGameById,
    updateGame,
    deleteGame,
    getGameByCode,
    updateCurrentRound,
    addTeamToGame
} = require("../controllers/gamesController");

router.post("/", createGame);
router.get("/", getGames);
router.get("/:id", getGameById);
router.put("/:id", updateGame);
router.delete("/:id", deleteGame);
router.get("/code/:code", getGameByCode);
router.put("/:id/current-round", updateCurrentRound);
router.post("/code/:code/add-team", addTeamToGame);


module.exports = router;
