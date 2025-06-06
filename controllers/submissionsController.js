const { getDB } = require("../db");
const { ObjectId } = require("mongodb");
const fuzz = require("fuzzball");

function gradeSubmission(round, submission) {
  let totalPoints = 0;
  const gradedAnswers = [];

if (round.type === "one-clue") {
  // Find the first answered clue
  const clueUsedIndex = submission.answers.findIndex((a) => a?.trim() !== "");
  const playerAnswer = submission.answers?.[clueUsedIndex]?.trim().toLowerCase();
  const correctAnswer = round.answer?.trim().toLowerCase();

  if (!playerAnswer) {
    gradedAnswers.push({ playerAnswer: "", correct: false, points: 0 });
  } else {
    const matchScore = fuzz.partial_ratio(playerAnswer, correctAnswer);
    const clue = round.questions[clueUsedIndex];
    const pointValue = Number(clue.points || 0);
    const pointsAwarded = matchScore > 85 ? pointValue : 0;

    totalPoints = pointsAwarded;

    gradedAnswers.push({
      playerAnswer: submission.answers[clueUsedIndex],
      correctAnswer: round.answer,
      clueUsed: clueUsedIndex + 1,
      points: Math.round(pointsAwarded),
    });
  }

  return { totalPoints, gradedAnswers };
}


  // Standard grading
  round.questions.forEach((question, index) => {
    const playerAnswer = submission.answers?.[index];
    const correctAnswer = question.answer;
    const type = question.type || "standard";
    const pointValue = Number(question.points || 1);

    let pointsAwarded = 0;

    if (!playerAnswer || playerAnswer.trim() === "") {
      gradedAnswers.push({ playerAnswer: "", correct: false, points: 0 });
      return;
    }

    const correctParts = correctAnswer.split(",").map((s) => s.trim().toLowerCase());
    const playerParts = playerAnswer.split(",").map((s) => s.trim().toLowerCase());

    if (type === "multi-answer") {
      const matched = new Set();
      playerParts.forEach((ans) => {
        const match = correctParts.find((correct) => fuzz.partial_ratio(ans, correct) > 85);
        if (match) matched.add(match);
      });
      const numCorrect = matched.size;
      const required = Number(question.requiredCount || correctParts.length);
      const awardable = Math.min(numCorrect, required);
      pointsAwarded = (awardable / required) * pointValue;

    } else if (type === "multi-required") {
      const matched = new Set();
      playerParts.forEach((ans) => {
        const match = correctParts.find((correct) => fuzz.partial_ratio(ans, correct) > 85);
        if (match) matched.add(match);
      });
      const required = Number(question.requiredCount || correctParts.length);
      const allMatched = matched.size >= required;
      pointsAwarded = allMatched ? pointValue : 0;

    } else {
      const matchScore = fuzz.partial_ratio(playerAnswer.trim().toLowerCase(), correctAnswer.trim().toLowerCase());
      if (matchScore > 85) pointsAwarded = pointValue;
    }

    totalPoints += pointsAwarded;

    gradedAnswers.push({
      playerAnswer,
      correctAnswer,
      points: Math.round(pointsAwarded),
    });
  });

  return { totalPoints, gradedAnswers };
}




async function submitAnswers(req, res) {
  const { code, roundIndex } = req.params;
  const { teamId, answers, useDoubleOrNothing } = req.body;


  try {
    const db = getDB();
    const game = await db.collection("games").findOne({ code });
    if (!game) return res.status(404).json({ error: "Game not found" });

    const round = game.rounds[parseInt(roundIndex)];
    if (!round) return res.status(404).json({ error: "Round not found" });

    if (round.isLocked) {
        return res.status(400).json({ error: "This round is locked, no more submissions allowed." });
      }

    const existingSubmission = round.submissions?.find(
        (s) => s.teamId === teamId
      );
      if (existingSubmission) {
        return res.status(400).json({ error: "Team has already submitted for this round." });
      }

    const { totalPoints, gradedAnswers } = gradeSubmission(round, { answers });

    let finalScore = totalPoints;
const allCorrect = round.questions
  .filter((q, i) => !q.isDecoy)
  .every((_, i) => gradedAnswers[i]?.points > 0);
if (round.doubleOrNothing && useDoubleOrNothing) {
  finalScore = allCorrect ? totalPoints * 2 : 0;
}


const submission = {
  teamId,
  answers,
  gradedAnswers,
  useDoubleOrNothing: !!useDoubleOrNothing,
  score: finalScore,
  submittedAt: new Date(),
};

// Push the new submission into the round in memory
round.submissions = round.submissions || [];
round.submissions.push(submission);

// Save the modified rounds array back to the DB
await db.collection("games").updateOne(
  { code },
  { $set: { rounds: game.rounds } }
);


    res.json({ success: true, score: totalPoints });
  } catch (err) {
    console.error("❌ Failed to submit answers:", err);
    res.status(500).json({ error: "Failed to submit answers", details: err.message });
  }
}

async function updateSubmission(req, res) {
  const { code, roundIndex, teamId } = req.params;
  const { gradedAnswers = [], score } = req.body;

  try {
    const db = getDB();
    const game = await db.collection("games").findOne({ code });

    if (!game) return res.status(404).json({ error: "Game not found" });

    const round = game.rounds[parseInt(roundIndex)];
    if (!round) return res.status(404).json({ error: "Round not found" });

    const submissions = round.submissions || [];
    const submissionIndex = submissions.findIndex(s => s.teamId === teamId);

    if (submissionIndex === -1) {
      // Add new submission
      const newSubmission = {
        teamId,
        gradedAnswers,
        score,
        createdManually: true,
        timestamp: new Date()
      };

      await db.collection("games").updateOne(
        { code },
        {
          $push: {
            [`rounds.${roundIndex}.submissions`]: newSubmission
          }
        }
      );
    } else {
      // Update existing submission
      await db.collection("games").updateOne(
        { code },
        {
          $set: {
            [`rounds.${roundIndex}.submissions.${submissionIndex}.gradedAnswers`]: gradedAnswers,
            [`rounds.${roundIndex}.submissions.${submissionIndex}.score`]: score
          }
        }
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to update submission:", err);
    res.status(500).json({ error: "Failed to update submission", details: err.message });
  }
}


module.exports = {
  submitAnswers,
  updateSubmission
};
