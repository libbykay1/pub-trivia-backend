
const express = require("express");
const router = express.Router();
const {
  createTeam,
  getTeamsByUser,
  getTeamById,
  updateTeam,
  deleteTeam
} = require("../controllers/teamsController");

router.post("/", createTeam);
router.get("/user/:userId", getTeamsByUser);
router.get("/:id", getTeamById);
router.put("/:id", updateTeam);
router.delete("/:id", deleteTeam);

module.exports = router;
