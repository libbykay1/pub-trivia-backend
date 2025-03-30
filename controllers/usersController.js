const { getDB } = require("../db");

async function saveUserProfile(req, res) {
  const uid = req.params.uid;
  const profile = req.body;

  try {
    await getDB().collection("users").updateOne(
      { uid },
      { $set: profile },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save profile", details: err });
  }
}

async function getUserProfile(req, res) {
  const uid = req.params.uid;

  try {
    const user = await getDB().collection("users").findOne({ uid });
    res.json(user || {});
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile", details: err });
  }
}

module.exports = { saveUserProfile, getUserProfile };
