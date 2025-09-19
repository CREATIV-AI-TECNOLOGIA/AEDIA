import React, { useState, useRef } from 'react';
import { PromptInputBox } from './ai-prompt-box';

// Exemplo de como integrar o PromptInputBox na página Chat.tsx
// Este componente substitui a interface atual mantendo as mesmas funcionalidades

interface ChatIntegrationExampleProps {
  // Props que vêm do Chat.tsx
  inputValue: string;
  setInputValue: (value: string) => void;
  isLoading: boolean;
  isListening: boolean;
  webSearchEnabled: boolean;
  activePersona: any;
  handleSubmit: () => void;
  startListening: () => void;
  stopListening: () => void;
  setWebSearchEnabled: (enabled: boolean) => void;
  setShowPersonaConfig: (show: boolean) => void;
  showPersonaConfig: boolean;
}

export const ChatIntegrationExample: React.FC<ChatIntegrationExampleProps> = ({
  inputValue,
  setInputValue,
  isLoading,
  isListening,
  webSearchEnabled,
  activePersona,
  handleSubmit,
  startListening,
  stopListening,
  setWebSearchEnabled,
  setShowPersonaConfig,
  showPersonaConfig
}) => {
  const handleSend = (message: string, files?: File[]) => {
    // Atualiza o inputValue e chama handleSubmit
    setInputValue(message);
    handleSubmit();
  };

  const handleSettingsClick = () => {
    setShowPersonaConfig(!showPersonaConfig);
  };

  const handleWebSearchToggle = () => {
    setWebSearchEnabled(!webSearchEnabled);
  };

  return (
    <div className="relative w-full">
      <PromptInputBox
        onSend={handleSend}
        isLoading={isLoading}
        placeholder="Envie uma mensagem"
        className="w-full"
        // Funcionalidades da interface atual
        onSettingsClick={handleSettingsClick}
        webSearchEnabled={webSearchEnabled}
        onWebSearchToggle={handleWebSearchToggle}
        isListening={isListening}
        onStartListening={startListening}
        onStopListening={stopListening}
      />
      
      {/* Indicador de Persona Ativa */}
      {activePersona && (
        <div className="mt-3 text-center">
          <span className="text-xs text-gray-500">
            Conversando com {activePersona.name}
          </span>
        </div>
      )}
    </div>
  );
};

// Exemplo de como substituir na Chat.tsx:
/*
// Substitua esta seção na Chat.tsx (linhas ~790-870):

// ANTES:
<div className="relative bg-white rounded-2xl border-2 border-gray-300 hover:border-gray-400 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 w-full shadow-lg p-2">
  <textarea
    ref={inputRef}
    value={inputValue}
    onChange={handleInputChange}
    onKeyDown={handleKeyDown}
    placeholder="Envie uma mensagem"
    disabled={isLoading}
    className="w-full p-4 pr-20 resize-none border-0 bg-transparent focus:outline-none text-gray-800 placeholder-gray-400 h-[60px]"
    style={{ scrollbarWidth: 'none' }}
  />
  // ... todos os botões ...
</div>

// DEPOIS:
<ChatIntegrationExample
  inputValue={inputValue}
  setInputValue={setInputValue}
  isLoading={isLoading}
  isListening={isListening}
  webSearchEnabled={webSearchEnabled}
  activePersona={activePersona}
  handleSubmit={handleSubmit}
  startListening={startListening}
  stopListening={stopListening}
  setWebSearchEnabled={setWebSearchEnabled}
  setShowPersonaConfig={setShowPersonaConfig}
  showPersonaConfig={showPersonaConfig}
/>
*/