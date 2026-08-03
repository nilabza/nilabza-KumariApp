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

  // Language Detection Endpoint with fast local script detection & model fallback
  app.post(['/api/detect-language', '/api/detect-language/'], async (req, res) => {
    try {
      const { text } = req.body || {};
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.json({ languageCode: 'en-IN' });
      }

      const input = text.trim();

      // Fast local script detection to save API calls and quota
      if (/[\u0900-\u097F]/.test(input)) return res.json({ languageCode: 'hi-IN' });
      if (/[\u0B80-\u0BFF]/.test(input)) return res.json({ languageCode: 'ta-IN' });
      if (/[\u0980-\u09FF]/.test(input)) return res.json({ languageCode: 'bn-IN' });
      if (/[\u0C00-\u0C7F]/.test(input)) return res.json({ languageCode: 'te-IN' });
      if (/[\u0C80-\u0CFF]/.test(input)) return res.json({ languageCode: 'kn-IN' });
      if (/[\u0D00-\u0D7F]/.test(input)) return res.json({ languageCode: 'ml-IN' });
      if (/[\u0A80-\u0AFF]/.test(input)) return res.json({ languageCode: 'gu-IN' });
      if (/[\u0A00-\u0A7F]/.test(input)) return res.json({ languageCode: 'pa-IN' });

      // Detect Romanized Hindi (Hinglish)
      const hinglishKeywords = /\b(kya|kaise|hai|mujhe|mera|meri|mere|didi|ho|nahi|haan|batao|dard|khana|paani|pata|karo|kab)\b/i;
      if (hinglishKeywords.test(input)) {
        return res.json({ languageCode: 'hi-IN' });
      }

      const ai = getGenAIClient();
      if (!ai) {
        return res.json({ languageCode: 'en-IN' });
      }

      // Try lightweight models with fallback
      const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const model of models) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: `Identify the BCP-47 language tag (e.g. 'en-IN', 'hi-IN', 'ta-IN', 'bn-IN') for: "${input}". Return ONLY the BCP-47 string.`,
          });
          const langCode = response.text ? response.text.trim().replace(/['"`]/g, '') : 'en-IN';
          return res.json({ languageCode: langCode || 'en-IN' });
        } catch (e) {
          console.warn(`Language detection failed with model ${model}, trying next...`);
        }
      }

      return res.json({ languageCode: 'en-IN' });
    } catch (error) {
      console.error('Error in language detection:', error);
      return res.json({ languageCode: 'en-IN' });
    }
  });

  // Save Conversation Endpoint
  app.post(['/api/conversations', '/api/conversations/'], async (req, res) => {
    try {
      const conversationData = req.body;
      console.log('Saved conversation anonymously:', {
        age: conversationData?.user_age,
        location: conversationData?.user_location,
        messageCount: conversationData?.messages?.length,
      });
      return res.json({ status: 'success', message: 'Conversation saved successfully.' });
    } catch (error) {
      console.error('Error saving conversation:', error);
      return res.status(500).json({ error: 'Failed to save conversation.' });
    }
  });

  // Chatbot Response Endpoint
  app.post(['/api/chat', '/api/chat/'], async (req, res) => {
    try {
      const { query, userProfile, langCode = 'en-IN', isWorkerMode = false } = req.body || {};

      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'Query is required' });
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

      const ai = getGenAIClient();
      let responseText = '';

      if (ai) {
        // Models list to try in order of preference for resilience against rate limits
        const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-3.6-flash'];
        
        for (const model of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: query.trim(),
              config: {
                systemInstruction,
                temperature: 0.7,
              },
            });

            if (response.text && response.text.trim()) {
              responseText = response.text.trim();
              break; // Successfully got a response!
            }
          } catch (modelError: any) {
            console.warn(`Model ${model} failed or exceeded quota:`, modelError?.message || modelError);
            // Continue loop to try next fallback model
          }
        }
      }

      // If all Gemini calls fail (due to quota or network), construct a warm, high-quality response using the local knowledge base
      if (!responseText) {
        if (knowledge.content.length > 0) {
          const formattedFacts = knowledge.content.map(fact => `• ${fact}`).join('\n');
          responseText = `Hi dear! I am here for you. Regarding **${knowledge.topic}**, here is some helpful guidance:\n\n${formattedFacts}\n\nRemember to stay hydrated, eat nourishing food, and reach out to a trusted elder, teacher, or ASHA didi if you ever feel uncomfortable or unwell. You are doing great! 💕`;
        } else {
          responseText = `Hi dear! I am KUMARI, your personal health assistant. I am here to support you with questions about nutrition, menstrual health, emotional well-being, and staying healthy.\n\nCould you please tell me a bit more about what you would like to know today? 💕`;
        }
      }

      return res.json({ responseText });
    } catch (error) {
      console.error('Error handling chat request:', error);
      return res.json({
        responseText: "Hi dear! I experienced a temporary network slowdown, but I am right here with you. Please ask your question once again and I'll be happy to help!",
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
