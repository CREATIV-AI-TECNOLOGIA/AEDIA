import React from 'react';
import { Brain, Wifi, WifiOff } from 'lucide-react';

interface ChatStatusIndicatorProps {
  isOnline: boolean;
  isTyping: boolean;
  personaName?: string;
}

const ChatStatusIndicator: React.FC<ChatStatusIndicatorProps> = ({
  isOnline,
  isTyping,
  personaName
}) => {
  return (
    <div className="flex items-center space-x-2 text-sm">
      {/* Indicador de conexão */}
      <div className="flex items-center space-x-1">
        {isOnline ? (
          <Wifi className="w-3 h-3 text-green-500" />
        ) : (
          <WifiOff className="w-3 h-3 text-red-500" />
        )}
        <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Indicador de digitação */}
      {isTyping && isOnline && (
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-xs text-blue-600">
            {personaName || 'Assistente'} está digitando...
          </span>
        </div>
      )}
    </div>
  );
};

export default ChatStatusIndicator; 