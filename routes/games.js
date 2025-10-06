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
    addTeamToGame,
    setVisibleClues,
    submitRoundForPublishing,
    getSubmittedRoundsAdmin
} = require("../controllers/gamesController");

const { requireSingleAdmin } = require("../middleware/requireSingleAdmin.js");

router.post("/", createGame);
router.get("/", getGames);
router.get("/:id", getGameById);
router.put("/:id", updateGame);
router.delete("/:id", deleteGame);
router.get("/code/:code", getGameByCode);
router.put("/:id/current-round", updateCurrentRound);
router.post("/code/:code/add-team", addTeamToGame);
router.put("/:gameId/rounds/:roundIndex/visibleClues", setVisibleClues);
router.put("/:gameId/rounds/:roundIndex/publish", submitRoundForPublishing);
router.get("/admin/submitted-rounds", requireSingleAdmin, getSubmittedRoundsAdmin);

module.exports = router;
