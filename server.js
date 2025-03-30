const express = require("express");
const cors = require("cors");
require("dotenv").config();

const gamesRoutes = require("./routes/games");
const usersRoutes = require("./routes/users");
const locationsRoutes = require("./routes/locations");
const { connectDB } = require("./db");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://your-frontend.netlify.app" // replace this later with your real Netlify URL
];

app.use((req, res, next) => {
  console.log("🌐 Incoming origin:", req.headers.origin);
  next();
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/locations", locationsRoutes);
app.use("/games", gamesRoutes);
app.use("/users", usersRoutes);

// Start server after DB is connected
connectDB().then(() => {
  app.listen(process.env.PORT || 4000, () => {
    console.log("🚀 Server running on port 4000");
  });
});
