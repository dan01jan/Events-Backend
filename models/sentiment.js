const mongoose = require("mongoose");

const SentimentSchema = mongoose.Schema(
  {
    userMessage: { type: String, required: true },
    sentimentResult: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false } // Disables the `__v` field
);

module.exports = mongoose.model("Sentiment", SentimentSchema);
