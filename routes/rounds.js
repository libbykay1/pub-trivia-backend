const express = require("express");
const router = express.Router();
const {
    saveRound,
    getRounds,
    deleteRound,
    getRoundById,
    updateRound
} = require("../controllers/roundsController");

router.post("/", saveRound);
router.get("/", getRounds);
router.delete("/:id", deleteRound);
router.get("/:id", getRoundById);
router.put("/:id", updateRound);

module.exports = router;
