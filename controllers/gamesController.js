const { getDB } = require("../db");
const { ObjectId } = require("mongodb");


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
        .findOne({ _id: new ObjectId(id) });
      if (!game) return res.status(404).json({ error: "Game not found" });
      res.json(game);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch game", details: err });
    }
  }


module.exports = { createGame, getGames, getGameById };
