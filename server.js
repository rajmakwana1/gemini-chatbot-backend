import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const PORT = process.env.PORT || 8080;

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage)
      return res.status(400).json({ error: "No message provided" });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ],
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error("Gemini API error:", data);
      return res.status(500).json({ error: data });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini.";
    res.json({ reply: text });
  } catch (e) {
    console.error("Server error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Gemini backend running on ${PORT} (${MODEL})`)
);
