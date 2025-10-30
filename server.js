import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const PORT = process.env.PORT || 8080;

if (!KEY) {
  console.error("❌ Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

// Helper function to pick right API version
function getGeminiUrl(model) {
  if (model.startsWith("gemini-1")) {
    return `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${KEY}`;
  } else if (model.startsWith("gemini-2")) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`;
  } else {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`;
  }
}

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) return res.status(400).json({ error: "No message provided." });

    const url = getGeminiUrl(MODEL);

    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Gemini API error:", data);
      return res.status(500).json({ error: data });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ No response from Gemini.";

    res.json({ reply: text });
  } catch (e) {
    console.error("❌ Server error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Gemini backend running on port ${PORT} using model ${MODEL}`);
});
