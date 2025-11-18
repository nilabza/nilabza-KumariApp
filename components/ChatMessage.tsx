
import React from 'react';
import { Message, Role } from '../types';
import { ThumbsUpIcon, ThumbsDownIcon } from './icons';

interface ChatMessageProps {
  message: Message;
  onFeedback?: (messageId: string, isHelpful: boolean) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onFeedback }) => {
  const isUser = message.role === Role.USER;
  const isBot = message.role === Role.BOT;
  const isSystem = message.role === Role.SYSTEM;

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="text-center text-xs text-gray-500 bg-gray-200 rounded-full px-3 py-1">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-sm">
          K
        </div>
      )}
      <div className={`max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${isUser ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        {isBot && onFeedback && (
          <div className="flex items-center justify-end mt-2 gap-2">
             <span className="text-xs text-gray-500">Was this helpful?</span>
            <button
              onClick={() => onFeedback(message.id, true)}
              className={`p-1 rounded-full transition-colors ${message.isHelpful === true ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-gray-100'}`}
              aria-label="Helpful"
            >
              <ThumbsUpIcon className="w-4 h-4" />
            </button>
            <button
               onClick={() => onFeedback(message.id, false)}
               className={`p-1 rounded-full transition-colors ${message.isHelpful === false ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-100'}`}
               aria-label="Not helpful"
            >
              <ThumbsDownIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
