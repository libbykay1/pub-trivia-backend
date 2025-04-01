const { getDB } = require("../db");
const { ObjectId } = require("mongodb");

async function saveRound(req, res) {
  try {
    const round = {
      ...req.body,
      createdAt: new Date(),
      published: false,
      createdBy: req.user?.uid || "anonymous", // if using auth
    };

    const result = await getDB().collection("rounds").insertOne(round);
    res.json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to save round", details: err.message });
  }
}

async function getRounds(req, res) {
  try {
    const rounds = await getDB().collection("rounds").find().toArray();
    res.json(rounds);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rounds" });
  }
}

async function deleteRound(req, res) {
    const { id } = req.params;
    try {
      const result = await getDB().collection("rounds").deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Round not found" });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("❌ Failed to delete round:", err);
      res.status(500).json({ error: "Delete failed", details: err.message });
    }
  }

  const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

async function getRoundById(req, res) {
  const { id } = req.params;

  try {
    const round = await getDB().collection("rounds").findOne({ _id: new ObjectId(id) });

    if (!round) {
      return res.status(404).json({ error: "Round not found" });
    }

    res.json(round);
  } catch (err) {
    console.error("❌ Failed to fetch round:", err);
    res.status(500).json({ error: "Failed to fetch round", details: err.message });
  }
}

async function updateRound(req, res) {
    const { id } = req.params;
    const updatedRound = req.body;

    delete updatedRound._id;

    try {
      const result = await getDB()
        .collection("rounds")
        .findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: updatedRound },
          { returnDocument: "after" } // or { returnOriginal: false } for older Mongo drivers
        );

      if (!result.value) {
        return res.status(404).json({ error: "Round not found" });
      }

      res.json(result.value);
    } catch (err) {
      console.error("❌ Failed to update round:", err);
      res.status(500).json({ error: "Failed to update round", details: err.message });
    }
  }
module.exports = { saveRound, getRounds, deleteRound, getRoundById, updateRound };
