// test.js
const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://elizabetheilbert:secret123@cluster0.1h9jiwg.mongodb.net/pub-trivia?retryWrites=true&w=majority";

const client = new MongoClient(uri); // no options

async function testConnection() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB!");
    const collections = await client.db("pub-trivia").listCollections().toArray();
    console.log("Collections:", collections);
  } catch (err) {
    console.error("❌ Connection error:", err);
  } finally {
    await client.close();
  }
}

testConnection();
