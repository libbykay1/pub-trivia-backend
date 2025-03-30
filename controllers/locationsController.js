const { getDB } = require("../db");

async function getAllLocations(req, res) {
  try {
    const locations = await getDB().collection("locations").find().toArray();
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch locations", details: err });
  }
}

async function addLocation(req, res) {
  const { name, address } = req.body;
  if (!name) return res.status(400).json({ error: "Location name is required" });

  try {
    const result = await getDB().collection("locations").insertOne({ name, address });
    res.json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to add location", details: err });
  }
}

module.exports = { getAllLocations, addLocation };
