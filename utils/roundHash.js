const crypto = require("crypto");

function normalizeRoundForHash(round) {
  return JSON.stringify({
    theme: round.theme || "",
    description: round.description || "",
    type: round.type || "",
    doubleOrNothing: !!round.doubleOrNothing,
    betting: !!round.betting,
    questions: (round.questions || []).map(q => ({
      question: q.question || "",
      answer: q.answer || "",
      type: q.type || "standard",
      options: Array.isArray(q.options) ? [...q.options].sort() : [],
      points: Number(q.points || 0),
      requiredCount: Number(q.requiredCount || 0),
      allowBonus: !!q.allowBonus,
      image: q.image || "",
    })),
  });
}

function computeRoundHash(round) {
  return crypto.createHash("sha256").update(normalizeRoundForHash(round)).digest("hex");
}

module.exports = { computeRoundHash };
