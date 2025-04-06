const express = require("express");
const router = express.Router();
const {
    submitAnswers
} = require("../controllers/submissionsController");

router.post("/:code/:roundIndex", submitAnswers);


module.exports = router;
