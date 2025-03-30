// routes/locations.js
const express = require("express");
const router = express.Router();
const { getAllLocations, addLocation } = require("../controllers/locationsController");

router.get("/", getAllLocations);         // GET /locations
router.post("/", addLocation);            // POST /locations

module.exports = router;
