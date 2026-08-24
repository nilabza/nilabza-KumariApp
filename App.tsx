
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Role, UserProfile, SUPPORTED_LANGUAGES } from './types';
import { getChatbotResponse, detectLanguage } from './services/geminiService';
import { retrieveContext as getContextForQuery } from './services/knowledgeBase';
import { getRandomProbingQuestion } from './services/probingQuestions';
import ChatInterface from './components/ChatInterface';
import Onboarding from './components/Onboarding';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import Auth from './components/Auth';

type CallState = 'idle' | 'ringing' | 'greeting' | 'listening' | 'processing' | 'responded';
type RecognitionMode = 'idle' | 'mic-button' | 'call';
const MAX_CONSECUTIVE_FAILURES = 2; // Exit voice mode after this many "no-speech" errors.
const MIN_WORDS_FOR_QUERY = 2; // A query with less than 2 words (i.e., a single word) is considered insufficient.
const LOW_INFO_PHRASES = new Set(['yes', 'no', 'ok', 'okay', 'hmm', 'thanks', 'thank you', 'i see', 'got it', 'fine', 'good']);
const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userProfile] = useState<UserProfile>({
    name: '',
    age: 13,
    location: 'rural',
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [consent, setConsent] = useState<boolean | null>(null);
  const [isWorkerMode, setIsWorkerMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
  const [callState, setCallState] = useState<CallState>('idle');
  const [latestBotResponse, setLatestBotResponse] = useState({ id: '', content: '', langCode: '' });
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastSpokenMessageId, setLastSpokenMessageId] = useState<string | null>(null);
  const [consecutiveSpeechFailures, setConsecutiveSpeechFailures] = useState(0);
  const [currentLangCode, setCurrentLangCode] = useState('en-IN');
  const [isSystemReady, setIsSystemReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  
  const [inputValue, setInputValue] = useState('');
  const [micError, setMicError] = useState('');
  const [recognitionMode, setRecognitionMode] = useState<RecognitionMode>('idle');

  const { speak, cancel, isSpeaking, primeTTS } = useTextToSpeech();

  const handleFinalTranscriptRef = useRef<((transcript: string) => void) | null>(null);
  const handleInterimTranscriptRef = useRef<((transcript: string) => void) | null>(null);
  const handleRecognitionErrorRef = useRef<((error: string) => void) | null>(null);
  
  // FIX: The callback must accept a 'transcript' argument to match the signature expected by useSpeechRecognition.
  const onFinalTranscript = useCallback((transcript: string) => {
    handleFinalTranscriptRef.current?.(transcript);
  }, []);

  // FIX: The callback must accept a 'transcript' argument to match the signature expected by useSpeechRecognition.
  const onInterimTranscript = useCallback((transcript: string) => {
    handleInterimTranscriptRef.current?.(transcript);
  }, []);

  // FIX: The callback must accept an 'error' argument to match the signature expected by useSpeechRecognition.
  const onRecognitionError = useCallback((error: string) => {
    handleRecognitionErrorRef.current?.(error);
  }, []);

  const { isListening, toggleListening, startListening, stopListening } = useSpeechRecognition(
    onFinalTranscript,
    onInterimTranscript,
    onRecognitionError
  );

  const resetCall = useCallback(() => {
    cancel();
    setCallState('idle');
    setConsent(null);
    setInterimTranscript('');
    setLastSpokenMessageId(null);
    setConsecutiveSpeechFailures(0);
  }, [cancel]);

  // Check for logged in user on mount
  useEffect(() => {
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
      setCurrentUser(loggedInUser);
      const hasSeenOnboarding = localStorage.getItem(`onboarding_completed_${loggedInUser}`);
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, []);
  
  const handleAuthSuccess = (phoneNumber: string) => {
    localStorage.setItem('currentUser', phoneNumber);
    setCurrentUser(phoneNumber);
    const hasSeenOnboarding = localStorage.getItem(`onboarding_completed_${phoneNumber}`);
    if (!hasSeenOnboarding) {
        setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    if (currentUser) {
        localStorage.setItem(`onboarding_completed_${currentUser}`, 'true');
    }
    setShowOnboarding(false);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    // Reset chat state to default
    setMessages([
      { id: 'initial-greeting', role: Role.BOT, content: `Hi Dear! I'm KUMARI, your personal health assistant. How can I help you today?` }
    ]);
    setConsent(null);
    setIsWorkerMode(false);
    setIsSystemReady(false);
    setShowOnboarding(false);
    resetCall();
  };

  const endVoiceMode = useCallback(() => {
    setIsVoiceModeActive(false);
    cancel();
    setLastSpokenMessageId(null);
    setConsecutiveSpeechFailures(0);
    setRecognitionMode('idle');
    if (isListening) stopListening();
  }, [cancel, isListening, stopListening]);
  
  const processUserQuery = useCallback(async (userInput: string, onResponseReady?: (content: string, langCode: string) => void) => {
    const trimmedInput = userInput.trim();
    const isLowInfo = LOW_INFO_PHRASES.has(trimmedInput.toLowerCase());
    
    if ((isLowInfo || trimmedInput.split(' ').length < MIN_WORDS_FOR_QUERY) && (isVoiceModeActive || callState === 'listening')) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === Role.USER && !LOW_INFO_PHRASES.has(m.content.toLowerCase()))?.content;
      const { topic } = lastUserMessage ? getContextForQuery(lastUserMessage) : { topic: 'Default Fallback' };
      const probingQuestion = getRandomProbingQuestion(topic);
      const prompt = `Thanks for your response. To give you the best advice, I need a little more detail. For instance, you could ask, "${probingQuestion}". What would you like to know?`;
      
      setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.USER, content: userInput }, { id: (Date.now() + 1).toString(), role: Role.SYSTEM, content: "User query was too short. Prompting for more details." }]);
      
      speak(prompt, 'en-IN', () => {
          setTimeout(() => {
              if (isVoiceModeActive || callState === 'listening') {
                  setRecognitionMode('call');
                  startListening(currentLangCode);
              }
          }, 750);
      });
      setIsLoading(false);
      if (isWorkerMode) setCallState('listening');
      return;
    }
    
    setConsecutiveSpeechFailures(0);
    setIsLoading(true);
    if (isWorkerMode) setCallState('processing');

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: trimmedInput,
    };
    setMessages(prev => [...prev, newUserMessage]);

    // Use manual language override if set; otherwise auto-detect
    const langCode = selectedLanguage !== 'auto' 
      ? selectedLanguage 
      : await detectLanguage(trimmedInput);
      
    setCurrentLangCode(langCode);
    const botResponseContent = await getChatbotResponse(trimmedInput, userProfile, langCode, isWorkerMode);
    
    const botMessageId = (Date.now() + 1).toString();
    setLatestBotResponse({ id: botMessageId, content: botResponseContent, langCode });

    const newBotMessage: Message = {
        id: botMessageId,
        role: Role.BOT,
        content: botResponseContent,
        isHelpful: null,
    };

    setMessages(prev => [...prev, newBotMessage]);
    setIsLoading(false);
    if (isWorkerMode) setCallState('responded');

    onResponseReady?.(botResponseContent, langCode);

  }, [userProfile, isWorkerMode, isVoiceModeActive, callState, currentLangCode, selectedLanguage, messages, speak, startListening]);

  const handleLanguageChange = (newLangCode: string) => {
    setSelectedLanguage(newLangCode);
    if (newLangCode !== 'auto') {
      setCurrentLangCode(newLangCode);
      const selected = SUPPORTED_LANGUAGES.find(l => l.code === newLangCode);
      const label = selected ? `${selected.nativeLabel} (${selected.label})` : newLangCode;
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: Role.SYSTEM,
          content: `Language switched to ${label}. KUMARI will now respond in this language.`,
        }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: Role.SYSTEM,
          content: `Language set to Auto-Detect. KUMARI will automatically detect and respond in the language you type or speak.`,
        }
      ]);
    }
  };

  const handleSendMessage = useCallback((userInput: string = '', isFromVoice: boolean = false) => {

    const query = userInput.trim();
    if (!query) return;

    const onResponseReady = isFromVoice
        ? (content: string, langCode: string) => {
            speak(content, langCode);
        }
        : undefined;

    processUserQuery(query, onResponseReady);
    setInputValue('');
    if (micError) setMicError('');
  }, [processUserQuery, micError, speak]);

  const handleFinalTranscript = useCallback((transcript: string) => {
    if (recognitionMode === 'mic-button') {
        if (transcript.trim()) {
            handleSendMessage(transcript.trim(), true);
        }
        setInputValue('');
    } else if (recognitionMode === 'call') {
        const trimmedTranscript = transcript.trim();
        if (trimmedTranscript && (callState === 'listening' || isVoiceModeActive)) {
            handleSendMessage(trimmedTranscript, true);
        }
    }
    setRecognitionMode('idle');
  }, [recognitionMode, callState, isVoiceModeActive, handleSendMessage]);

  const handleInterimTranscript = useCallback((transcript: string) => {
    if (recognitionMode === 'mic-button') {
        setInputValue(transcript);
    } else if (recognitionMode === 'call') {
        setInterimTranscript(transcript);
    }
  }, [recognitionMode]);
  
  const handleRecognitionError = useCallback((error: string) => {
    if (recognitionMode === 'mic-button') {
        if (error === 'no-speech') {
            setMicError("I didn't hear anything. Tap the mic to try again.");
        } else if (error === 'audio-capture') {
            setMicError("Couldn't access the microphone. Please check permissions.");
        } else {
            setMicError('Sorry, a microphone error occurred.');
        }
        setInputValue('');
        setTimeout(() => setMicError(''), 5000);
        setRecognitionMode('idle');
        return;
    }

    if (error === 'not-allowed' || error === 'audio-capture') {
        const errorMessage = "I can't access the microphone. Please check your browser's permissions and try again.";
        setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.SYSTEM, content: `Microphone permission error: ${error}.` }]);
        
        if (isVoiceModeActive) {
            speak(errorMessage, 'en-IN', endVoiceMode);
        } else if (callState === 'listening') {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.SYSTEM, content: "Call ended due to microphone permission error." }]);
            resetCall();
        }
        return;
    }
    
    if (error === 'no-speech') {
        const newFailureCount = consecutiveSpeechFailures + 1;
        setConsecutiveSpeechFailures(newFailureCount);

        if (newFailureCount >= MAX_CONSECUTIVE_FAILURES) {
            const exitMessage = isVoiceModeActive 
                ? "It seems I'm having trouble hearing you. Let's switch back to text for now. You can type your question below."
                : "I couldn't hear a response. The call will now end. Please try again later.";
            const systemLogMessage = isVoiceModeActive ? "Could not hear user after multiple attempts. Exiting voice mode." : "No response from user after multiple attempts. Ending call simulation.";
            setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.SYSTEM, content: systemLogMessage }]);
            speak(exitMessage, 'en-IN', () => {
                if (isVoiceModeActive) endVoiceMode();
                else resetCall();
            });
        } else {
            const lastUserMessage = [...messages].reverse().find(m => m.role === Role.USER)?.content;
            const { topic } = lastUserMessage ? getContextForQuery(lastUserMessage) : { topic: 'Default Fallback' };
            const probingQuestion = getRandomProbingQuestion(topic);
            const prompt = `I'm sorry, I didn't catch that. If you're not sure what to ask, you could try asking something like: "${probingQuestion}"`;

            setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.SYSTEM, content: "Could not hear user, prompting with a suggestion." }]);
            speak(prompt, 'en-IN', () => {
                setTimeout(() => {
                    if (isVoiceModeActive || callState === 'listening') {
                        setRecognitionMode('call');
                        startListening(currentLangCode);
                    }
                }, 750);
            });
        }
    }
    setRecognitionMode('idle');
  }, [isVoiceModeActive, callState, consecutiveSpeechFailures, resetCall, speak, endVoiceMode, startListening, currentLangCode, recognitionMode, messages]);

  useEffect(() => { 
    handleFinalTranscriptRef.current = handleFinalTranscript;
    handleInterimTranscriptRef.current = handleInterimTranscript;
    handleRecognitionErrorRef.current = handleRecognitionError; 
  }, [handleFinalTranscript, handleInterimTranscript, handleRecognitionError]);

  useEffect(() => {
    if (isWorkerMode && callState === 'listening' && !isListening && !isSpeaking && !isLoading) {
      setRecognitionMode('call');
      startListening(currentLangCode);
    }
  }, [isWorkerMode, callState, isListening, isSpeaking, isLoading, startListening, currentLangCode]);
  
  useEffect(() => {
    if (isVoiceModeActive && isListening) {
      setConsecutiveSpeechFailures(0);
    }
  }, [isListening, isVoiceModeActive]);
  
  useEffect(() => {
    setMessages([
      { id: 'initial-greeting', role: Role.BOT, content: `Hi Dear! I'm KUMARI, your personal health assistant. How can I help you today?` }
    ]);
  }, []);
  
  useEffect(() => {
    const shouldSpeak = latestBotResponse.content && latestBotResponse.id !== lastSpokenMessageId;
    if (!shouldSpeak || isLoading || isSpeaking) return;

    if (isVoiceModeActive) {
      setLastSpokenMessageId(latestBotResponse.id);
      speak(latestBotResponse.content, latestBotResponse.langCode, () => {
        if (isVoiceModeActive) {
          setTimeout(() => {
            if (isVoiceModeActive) {
              setRecognitionMode('call');
              startListening(currentLangCode);
            }
          }, 750);
        }
      });
    } else if (isWorkerMode && callState === 'responded') {
      setLastSpokenMessageId(latestBotResponse.id);
      speak(latestBotResponse.content, latestBotResponse.langCode, () => {
        if (isWorkerMode) {
            setCallState('listening');
        }
      });
    }
  }, [latestBotResponse, lastSpokenMessageId, isVoiceModeActive, isWorkerMode, callState, isLoading, isSpeaking, speak, startListening, currentLangCode]);

  useEffect(() => {
    if (isLoading) {
      cancel();
      if (isListening) stopListening();
      return;
    }
    if (!isVoiceModeActive && callState === 'idle' && recognitionMode !== 'mic-button') {
      cancel();
      if (isListening) stopListening();
    }
  }, [isLoading, isVoiceModeActive, callState, cancel, isListening, stopListening, recognitionMode]);

  useEffect(() => {
    if (isWorkerMode && callState === 'greeting' && !isSpeaking) {
      primeTTS();
      speak("Welcome to the KUMARI health line. Please state your question after the beep.", 'en-IN', () => {
        setTimeout(() => setCallState('listening'), 750);
      });
    }
  }, [isWorkerMode, callState, isSpeaking, speak, primeTTS]);
  
  const handleToggleMicButton = () => {
    primeTTS();
    if (!isListening) {
        setRecognitionMode('mic-button');
    }
    toggleListening(currentLangCode);
  };

  const handleFeedback = (messageId: string, isHelpful: boolean) => {
    setMessages(
      messages.map((msg) =>
        msg.id === messageId ? { ...msg, isHelpful } : msg
      )
    );
  };

  const handleConsent = async (userConsent: boolean) => {
    setConsent(userConsent);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.SYSTEM, content: `User consent ${userConsent ? 'given' : 'denied'}.` }]);

    if (userConsent) {
      const backendUrl = '/api/conversations/';
      const conversationData = {
        user_age: userProfile.age,
        user_location: userProfile.location,
        consent_given: true,
        messages: messages.map(({ role, content, isHelpful }) => ({
          role,
          content,
          is_helpful: isHelpful,
        })),
      };

      try {
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conversationData),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        console.log('Conversation saved successfully:', result);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.SYSTEM, content: 'Conversation history saved anonymously.' }]);
      } catch (error) {
        console.error('Failed to save conversation:', error);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.SYSTEM, content: 'Could not save conversation history to the server.' }]);
      }
    }
  };

  const handleToggleWorkerMode = () => {
    const newWorkerMode = !isWorkerMode;
    setIsWorkerMode(newWorkerMode);
    setMessages([
        { id: 'initial-greeting', role: Role.BOT, content: newWorkerMode ? "Panchayat Worker mode activated." : "Switched back to direct chat. Hi Dear! How can I help?" }
    ]);
    resetCall();
    setIsSystemReady(false);
  };

  const handlePrepareSystem = () => {
    setIsSystemReady(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.SYSTEM, content: 'Phone system is now ready to simulate calls.' }]);
  };
  
  const handleSimulateCall = () => {
    setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.SYSTEM, content: 'Simulating incoming call...' }]);
    setCallState('ringing');
    
    setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.SYSTEM, content: 'Call answered.' }]);
        setCallState('greeting');
    }, 2000);
  };

  const handleEndCall = () => {
    setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.SYSTEM, content: 'Call ended by worker.' }]);
    resetCall();
  };
  
  const handleStartVoiceMode = () => {
      primeTTS();
      setIsVoiceModeActive(true);
      setRecognitionMode('call');
      const greeting = "Hi, how can I help you today?";
      setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.SYSTEM, content: 'Voice call started.' }]);
      setLatestBotResponse({ id: 'voice-greeting', content: greeting, langCode: 'en-IN' });
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-screen font-sans bg-slate-50">
        <div className="w-full max-w-lg h-full md:h-[90vh] md:max-h-[800px] bg-white rounded-lg shadow-2xl flex flex-col">
          <Auth onAuthSuccess={handleAuthSuccess} />
        </div>
      </div>
    );
  }
  
  if (showOnboarding) {
    return (
        <div className="flex justify-center items-center h-screen font-sans bg-slate-50">
            <div className="w-full max-w-lg h-full md:h-[90vh] md:max-h-[800px] bg-white rounded-lg shadow-2xl flex flex-col">
                <Onboarding onComplete={handleOnboardingComplete} />
            </div>
        </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen font-sans bg-slate-50">
        <div className="w-full max-w-lg h-full md:h-[90vh] md:max-h-[800px] bg-white rounded-lg shadow-2xl flex flex-col">
            <ChatInterface
                messages={messages}
                isLoading={isLoading}
                onSend={() => handleSendMessage(inputValue)}
                onFeedback={handleFeedback}
                consent={consent}
                onConsent={handleConsent}
                isWorkerMode={isWorkerMode}
                onToggleWorkerMode={handleToggleWorkerMode}
                onSimulateCall={handleSimulateCall}
                onEndCall={handleEndCall}
                callState={callState}
                isVoiceModeActive={isVoiceModeActive}
                onStartVoiceMode={handleStartVoiceMode}
                onEndVoiceMode={endVoiceMode}
                isSpeaking={isSpeaking}
                isListening={isListening && recognitionMode === 'call'}
                isSystemReady={isSystemReady}
                onPrepareSystem={handlePrepareSystem}
                hasSpeechRecognition={hasSpeechRecognition}
                onToggleMicButton={handleToggleMicButton}
                isMicButtonListening={isListening && recognitionMode === 'mic-button'}
                micError={micError}
                inputValue={inputValue}
                onInputChange={setInputValue}
                onLogout={handleLogout}
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
            />
        </div>
    </div>
  );
};

export default App;
