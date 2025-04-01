const { getDB } = require("../db");

async function saveRound(req, res) {
  try {
    const round = {
      ...req.body,
      createdAt: new Date(),
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

module.exports = { saveRound, getRounds };
