const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const allowedOrigins = [
    "http://localhost:5173", // for dev
    "https://your-frontend.netlify.app", // for prod (replace with real URL)
  ];

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true, // Optional: if you want to support cookies later
    })
  );

app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);

async function start() {
  try {
    await client.connect();
    const db = client.db("pub_trivia");
    const gamesCollection = db.collection("games");

    // ✅ Routes defined after MongoDB is ready
    app.post("/games", async (req, res) => {
      const game = {
        ...req.body,
        createdAt: new Date(),
      };
      const result = await gamesCollection.insertOne(game);
      res.json({ success: true, id: result.insertedId });
    });

    app.get("/games", async (req, res) => {
      const { hostId } = req.query;
      const query = hostId ? { hostId } : {};
      const games = await gamesCollection.find(query).toArray();
      res.json(games);
    });

    app.listen(process.env.PORT || 4000, () => {
      console.log("🚀 Server running on port 4000");
    });

  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

start();
