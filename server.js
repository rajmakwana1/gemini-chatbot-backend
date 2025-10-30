require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
//const fetch = require('node-fetch'); // or use global fetch if Node 18+
const app = express();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

app.use(express.json());

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

if (!KEY) {
  console.error('Set GEMINI_API_KEY in .env');
  process.exit(1);
}

// POST /chat { message: "user text" }
app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) return res.status(400).json({ error: 'no message provided' });

    // REST endpoint for Gemini / Google Generative AI
    // Official docs show client libraries and REST endpoints like:
    // https://api.generativeai.googleapis.com/v1/models/<model>:generateText
    const url = `https://api.generativeai.googleapis.com/v1/models/${MODEL}:generateText`;

    const body = {
      // The exact request shape may vary over releases. This is a general text-generation shape.
      prompt: {
        messages: [
          { role: "user", content: { text: userMessage } }
        ]
      },
      temperature: 0.2,
      maxOutputTokens: 512
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KEY}`,       // API key usage
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const json = await r.json();

    // Response parsing fallback: models and library versions can return different shapes.
    let text = '';
    if (json?.candidates && json.candidates[0]) {
      // some Gemini endpoints return candidates
      const candidate = json.candidates[0];
      // candidate.content may be a structured object — try common fields
      text = candidate?.content?.text || candidate?.content?.[0]?.text || JSON.stringify(candidate);
    } else if (json?.output && json.output[0]?.content) {
      // alternative shape
      text = json.output[0].content.map(c => c.text || '').join('\n').trim();
    } else if (json?.text) {
      text = json.text;
    } else {
      text = JSON.stringify(json);
    }

    res.json({ reply: text });
  } catch (e) {
    console.error('backend error', e);
    res.status(500).json({ error: e.message, raw: e.stack });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`chat backend listening on ${port}`));
