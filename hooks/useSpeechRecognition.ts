import { useState, useEffect, useRef, useCallback } from 'react';

// TypeScript interfaces for the Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}

export const useSpeechRecognition = (
  onFinalTranscript: (transcript: string) => void,
  onInterimTranscript?: (transcript: string) => void,
  onRecognitionError?: (error: string) => void,
) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Use refs to store the latest callbacks to prevent stale closures.
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const onInterimTranscriptRef = useRef(onInterimTranscript);
  const onRecognitionErrorRef = useRef(onRecognitionError);

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
    onInterimTranscriptRef.current = onInterimTranscript;
    onRecognitionErrorRef.current = onRecognitionError;
  }, [onFinalTranscript, onInterimTranscript, onRecognitionError]);

  // Cleanup effect to stop recognition if the component unmounts.
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback((lang: string = 'en-IN') => {
    if (isListening) {
      console.warn("Already listening, startListening call ignored.");
      return;
    }
    
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("Speech Recognition is not supported by this browser.");
      onRecognitionErrorRef.current?.('not-supported');
      return;
    }

    // Abort any previous instance, just in case it's stuck.
    if (recognitionRef.current) {
        recognitionRef.current.abort();
    }

    // Create a fresh recognition instance for each listening attempt.
    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;

    let finalTranscript = '';
    let errorReported = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      onInterimTranscriptRef.current?.(interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      errorReported = true;
      onRecognitionErrorRef.current?.(event.error);
    };

    recognition.onend = () => {
      // Prevent onend from a stale, aborted instance from running.
      if (recognitionRef.current !== recognition) {
        return;
      }

      setIsListening(false);
      recognitionRef.current = null; // This instance is now finished.

      if (finalTranscript) {
        onFinalTranscriptRef.current(finalTranscript);
      } else if (!errorReported) {
        // This is the 'no-speech' case
        onRecognitionErrorRef.current?.('no-speech');
      }
    };
    
    try {
      onInterimTranscriptRef.current?.(''); // Clear previous interim results
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error("Error starting speech recognition:", e);
      onRecognitionErrorRef.current?.('start-failed');
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [isListening]); // Dependency on isListening prevents concurrent starts.

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      // isListening will be set to false in the onend handler.
    }
  }, [isListening]);
  
  const toggleListening = useCallback((lang: string = 'en-IN') => {
    if (isListening) {
      stopListening();
    } else {
      startListening(lang);
    }
  }, [isListening, startListening, stopListening]);

  return { isListening, toggleListening, startListening, stopListening };
};