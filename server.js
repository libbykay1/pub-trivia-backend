// server.js
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);
let gamesCollection;

async function start() {
  await client.connect();
  const db = client.db("pub_trivia");
  gamesCollection = db.collection("games");

  app.listen(process.env.PORT || 4000, () => {
    console.log("🚀 Server running on port 4000");
  });
}

start();

// Create game
app.post("/games", async (req, res) => {
  const game = {
    ...req.body,
    createdAt: new Date(),
  };
  const result = await gamesCollection.insertOne(game);
  res.json({ success: true, id: result.insertedId });
});

// Get all games (optionally by admin)
app.get("/games", async (req, res) => {
  const { hostId } = req.query;
  const query = hostId ? { hostId } : {};
  const games = await gamesCollection.find(query).toArray();
  res.json(games);
});
