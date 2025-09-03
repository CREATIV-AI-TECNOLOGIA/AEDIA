import React from 'react';
import { Info, MessageSquare, Brain, Settings, History } from 'lucide-react';

interface TokenBreakdownPanelProps {
  isVisible: boolean;
}

const TokenBreakdownPanel: React.FC<TokenBreakdownPanelProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
          <Info className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-blue-800 mb-3">
            🔍 Por que os tokens de entrada são diferentes do tokenizer?
          </h4>
          
          <div className="space-y-3 text-sm text-blue-700">
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <h5 className="font-medium mb-2 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Tokens de Entrada (Prompt) incluem:
              </h5>
              <ul className="space-y-1 ml-6">
                <li className="flex items-center">
                  <Settings className="w-3 h-3 mr-2 text-gray-500" />
                  <span><strong>Prompt do Sistema:</strong> Instruções da persona ativa (~500-1000 tokens)</span>
                </li>
                <li className="flex items-center">
                  <History className="w-3 h-3 mr-2 text-gray-500" />
                  <span><strong>Histórico da Conversa:</strong> Todas as mensagens anteriores</span>
                </li>
                <li className="flex items-center">
                  <MessageSquare className="w-3 h-3 mr-2 text-gray-500" />
                  <span><strong>Mensagem Atual:</strong> Sua pergunta/texto</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <h5 className="font-medium mb-2 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                Tokens de Saída incluem:
              </h5>
              <ul className="space-y-1 ml-6">
                <li className="flex items-center">
                  <Brain className="w-3 h-3 mr-2 text-gray-500" />
                  <span><strong>Resposta da IA:</strong> Apenas o texto gerado pela IA</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h5 className="font-medium text-yellow-800 mb-2">💡 Exemplo Prático:</h5>
              <div className="text-yellow-700 space-y-1">
                <p><strong>Tokenizer isolado:</strong> "Como criar um plano de aula?" = ~8 tokens</p>
                <p><strong>API real:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• Prompt sistema: ~800 tokens</li>
                  <li>• Histórico (3 msgs): ~200 tokens</li>
                  <li>• Mensagem atual: ~8 tokens</li>
                  <li>• <strong>Total entrada: ~1008 tokens</strong></li>
                </ul>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h5 className="font-medium text-green-800 mb-2">✅ Nossos dados são precisos!</h5>
              <p className="text-green-700">
                Usamos os valores <strong>reais</strong> retornados pela API OpenAI, 
                que incluem todo o contexto necessário para manter a conversa inteligente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenBreakdownPanel; 