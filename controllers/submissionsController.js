const { getDB } = require("../db");
const { ObjectId } = require("mongodb");
const fuzz = require("fuzzball"); // Make sure this is installed

function gradeSubmission(round, submission) {
  let totalPoints = 0;
  const gradedAnswers = [];

  round.questions.forEach((question, index) => {
    const playerAnswer = submission.answers?.[index];
    const correctAnswer = question.answer;
    const type = question.type || "standard";
    const pointValue = Number(question.points || 1);

    let pointsAwarded = 0;

    if (!playerAnswer) {
      gradedAnswers.push({ playerAnswer: "", correct: false, points: 0 });
      return;
    }

    if (type === "multi-answer") {
      const correctParts = correctAnswer.split(",").map((s) => s.trim().toLowerCase());
      const playerParts = playerAnswer.split(",").map((s) => s.trim().toLowerCase());
      const matched = new Set();

      playerParts.forEach((ans) => {
        const match = correctParts.find((correct) => fuzz.partial_ratio(ans, correct) > 85);
        if (match) matched.add(match);
      });

      const numCorrect = matched.size;
      const required = Number(question.requiredCount || correctParts.length);
      const awardable = Math.min(numCorrect, required);
      pointsAwarded = awardable * pointValue;
    } else {
      const matchScore = fuzz.partial_ratio(
        playerAnswer.trim().toLowerCase(),
        correctAnswer.trim().toLowerCase()
      );
      if (matchScore > 85) pointsAwarded = pointValue;
    }

    totalPoints += pointsAwarded;
    gradedAnswers.push({
      playerAnswer,
      correctAnswer,
      points: pointsAwarded,
    });
  });

  return { totalPoints, gradedAnswers };
}

async function submitAnswers(req, res) {
  const { code, roundIndex } = req.params;
  const { teamId, answers } = req.body;

  try {
    const db = getDB();
    const game = await db.collection("games").findOne({ code });
    if (!game) return res.status(404).json({ error: "Game not found" });

    const round = game.rounds[parseInt(roundIndex)];
    if (!round) return res.status(404).json({ error: "Round not found" });

    const { totalPoints, gradedAnswers } = gradeSubmission(round, { answers });

    const submission = {
      teamId,
      answers,
      gradedAnswers,
      score: totalPoints,
      submittedAt: new Date(),
    };

    await db.collection("games").updateOne(
      { code },
      { $push: { [`rounds.${roundIndex}.submissions`]: submission } }
    );

    res.json({ success: true, score: totalPoints });
  } catch (err) {
    console.error("❌ Failed to submit answers:", err);
    res.status(500).json({ error: "Failed to submit answers", details: err.message });
  }
}

module.exports = {
  submitAnswers,
};
