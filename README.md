# KUMARI - Adolescent Health Assistant
https://ai.studio/apps/d7247f15-da1a-4c1b-901a-ff21757ae79a

KUMARI is an AI-powered personal health assistant designed specifically to provide sensitive, culturally relevant, and accurate health and well-being guidance to adolescent girls in India, as well as community health workers (ASHA didis).

## Features

- **Personalized AI Health Chatbot**: Powered by Gemini (`gemini-3.6-flash`) for empathetic, non-judgmental, age-appropriate health counseling on nutrition, menstrual health, IFA supplementation, emotional wellness, and education.
- **Localized Knowledge Base**: Integrated context layer providing facts on adolescent nutrition, menstrual hygiene, anemia, and community healthcare resources.
- **Multilingual & Language Detection**: Automatically detects user language (English, Hindi, Hinglish, Tamil, Bengali, Telugu, Marathi, Kannada, Malayalam, etc.) and responds in the user's preferred language.
- **Voice Interaction**: Interactive speech recognition and text-to-speech for accessible, hands-free voice guidance.
- **Worker Mode**: Toggleable mode providing ASHA health workers with clear facilitation tips and talking points for community sessions.
- **Onboarding & Auth**: Phone-number based access flow with onboarding guidance.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend / Server**: Express (Node.js/TypeScript) bundled via `esbuild`
- **AI Engine**: `@google/genai` SDK using `gemini-3.6-flash`
- **Speech APIs**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)

## Environment Setup

Define the required API key in your environment or `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will run at `http://localhost:3000`.

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Run production server**:
   ```bash
   npm start
   ```

## License

MIT
