
import React, { useRef, useEffect } from 'react';
import { Message, SUPPORTED_LANGUAGES } from '../types';
import { SendIcon, MicrophoneIcon, HeartIcon, WorkerIcon, PhoneIcon, PhoneHangUpIcon, LogoutIcon, GlobeIcon } from './icons';
import ChatMessage from './ChatMessage';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSend: () => void;
  onFeedback: (messageId: string, isHelpful: boolean) => void;
  consent: boolean | null;
  onConsent: (consent: boolean) => void;
  isWorkerMode: boolean;
  onToggleWorkerMode: () => void;
  onSimulateCall: () => void;
  onEndCall: () => void;
  callState: 'idle' | 'ringing' | 'greeting' | 'listening' | 'processing' | 'responded';
  isVoiceModeActive: boolean;
  onStartVoiceMode: () => void;
  onEndVoiceMode: () => void;
  isSpeaking: boolean;
  isListening: boolean;
  isSystemReady: boolean;
  onPrepareSystem: () => void;
  hasSpeechRecognition: boolean;
  onToggleMicButton: () => void;
  isMicButtonListening: boolean;
  micError: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onLogout: () => void;
  selectedLanguage: string;
  onLanguageChange: (langCode: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, isLoading, onSend, onFeedback, consent, onConsent, 
  isWorkerMode, onToggleWorkerMode, onSimulateCall, onEndCall, callState,
  isVoiceModeActive, onStartVoiceMode, onEndVoiceMode, isSpeaking, isListening,
  isSystemReady, onPrepareSystem, hasSpeechRecognition, onToggleMicButton,
  isMicButtonListening, micError, inputValue, onInputChange, onLogout,
  selectedLanguage, onLanguageChange
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const VoiceStatusIndicator = () => (
    <div className="flex items-center justify-center gap-3 text-center p-3 bg-slate-700 text-white rounded-full max-w-xs mx-auto">
        {isSpeaking && (
            <>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Speaking...</span>
            </>
        )}
        {isListening && !isSpeaking && (
            <>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Listening...</span>
            </>
        )}
        {isLoading && !isSpeaking && !isListening && (
           <>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span>Thinking...</span>
            </>
        )}
    </div>
  );

  const selectedLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <header className="bg-white border-b border-slate-200 p-3 sm:p-4 flex flex-col gap-2.5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-pink-500 flex-shrink-0 flex items-center justify-center shadow-sm">
                <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white"/>
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-800 truncate">KUMARI Health</h1>
                  {selectedLanguage !== 'auto' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-pink-50 text-pink-700 border border-pink-200">
                      {selectedLangObj.nativeLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {isWorkerMode ? 'Panchayat Worker Mode' : 'Adolescent health & well-being assistant'}
                </p>
                {isWorkerMode && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${isSystemReady ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                      <span>Phone: {isSystemReady ? 'Ready' : 'Offline'}</span>
                      <span className="text-slate-300">|</span>
                      <PhoneIcon className="w-3 h-3"/>
                      <span>Line: 8170981154</span>
                  </div>
                )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Language Selection Dropdown */}
            <div className="relative flex items-center">
              <div className="flex items-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 sm:py-1.5 transition-colors focus-within:ring-2 focus-within:ring-pink-500 focus-within:border-pink-500">
                <GlobeIcon className="w-4 h-4 text-pink-600 mr-1.5 flex-shrink-0" />
                <select
                  id="language-select-dropdown"
                  value={selectedLanguage}
                  onChange={(e) => onLanguageChange(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none pr-1"
                  aria-label="Select response language"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="text-slate-800 bg-white">
                      {lang.code === 'auto' ? `🌐 ${lang.label}` : `${lang.nativeLabel} (${lang.label})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={onToggleWorkerMode} 
              className={`p-2 rounded-lg transition-colors ${isWorkerMode ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} 
              aria-label="Toggle Worker Mode"
              title={isWorkerMode ? "Worker Mode Active" : "Switch to Worker Mode"}
            >
              <WorkerIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
            </button>
            <button 
              onClick={onLogout} 
              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors" 
              aria-label="Logout"
              title="Log out"
            >
              <LogoutIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onFeedback={onFeedback} />
        ))}
        {isLoading && callState !== 'processing' && !isVoiceModeActive && (
          <div className="flex items-end gap-2 justify-start">
             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-sm">K</div>
             <div className="max-w-md lg:max-w-lg px-4 py-3 rounded-2xl bg-white text-gray-800 rounded-bl-none">
                 <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-pink-300 rounded-full animate-pulse delay-0"></span>
                    <span className="w-2 h-2 bg-pink-300 rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-pink-300 rounded-full animate-pulse delay-300"></span>
                 </div>
             </div>
          </div>
        )}
        { consent === null && messages.some(m => m.isHelpful !== null) && !isLoading && (
            <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200 text-center">
                <p className="text-sm text-slate-700 mb-3">
                  {isWorkerMode 
                    ? "Ask for user's consent: 'Is it okay to store this conversation anonymously to improve the system?'"
                    : "To help me learn and improve, can I save this conversation anonymously?"
                  }
                </p>
                <div className="flex justify-center gap-3">
                    <button onClick={() => onConsent(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold">Yes / Consent Given</button>
                    <button onClick={() => onConsent(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-semibold">No / Consent Denied</button>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-white border-t border-slate-200 p-2 md:p-4">
        {isWorkerMode && callState === 'idle' && (
          <div className="max-w-3xl mx-auto mb-2 space-y-2">
            {!isSystemReady ? (
              <div className="p-3 bg-slate-100 rounded-lg text-center">
                  <p className="text-sm text-slate-700 mb-3">The phone system is offline. Prepare the system to simulate incoming calls.</p>
                  <button
                    onClick={onPrepareSystem}
                    className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform duration-150 ease-in-out hover:scale-105"
                  >
                    Prepare Phone System
                  </button>
              </div>
            ) : (
              <button 
                onClick={onSimulateCall}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform duration-150 ease-in-out hover:scale-105"
              >
                <PhoneIcon className="w-5 h-5"/> Simulate Incoming Call
              </button>
            )}
          </div>
        )}

        {isWorkerMode && callState === 'responded' && (
           <div className="max-w-3xl mx-auto flex gap-2 mb-2 items-center">
            <div className="flex-1 text-center p-3 text-sm text-slate-600 bg-slate-100 rounded-lg flex items-center justify-center gap-2">
                {isSpeaking ? (
                    <>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>Reading response aloud...</span>
                    </>
                ) : (
                    <>
                        <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                        <span>Response complete. Ready to end call.</span>
                    </>
                )}
            </div>
            <button onClick={onEndCall} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
              <PhoneHangUpIcon className="w-5 h-5"/> End Call
            </button>
          </div>
        )}

        {isVoiceModeActive && !isWorkerMode && (
          <div className="max-w-3xl mx-auto flex flex-col items-center gap-2">
            <VoiceStatusIndicator />
            <button onClick={onEndVoiceMode} className="mt-2 text-sm text-red-500 hover:text-red-700">End Call</button>
          </div>
        )}

        {micError && <div className="text-center text-red-500 text-sm mb-2 px-4">{micError}</div>}
        
        {(!isWorkerMode || (isWorkerMode && (callState === 'idle' || callState === 'responded'))) && !isVoiceModeActive && (
            <div className="flex items-center gap-2 max-w-3xl mx-auto">
               {!isWorkerMode && (
                 <button 
                    onClick={onStartVoiceMode} 
                    className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed" 
                    aria-label="Start voice call"
                    disabled={!hasSpeechRecognition}
                    title={hasSpeechRecognition ? "Start voice call" : "Voice input is not supported by your browser"}
                  >
                    <PhoneIcon className="w-6 h-6" />
                 </button>
               )}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isWorkerMode ? "Or, type a follow-up question..." : "Type your question or use the mic..."}
                className="flex-1 w-full p-3 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                disabled={isLoading || isMicButtonListening}
              />
              {hasSpeechRecognition && (
                <button 
                  onClick={onToggleMicButton}
                  className={`p-3 rounded-full transition-colors ${isMicButtonListening ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                  aria-label={isMicButtonListening ? 'Stop listening' : 'Start listening'}
                  >
                  <MicrophoneIcon className="w-6 h-6" />
                </button>
              )}
              <button 
                onClick={onSend}
                disabled={!inputValue.trim() || isLoading}
                className="p-3 bg-blue-500 text-white rounded-full disabled:bg-blue-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                aria-label="Send message"
                >
                <SendIcon className="w-6 h-6" />
              </button>
            </div>
        )}
      </footer>
    </div>
  );
};

export default ChatInterface;
