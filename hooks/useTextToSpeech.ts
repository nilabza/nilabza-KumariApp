import { useState, useEffect, useCallback } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const handleVoicesChanged = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    handleVoicesChanged();

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string, lang: string = 'en-IN', onEnd?: () => void) => {
    if (!text || !window.speechSynthesis) {
      onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    
    const languageSpecificFemaleVoice = voices.find(v => v.lang === lang && v.name.toLowerCase().includes('female'));
    const languageDefaultVoice = voices.find(v => v.lang === lang);
    const languageGenericVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    
    utterance.voice = languageSpecificFemaleVoice || languageDefaultVoice || languageGenericVoice || null;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
        // "interrupted" is a normal event when speech is cancelled by a new call to `speak` or `cancel`.
        // We log it for debugging but don't treat it as a critical error.
        if (e.error === 'interrupted') {
            console.log(`Speech synthesis was interrupted. This is usually a normal part of the conversation flow.`);
        } else {
            console.error("Speech synthesis error:", e.error);
        }
        setIsSpeaking(false);
        onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const cancel = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  /**
   * Primes the TTS engine. Some browsers require a user gesture to initialize 
   * speech synthesis, and this can prevent the first `speak()` call from working.
   * Speaking a silent utterance helps "wake up" the engine.
   */
  const primeTTS = useCallback(() => {
      if (!window.speechSynthesis) return;
      // If voices are not loaded yet, speak a blank utterance to trigger loading and then cancel.
      if (window.speechSynthesis.getVoices().length === 0) {
          const utterance = new SpeechSynthesisUtterance('');
          window.speechSynthesis.speak(utterance);
          window.speechSynthesis.cancel();
      }
  }, []);

  return { isSpeaking, speak, cancel, primeTTS };
};
