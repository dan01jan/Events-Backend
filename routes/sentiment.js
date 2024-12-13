const express = require("express");
const router = express.Router();
const Sentiment = require("../models/sentiment");
const https = require("https");

// Sentiment Analysis API Configuration
const analyzeSentiment = (message) => {
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      hostname: "sentiment-analysis9.p.rapidapi.com",
      path: "/sentiment",
      headers: {
        "x-rapidapi-key": "98387a8ec0mshfe04690e0a2f5edp121879jsn8607d7ff8c1b",
        "x-rapidapi-host": "sentiment-analysis9.p.rapidapi.com",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];

      res.on("data", (chunk) => {
        chunks.push(chunk);
      });

      res.on("end", () => {
        const body = Buffer.concat(chunks).toString();
        resolve(JSON.parse(body)); // Parse the response JSON
      });
    });

    req.on("error", (err) => reject(err));

    req.write(
      JSON.stringify([
        {
          id: "1",
          language: "en",
          text: message,
        },
      ])
    );
    req.end();
  });
};

// Route: Analyze Sentiment
router.post("/analyze", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Analyze sentiment using the external API
    const sentimentResult = await analyzeSentiment(message);

    // Save the result to MongoDB
    const newSentiment = new Sentiment({
      userMessage: message,
      sentimentResult,
    });
    await newSentiment.save();

    // Respond with the sentiment result
    res.status(200).json({
      message: "Sentiment analysis completed",
      sentimentResult,
    });
  } catch (err) {
    console.error("Error analyzing sentiment:", err);
    res.status(500).json({ error: "Failed to analyze sentiment" });
  }
});

// Route: Get All Sentiment Entries
router.get("/", async (req, res) => {
  try {
    const sentiments = await Sentiment.find().sort({ createdAt: -1 });
    res.status(200).json(sentiments);
  } catch (err) {
    console.error("Error fetching sentiments:", err);
    res.status(500).json({ error: "Failed to fetch sentiments" });
  }
});

// Export the router
module.exports = router;
