const express = require("express");
const cors = require("cors");
require("dotenv").config();

const gamesRoutes = require("./routes/games");
const usersRoutes = require("./routes/users");
const locationsRoutes = require("./routes/locations");
const roundsRoutes = require("./routes/rounds");
const teamsRoutes = require("./routes/teams");
const submissionsRoute = require("./routes/submissions");


const { connectDB } = require("./db");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://community-trivia.netlify.app" 
];



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
app.use("/rounds", roundsRoutes);
app.use("/teams", teamsRoutes);
app.use("/submissions", submissionsRoute);

connectDB().then(() => {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
