const { getDB } = require("../db");
const { ObjectId } = require("mongodb");
const { computeRoundHash } = require("../utils/roundHash");

function generateShuffledAnswers(round) {
  const pairs = round.questions?.filter(q => !q.isDecoy) || [];
  const decoys = round.questions?.filter(q => q.isDecoy) || [];
  const allAnswers = [...pairs, ...decoys].map(q => q.answer);
  return allAnswers.sort(() => Math.random() - 0.5);
}

async function publishGameRoundToLibrary(req, res) {
  const { gameId, roundIndex } = req.params;

  try {
    const db = getDB();
    const gamesCol = db.collection("games");
    const roundsCol = db.collection("rounds");

    const game = await gamesCol.findOne({ _id: new ObjectId(gameId) });
    if (!game) return res.status(404).json({ error: "Game not found" });

    const idx = Number(roundIndex);
    if (!Number.isInteger(idx) || !game.rounds || !game.rounds[idx]) {
      return res.status(400).json({ error: "Invalid round index" });
    }

    const round = game.rounds[idx];
    const contentHash = computeRoundHash(round);

    const usageEntry = {
      key: `${game._id}:${idx}:${game.date || ""}`,
      gameId: game._id,
      gameName: game.name || "",
      date: game.date || null,
      location: game.location || "",
      roundIndex: idx,
      usedAt: new Date(),
    };

    let lib = await roundsCol.findOne({ contentHash });

    if (!lib) {
      const insertDoc = {
        number: round.number || idx + 1,
        hostId: game.hostId || round.hostId || null,
        theme: round.theme || "",
        description: round.description || "",
        type: round.type || "",
        doubleOrNothing: !!round.doubleOrNothing,
        betting: !!round.betting,
        questions: round.questions || [],
        isLocked: !!round.isLocked,
        createdAt: new Date(),
        createdBy: round.createdBy || "system",
        published: true,
        publishedAt: new Date(),
        submittedForPublishing: !!round.submittedForPublishing,
        contentHash,
        usages: [usageEntry],
      };
      const result = await roundsCol.insertOne(insertDoc);
      lib = { _id: result.insertedId, ...insertDoc };
    } else {
      await roundsCol.updateOne(
        { _id: lib._id },
        {
          $set: {
            published: true,
            publishedAt: lib.published ? lib.publishedAt : new Date(),
          },
          $addToSet: { usages: usageEntry },
        }
      );
      lib = await roundsCol.findOne({ _id: lib._id });
    }

    // mark the embedded game round as published (and clear submission flag)
    await gamesCol.updateOne(
      { _id: game._id },
      {
        $set: {
          [`rounds.${idx}.submittedForPublishing`]: false,
          [`rounds.${idx}.publishingStatus`]: "published",
          [`rounds.${idx}.publishedAt`]: new Date(),
          [`rounds.${idx}.publishedRoundId`]: lib._id,
        },
      }
    );

    return res.json({ success: true, roundId: lib._id, round: lib });
  } catch (err) {
    console.error("❌ publishGameRoundToLibrary failed:", err);
    return res.status(500).json({ error: "Failed to publish round", details: err.message });
  }
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

async function submitRoundForPublishing(req, res) {
  const { gameId, roundIndex } = req.params;

  try {
    const games = getDB().collection("games");
    const game = await games.findOne({ _id: new ObjectId(gameId) });

    if (!game) return res.status(404).json({ error: "Game not found" });

    const index = parseInt(roundIndex);
    if (!game.rounds || !game.rounds[index]) {
      return res.status(400).json({ error: "Round not found at that index" });
    }

    game.rounds[index].submittedForPublishing = true;

    const updateResult = await games.updateOne(
      { _id: new ObjectId(gameId) },
      { $set: { rounds: game.rounds } }
    );

    if (updateResult.modifiedCount === 0)
      return res.status(500).json({ error: "Failed to update round" });

    res.status(200).json({ success: true, round: game.rounds[index] });
  } catch (err) {
    console.error("❌ Failed to submit round:", err);
    res.status(500).json({ error: "Failed to submit round", details: err.message });
  }
}

async function setVisibleClues(req, res) {
  const { gameId, roundIndex } = req.params;
  const { visibleClues } = req.body;

  if (typeof visibleClues !== "number") {
    return res.status(400).json({ error: "visibleClues must be a number" });
  }

  try {
    const db = getDB();
    const games = db.collection("games");
    const objectId = new ObjectId(gameId);

    const game = await games.findOne({ _id: objectId });
    if (!game) return res.status(404).json({ error: "Game not found" });

    const round = game.rounds?.[roundIndex];
    if (!round) return res.status(404).json({ error: "Round not found" });

    // Update the in-memory round value
    round.visibleClues = visibleClues;

    // Save the whole updated rounds array
    const result = await games.updateOne(
      { _id: objectId },
      { $set: { rounds: game.rounds } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: "Failed to update round" });
    }

    res.json({ message: "visibleClues updated", visibleClues });
  } catch (err) {
    console.error("Failed to update visibleClues:", err);
    res.status(500).json({ error: "Server error", details: err.message });
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
async function getSubmittedRoundsAdmin(req, res) {
  try {
    const db = getDB();

    // Aggregation: find games with submitted rounds, unwind, filter, shape
    const cursor = db.collection("games").aggregate([
      {
        $match: {
          $or: [
            { "rounds.submittedForPublishing": true },
            { "rounds.publishingStatus": "submitted" },
          ],
        },
      },
      { $unwind: { path: "$rounds", includeArrayIndex: "roundIndex" } },
      {
        $match: {
          $or: [
            { "rounds.submittedForPublishing": true },
            { "rounds.publishingStatus": "submitted" },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          _gameId: "$_id",
          _gameName: "$name",
          _gameDate: "$date",
          _gameLocation: "$location",
          _roundIndex: "$roundIndex",

          // round fields
          round: {
            _id: "$rounds._id",
            theme: "$rounds.theme",
            description: "$rounds.description",
            type: "$rounds.type",
            questions: "$rounds.questions",
            submittedForPublishing: "$rounds.submittedForPublishing",
            publishingStatus: "$rounds.publishingStatus",
            updatedAt: "$rounds.updatedAt",
          },
        },
      },
      // Optional: newest first by game date if present
      { $sort: { _gameDate: -1, "_roundIndex": 1 } },
    ]);

    const items = await cursor.toArray();
    res.json({
      rounds: items.map((doc) => ({
        ...doc.round,
        _gameId: doc._gameId,
        _gameName: doc._gameName,
        _gameDate: doc._gameDate,
        _gameLocation: doc._gameLocation,
        _roundIndex: doc._roundIndex,
      })),
    });
  } catch (err) {
    console.error("[getSubmittedRoundsAdmin] error:", err);
    res.status(500).json({ error: "Failed to load submitted rounds", details: err.message });
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
  setVisibleClues,
  submitRoundForPublishing,
  getSubmittedRoundsAdmin,
  publishGameRoundToLibrary,
};
