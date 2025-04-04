const { getDB } = require("../db");
const { ObjectId } = require("mongodb");

// Create a new team
async function createTeam(req, res) {
  try {
    const team = {
      ...req.body,
      createdAt: new Date(),
      ownerId: req.user?.uid || req.body.ownerId || null,
    };

    const result = await getDB().collection("teams").insertOne(team);
    const saved = await getDB().collection("teams").findOne({ _id: result.insertedId });
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Failed to create team:", err);
    res.status(500).json({ error: "Failed to create team", details: err.message });
  }
}

// Get all teams (optionally filter by ownerId)
async function getTeams(req, res) {
  try {
    const query = req.query.ownerId ? { ownerId: req.query.ownerId } : {};
    const teams = await getDB().collection("teams").find(query).toArray();
    res.json(teams);
  } catch (err) {
    console.error("❌ Failed to fetch teams:", err);
    res.status(500).json({ error: "Failed to fetch teams", details: err.message });
  }
}

// Get a specific team
async function getTeamById(req, res) {
  try {
    const team = await getDB().collection("teams").findOne({ _id: new ObjectId(req.params.id) });
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json(team);
  } catch (err) {
    console.error("❌ Failed to fetch team:", err);
    res.status(500).json({ error: "Failed to fetch team", details: err.message });
  }
}

// Update a team
async function updateTeam(req, res) {
  try {
    const { id } = req.params;
    const updatedTeam = req.body;
    delete updatedTeam._id;

    const teams = getDB().collection("teams");
    const objectId = new ObjectId(id);

    const updateResult = await teams.updateOne({ _id: objectId }, { $set: updatedTeam });
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: "Team not found" });
    }

    const updated = await teams.findOne({ _id: objectId });
    return res.status(200).json(updated);
  } catch (err) {
    console.error("❌ Failed to update team:", err);
    res.status(500).json({ error: "Failed to update team", details: err.message });
  }
}

// Delete a team
async function deleteTeam(req, res) {
  try {
    const result = await getDB().collection("teams").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Team not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to delete team:", err);
    res.status(500).json({ error: "Failed to delete team", details: err.message });
  }
}

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
};
