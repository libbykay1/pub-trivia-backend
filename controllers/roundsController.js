const { getDB } = require("../db");
const { ObjectId } = require("mongodb");

function generateShuffledAnswers(round) {
  const pairs = round.questions?.filter(q => !q.isDecoy) || [];
  const decoys = round.questions?.filter(q => q.isDecoy) || [];
  const allAnswers = [...pairs, ...decoys].map(q => q.answer);
  return allAnswers.sort(() => Math.random() - 0.5);
}


async function saveRound(req, res) {
  try {
    const round = {
      ...req.body,
      createdAt: new Date(),
      published: false,
      createdBy: req.user?.uid || "anonymous", // if using auth
      isLocked: false,
    };
    if (typeof round._id === "string") {
      delete round._id;
    }

    if (round.type === "matching") {
      round.shuffledAnswers = generateShuffledAnswers(round);
    }

    if (round.type === "one-clue" && typeof round.visibleClues !== "number") {
      round.visibleClues = 1;
    }


    const result = await getDB().collection("rounds").insertOne(round);
    const savedRound = await getDB().collection("rounds").findOne({ _id: result.insertedId });

    res.json(savedRound);
  } catch (err) {
    console.error("❌ Failed to save round:", err);
    res.status(500).json({ error: "Failed to save round", details: err.message });
  }
}

async function getRounds(req, res) {
  try {
    const { hostId } = req.query;
    const query = hostId ? { hostId } : {};
    const rounds = await getDB().collection("rounds").find(query).toArray();
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
    const rounds = getDB().collection("rounds");
    const objectId = new ObjectId(id);

    if (updatedRound.type === "matching" && Array.isArray(updatedRound.questions)) {
      updatedRound.shuffledAnswers = generateShuffledAnswers(updatedRound);
    }


    const updateResult = await rounds.updateOne(
      { _id: objectId },
      { $set: updatedRound }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: "Round not found" });
    }

    const updated = await rounds.findOne({ _id: objectId });
    return res.status(200).json(updated);
  } catch (err) {
    console.error("❌ Failed to update round:", err);
    return res.status(500).json({ error: "Failed to update round", details: err.message });
  }
}



module.exports = {
  saveRound,
  getRounds,
  deleteRound,
  getRoundById,
  updateRound,
};
