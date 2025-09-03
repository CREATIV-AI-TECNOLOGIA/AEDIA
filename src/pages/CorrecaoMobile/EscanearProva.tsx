import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, Send, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { provasService } from '../../services/provasService';

interface EscanearProvaProps {
  turmaId?: string;
}

const EscanearProva: React.FC<EscanearProvaProps> = ({ turmaId }) => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Log de renderização
  console.log('🔄 EscanearProva renderizado:', {
    turmaId,
    hasImage: !!selectedImage,
    uploading,
    success,
    error
  });

  // Prevenir navegações indesejadas
  useEffect(() => {
    console.log('🔒 Componente EscanearProva montado');
    
    const handlePopState = (event: PopStateEvent) => {
      console.log('⚠️ Tentativa de navegação detectada:', event);
      if (selectedImage && !success) {
        console.log('🛑 Prevenindo navegação - imagem selecionada mas não enviada');
        event.preventDefault();
        window.history.pushState(null, '', window.location.href);
        return false;
      }
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (selectedImage && !success) {
        console.log('🛑 Prevenindo saída - imagem selecionada mas não enviada');
        event.preventDefault();
        event.returnValue = 'Você tem uma imagem selecionada. Tem certeza que deseja sair?';
        return event.returnValue;
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      console.log('🔓 Componente EscanearProva desmontado');
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [selectedImage, success]);

  // Função para selecionar imagem
  const handleImageSelect = () => {
    console.log('🎯 Iniciando seleção de imagem...');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    // Usar addEventListener ao invés de onchange
    input.addEventListener('change', async (event) => {
      console.log('📁 Evento change disparado');
      
      const target = event.target as HTMLInputElement;
      const files = target.files;
      
      console.log('📋 Files:', files?.length, files?.[0]?.name);
      
      if (files && files.length > 0) {
        const file = files[0];
        console.log('📄 Arquivo:', {
          nome: file.name,
          tamanho: file.size,
          tipo: file.type
        });
        
        try {
          console.log('🔄 Convertendo para base64...');
          
          // Usar Promise para FileReader
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = () => {
              console.log('✅ FileReader concluído');
              resolve(reader.result as string);
            };
            
            reader.onerror = () => {
              console.error('❌ Erro no FileReader');
              reject(new Error('Erro ao ler arquivo'));
            };
            
            reader.readAsDataURL(file);
          });
          
          console.log('📊 Base64:', {
            tamanho: base64.length,
            valido: base64.startsWith('data:image/')
          });
          
          if (base64.startsWith('data:image/')) {
            console.log('🎉 Definindo imagem...');
            setSelectedImage(base64);
            setError(null);
            console.log('✅ Imagem definida!');
          } else {
            console.error('❌ Base64 inválido');
            setError('Formato de imagem inválido');
          }
          
        } catch (error) {
          console.error('❌ Erro na conversão:', error);
          setError('Erro ao processar imagem');
        }
      } else {
        console.log('⚠️ Nenhum arquivo');
      }
    });
    
    // Adicionar ao DOM temporariamente para garantir que funcione
    input.style.display = 'none';
    document.body.appendChild(input);
    
    console.log('📱 Clicando no input...');
    input.click();
    
    // Remover após uso
    setTimeout(() => {
      document.body.removeChild(input);
    }, 1000);
  };

  // Função para enviar para processamento
  const handleSendForProcessing = async () => {
    if (!selectedImage) return;
    
    setUploading(true);
    setError(null);
    
    try {
      console.log('🚀 Iniciando envio da prova...');
      console.log('📊 Dados do envio:', {
        turmaId,
        imagemTamanho: selectedImage.length,
        imagemTipo: selectedImage.substring(0, 30)
      });
      
      // Dados simulados do professor (em produção, vir do contexto de autenticação)
      const professorId = 1; // ID do professor logado
      const escolaId = 1; // ID da escola
      const disciplinaId = 1; // ID da disciplina (Matemática)
      const turmaIdNum = parseInt(turmaId || '1'); // Converter para número
      
      const titulo = `Prova ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`;
      
      // Processar prova usando o serviço real
      const resultado = await provasService.processarProva(
        selectedImage,
        professorId,
        turmaIdNum,
        disciplinaId,
        escolaId,
        titulo
      );
      
      console.log('✅ Prova processada com sucesso:', {
        provaId: resultado.prova.id,
        sessaoId: resultado.sessao.id,
        imagemUrl: resultado.prova.imagem_url
      });
      
      setSuccess(true);
      
      // Redirecionar para tela de correções após 3 segundos
      setTimeout(() => {
        console.log('🔄 Redirecionando para correções...');
        navigate('/correcoes-avaliacoes', {
          state: {
            message: 'Prova enviada com sucesso!',
            provaId: resultado.prova.id
          }
        });
      }, 3000);
      
      /* TODO: Implementar envio real quando Edge Function estiver pronta
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/processar-prova`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          imagem: selectedImage,
          turmaId: turmaId
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSuccess(true);
        console.log('✅ Prova processada:', result);
        setTimeout(() => {
          navigate('/correcoes');
        }, 2000);
      } else {
        throw new Error(result.error || 'Erro ao processar prova');
      }
      */
      
    } catch (error) {
      console.error('❌ Erro no envio:', error);
      setError('Erro ao enviar prova. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  // Função para remover imagem
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setError(null);
    setSuccess(false);
  };

  // Função de debug
  const debugState = () => {
    console.log('🔍 DEBUG ESTADO ATUAL:');
    console.log('selectedImage:', !!selectedImage, selectedImage?.substring(0, 50));
    console.log('uploading:', uploading);
    console.log('success:', success);
    console.log('error:', error);
    
    alert(`DEBUG ESTADO:
selectedImage: ${!!selectedImage ? 'SIM' : 'NÃO'}
uploading: ${uploading ? 'SIM' : 'NÃO'}
success: ${success ? 'SIM' : 'NÃO'}
error: ${error || 'NENHUM'}
tamanho: ${selectedImage?.length || 0}`);
  };

  // Função para voltar com confirmação
  const handleGoBack = () => {
    console.log('🔙 Tentativa de voltar');
    
    if (selectedImage && !success) {
      const confirmExit = window.confirm('Você tem uma imagem selecionada. Tem certeza que deseja voltar?');
      if (!confirmExit) {
        console.log('🛑 Usuário cancelou a saída');
        return;
      }
    }
    
    console.log('✅ Navegando de volta');
    navigate(-1);
  };

  // Função de teste super simples
  const testeUltraSimples = () => {
    console.log('🧪 TESTE ULTRA SIMPLES');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        console.log('📁 Arquivo:', file.name);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const result = e.target.result;
          console.log('✅ Base64 gerado');
          setSelectedImage(result);
          alert('SUCESSO! Imagem definida!');
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <h1 className="text-lg font-semibold">Enviar Prova</h1>
        <div className="w-16"></div>
      </div>

      <div className="p-6">
        {/* Debug visual */}
        <div className="bg-black/20 rounded-lg p-3 mb-4 text-xs">
          <div className="flex justify-between">
            <span>selectedImage: {selectedImage ? '✅' : '❌'}</span>
            <span>uploading: {uploading ? '✅' : '❌'}</span>
            <span>success: {success ? '✅' : '❌'}</span>
          </div>
          {selectedImage && (
            <div className="mt-1 text-green-300">
              Tamanho: {Math.round(selectedImage.length / 1024)}KB
            </div>
          )}
        </div>

        {/* Instruções */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-center">📸 Como Enviar sua Prova</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
              <p>Tire uma foto da prova com boa iluminação</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
              <p>Certifique-se que o texto está legível</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
              <p>Envie para nosso sistema processar</p>
            </div>
          </div>
        </div>

        {/* Área de upload/preview */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
          {!selectedImage ? (
            // Estado inicial - sem imagem
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Upload className="w-12 h-12 text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Selecionar Foto da Prova</h3>
              <p className="text-white/70 mb-6">
                Tire uma foto ou selecione uma imagem da galeria
              </p>
              <button
                onClick={handleImageSelect}
                className="w-full bg-blue-500 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-600 transition-colors"
              >
                📱 Selecionar Foto
              </button>
              
              {/* Botão de teste ultra simples */}
              <button
                onClick={testeUltraSimples}
                className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-lg hover:bg-red-600 transition-colors mt-2"
              >
                🧪 TESTE ULTRA SIMPLES
              </button>
              
              {/* Botão de debug */}
              <button
                onClick={debugState}
                className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg font-semibold text-sm shadow-lg hover:bg-purple-600 transition-colors mt-2"
              >
                🔍 DEBUG ESTADO
              </button>
            </div>
          ) : (
            // Estado com imagem selecionada
            <div>
              <div className="relative mb-4">
                <img
                  src={selectedImage}
                  alt="Prova selecionada"
                  className="w-full rounded-lg shadow-lg"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {success ? (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-400 mb-2">✅ Prova Enviada com Sucesso!</h3>
                  <p className="text-white/70 mb-2">A prova foi salva e aparecerá na lista de correções.</p>
                  <p className="text-white/50 text-sm">Redirecionando para correções...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={handleImageSelect}
                    className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    📷 Trocar Foto
                  </button>
                  
                  <button
                    onClick={handleSendForProcessing}
                    disabled={uploading}
                    className={`w-full py-4 px-6 rounded-lg font-semibold text-lg shadow-lg transition-colors ${
                      uploading 
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Enviando...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Send className="w-5 h-5" />
                        Enviar para Correção
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Dicas */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-200 mb-2">💡 Dicas para melhor resultado:</h4>
          <ul className="text-sm text-yellow-100/80 space-y-1">
            <li>• Use boa iluminação natural</li>
            <li>• Mantenha a câmera estável</li>
            <li>• Certifique-se que todo o texto está visível</li>
            <li>• Evite sombras sobre a prova</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EscanearProva; 