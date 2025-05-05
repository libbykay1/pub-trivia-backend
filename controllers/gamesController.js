const { getDB } = require("../db");
const { ObjectId } = require("mongodb");

function generateShuffledAnswers(round) {
  const pairs = round.questions?.filter(q => !q.isDecoy) || [];
  const decoys = round.questions?.filter(q => q.isDecoy) || [];
  const allAnswers = [...pairs, ...decoys].map(q => q.answer);
  return allAnswers.sort(() => Math.random() - 0.5);
}

async function createGame(req, res) {
  try {
    const game = {
      ...req.body,
      createdAt: new Date(),
      rounds: [],         // initialize empty rounds array
      status: "draft",
      currentRound: null,
    };

    const result = await getDB().collection("games").insertOne(game);
    res.json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to create game", details: err });
  }
}

async function setVisibleClues(req, res) {
  const { gameId, roundIndex } = req.params;
  const { visibleClues } = req.body;

  if (typeof visibleClues !== "number") {
    return res.status(400).json({ error: "visibleClues must be a number" });
  }

  try {
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ error: "Game not found" });

    const round = game.rounds?.[roundIndex];
    if (!round) return res.status(404).json({ error: "Round not found" });

    round.visibleClues = visibleClues;

    await game.save();
    res.json({ message: "visibleClues updated", visibleClues });
  } catch (err) {
    console.error("Failed to update visibleClues:", err);
    res.status(500).json({ error: "Server error" });
  }
}


async function getGameByCode(req, res) {
  const { code } = req.params;
  const game = await getDB().collection("games").findOne({ code });
  if (!game) return res.status(404).json({ error: "Game not found" });
  res.json(game);
}

async function updateGame(req, res) {
    const { id } = req.params;
    const updatedGame = req.body;

    delete updatedGame._id;

    try {
      if (Array.isArray(updatedGame.rounds)) {
        updatedGame.rounds = updatedGame.rounds.map((r) => {
          if (r.type === "matching" && Array.isArray(r.questions)) {
            return { ...r, shuffledAnswers: generateShuffledAnswers(r) };
          }
          return r;
        });
      }
      const games = getDB().collection("games");
      const objectId = new ObjectId(id);

      const updateResult = await games.updateOne(
        { _id: objectId },
        { $set: updatedGame }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ error: "Game not found" });
      }

      const updated = await games.findOne({ _id: objectId });
      return res.status(200).json(updated);
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


async function deleteGame(req, res) {
    const { id } = req.params;

    try {
      const result = await getDB()
        .collection("games")
        .deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Game not found" });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("❌ Failed to delete game:", err);
      res.status(500).json({ error: "Delete failed", details: err.message });
    }
  }
  async function updateCurrentRound(req, res) {
    const { id } = req.params;
    const { currentRound } = req.body;

    try {
      const result = await getDB().collection("games").updateOne(
        { _id: new ObjectId(id) },
        { $set: { currentRound } }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "Game not found or no changes made" });
      }

      const updatedGame = await getDB().collection("games").findOne({ _id: new ObjectId(id) });
      res.json(updatedGame);
    } catch (err) {
      console.error("❌ Failed to update current round:", err);
      res.status(500).json({ error: "Failed to update current round", details: err.message });
    }
  }
  async function addTeamToGame(req, res) {
    const { code } = req.params;
    const teamData = req.body;

    try {
      const db = getDB();
      const games = db.collection("games");
      const teams = db.collection("teams");

      let teamToAdd;

      // If this is a saved team (has an _id), fetch it
      if (teamData._id) {
        const existing = await teams.findOne({ _id: new ObjectId(teamData._id) });
        if (!existing) {
          return res.status(404).json({ error: "Team not found" });
        }
        teamToAdd = existing;
      } else {
        // Otherwise, insert it as a new team
        const insertResult = await teams.insertOne({
          ...teamData,
          createdAt: new Date(),
          ownerId: teamData.ownerId || null,
        });
        teamToAdd = await teams.findOne({ _id: insertResult.insertedId });
      }

      // Add team to the game (without duplicating)
      const updateResult = await games.updateOne(
        { code },
        { $addToSet: { teams: teamToAdd } }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ error: "Game not found" });
      }

      res.json({ success: true, team: teamToAdd });
    } catch (err) {
      console.error("❌ Failed to add team to game:", err);
      res.status(500).json({ error: "Failed to add team to game", details: err.message });
    }
  }





module.exports = {
  createGame,
  getGames,
  getGameById,
  updateGame,
  deleteGame,
  getGameByCode,
  updateCurrentRound,
  addTeamToGame,
  setVisibleClues
};
