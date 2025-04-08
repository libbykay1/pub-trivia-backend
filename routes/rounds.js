const express = require("express");
const router = express.Router();
const {
    saveRound,
    getRounds,
    deleteRound,
    getRoundById,
    updateRound,
    lockRound
} = require("../controllers/roundsController");

router.post("/", saveRound);
router.get("/", getRounds);
router.delete("/:id", deleteRound);
router.get("/:id", getRoundById);
router.put("/:id", updateRound);
router.patch("/rounds/:id/lock", lockRound);

module.exports = router;
