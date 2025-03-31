const { getDB } = require("../db");
const { ObjectId, ReturnDocument } = require("mongodb");


async function createGame(req, res) {
  try {
    const game = {
      ...req.body,
      createdAt: new Date(),
      rounds: [],         // initialize empty rounds array
      status: "draft",    // optional status field
    };

    const result = await getDB().collection("games").insertOne(game);
    res.json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to create game", details: err });
  }
}

async function updateGame(req, res) {
    const { id } = req.params;
    const updatedGame = req.body;

    delete updatedGame._id;

    try {
        const _id = new ObjectId(id);
        console.log("🔍 Looking for _id:", _id);
        console.log("🧾 Updated data:", updatedGame);


      const result = await getDB()
        .collection("games")
        .findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: updatedGame },
          { returnDocument: ReturnDocument.AFTER }
        );

      if (!result.value) {
        return res.status(404).json({ error: "Game not found" });
      }

      return res.status(200).json(result.value);
    } catch (err) {
      console.error("❌ Update failed:", err);
      return res.status(500).json({ error: "Failed to update game", details: err.message });
    }
  }




async function getGames(req, res) {
  try {
    const { hostId } = req.query;
    const query = hostId ? { hostId } : {};
    const games = await getDB().collection("games").find(query).toArray();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch games", details: err });
  }
}

async function getGameById(req, res) {
    const { id } = req.params;
    try {
      const game = await getDB()
        .collection("games")
        .findOne({ _id: new ObjectId(id) }); // ✅ fixed here

      if (!game) return res.status(404).json({ error: "Game not found" });

      res.json(game);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch game", details: err.message });
    }
  }



module.exports = { createGame, getGames, getGameById, updateGame };
