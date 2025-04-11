const express = require("express");
const router = express.Router();
const {
    submitAnswers,
    updateSubmission
} = require("../controllers/submissionsController");

router.post("/:code/:roundIndex", submitAnswers);
router.put('/:code/rounds/:roundIndex/submissions/:teamId/update', updateSubmission);


module.exports = router;
