import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs/promises";
import { GoogleGenAI } from "@google/genai";

const app = express();
const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = "gemini-2.0-flash-exp";

// Middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

const PORT = 3000;

// Add error handling for server startup
app.listen(PORT, () => {
  console.log(`Server ready on http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Server startup error:', err);
});

// Test if environment variables are loaded
console.log('Environment check:');
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);

function extractText(resp) {
  try {
    // Try different possible response structures
    const text = resp?.candidates?.[0]?.content?.parts?.[0]?.text ||
                 resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
                 resp?.candidates?.[0]?.content?.text ||
                 resp?.response?.text;

    return text || JSON.stringify(resp, null, 2);
  } catch (err) {
    console.error("Error extracting text:", err);
    return JSON.stringify(resp, null, 2);
  }
}

// CHAT API ENDPOINT
app.post("/api/chat", async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { messages } = req.body || {};
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    // Get the latest user message
    const userMessage = messages[messages.length - 1]?.content;
    if (!userMessage) {
      return res.status(400).json({ error: 'User message content is required' });
    }
    
    console.log('Processing message:', userMessage);
    const resp = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ parts: [{ text: userMessage }] }],
    });
    
    console.log('API Response:', JSON.stringify(resp, null, 2));
    res.json({ result: extractText(resp) });
  } catch (err) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({ error: err.message });
  }
});

// GENERATE TEXT (keeping for backward compatibility)
app.post("/generate-text", async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { prompt } = req.body || {};
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    console.log('Processing prompt:', prompt);
    const resp = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
    });
    
    console.log('API Response:', JSON.stringify(resp, null, 2));
    res.json({ result: extractText(resp) });
  } catch (err) {
    console.error('Error in /generate-text:', err);
    res.status(500).json({ error: err.message });
  }
});

// generate from image
app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  try {
    const { prompt } = req.body;
    const imageBase64 = req.file.buffer.toString("base64");
    const resp = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: req.file.mimetype, data: imageBase64 } }
        ]
      }],
    });
    res.json({ result: extractText(resp) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 4. Generate From Document
app.post('/generate-from-document', upload.single('document'), async (req, res) => {
  try {
      const { prompt} = req.body;
      const docBase64 = req.file.buffer.toString("base64");
      const resp = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{
          parts: [
            { text: prompt || "Ringkas dokumen berikut:" },
            { inlineData: { mimeType: req.file.mimetype, data: docBase64 } }
          ]
        }]
      });
      res.json({ result: extractText(resp) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  
// 3. Generate From Audio
app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
  try {
    const { prompt} = req.body;
    const audioBase64 = req.file.buffer.toString('base64');
    const resp = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{
        parts: [
          { text: prompt || "Transkrip audio berikut:" },
          { inlineData: { mimeType: req.file.mimetype, data: audioBase64 } }
        ]
      }]
    });
    res.json({ result: extractText(resp) });
  } catch (err) {
res.status(500).json({ error: err.message });
}
});