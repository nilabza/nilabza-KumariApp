import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { retrieveContext } from './services/knowledgeBase';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy-initialize GoogleGenAI client
  const getGenAIClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment.");
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Language Detection Endpoint
  app.post(['/api/detect-language', '/api/detect-language/'], async (req, res) => {
    try {
      const { text } = req.body || {};
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.json({ languageCode: 'en-IN' });
      }

      const ai = getGenAIClient();
      if (!ai) {
        return res.json({ languageCode: 'en-IN' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Identify the primary BCP-47 language tag (such as 'en-IN', 'hi-IN', 'ta-IN', 'bn-IN', 'te-IN', 'mr-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'pa-IN') for the text below. If the text is written in Hinglish/Romanized Hindi or mixed, return 'hi-IN' or 'en-IN'. Return ONLY the BCP-47 language code string with no quotes, formatting, or extra explanation.\n\nText: "${text.trim()}"`,
      });

      const langCode = response.text ? response.text.trim().replace(/['"`]/g, '') : 'en-IN';
      return res.json({ languageCode: langCode || 'en-IN' });
    } catch (error) {
      console.error('Error in language detection:', error);
      return res.json({ languageCode: 'en-IN' });
    }
  });

  // Chatbot Response Endpoint
  app.post(['/api/chat', '/api/chat/'], async (req, res) => {
    try {
      const { query, userProfile, langCode = 'en-IN', isWorkerMode = false } = req.body || {};

      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const ai = getGenAIClient();
      if (!ai) {
        return res.json({
          responseText: "I'm currently missing my API connection key. Please verify that the GEMINI_API_KEY is set in your environment settings.",
        });
      }

      // Retrieve relevant domain knowledge context
      const knowledge = retrieveContext(query);
      const knowledgeContextStr = knowledge.content.length > 0
        ? `\n\nRelevant Knowledge Base Facts (${knowledge.topic}):\n- ` + knowledge.content.join('\n- ')
        : '';

      const userAge = userProfile?.age || 13;
      const userLocation = userProfile?.location || 'rural';
      const userName = userProfile?.name ? ` User name is ${userProfile.name}.` : '';

      const systemInstruction = `You are KUMARI, a compassionate, friendly, supportive, and culturally sensitive AI health & well-being assistant created specifically for adolescent girls in India${isWorkerMode ? ' and community health workers (ASHA didis)' : ''}.
${userName}
Target audience profile: Adolescent girl (age ${userAge}, ${userLocation} area in India).

Key Guidelines:
1. Tone: Warm, empathetic, non-judgmental, reassuring, clear, and age-appropriate. Speak like a caring older sister or trusted guide ("Didi").
2. Language: Respond in language/script code '${langCode}' (or the language/script used by the user in their query, e.g. Hindi, Hinglish, Tamil, Bengali, English).
3. Focus Areas: Menstrual health & hygiene, menstrual cramps management, balanced nutrition, anemia prevention (IFA tablets), emotional well-being & stress, preventing early child marriage, continuing education & career opportunities.
4. Accuracy & Safety: Normalize bodily changes and periods. Give simple practical health steps. Encourage talking to trusted adults, teachers, or ASHA didis for severe pain or serious symptoms. Do not provide complex medical prescriptions or clinical diagnoses.
${isWorkerMode ? '5. Worker Mode Active: Provide clear, actionable facilitation advice and talking points that an ASHA didi or health worker can use to educate adolescent girls and counsel parents effectively.' : ''}
${knowledgeContextStr}

Format your response clearly using friendly paragraphs or bullet points if helpful. Avoid long robotic disclaimers. Keep your response concise, helpful, and encouraging.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: query.trim(),
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = response.text
        ? response.text.trim()
        : "I'm having trouble phrasing my response right now. Could you please try asking again?";

      return res.json({ responseText });
    } catch (error) {
      console.error('Error handling chat request:', error);
      return res.json({
        responseText: "I experienced a temporary network issue. Please try asking your question again in a moment.",
      });
    }
  });

  // Vite Middleware for development / Static file serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
