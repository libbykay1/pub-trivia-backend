const express = require("express");
const router = express.Router();
const { saveUserProfile, getUserProfile } = require("../controllers/usersController");

router.post("/:uid", saveUserProfile);
router.get("/:uid", getUserProfile);

module.exports = router;
