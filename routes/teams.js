
const express = require("express");
const router = express.Router();
const {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addTeamGameHistoryEntry
} = require("../controllers/teamsController");

router.post("/", createTeam);
router.get("/", getTeams);
router.get("/:id", getTeamById);
router.put("/:id", updateTeam);
router.delete("/:id", deleteTeam);
router.post("/teams/:id/history", addTeamGameHistoryEntry);


module.exports = router;
