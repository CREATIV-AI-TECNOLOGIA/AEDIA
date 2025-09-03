import { useState, useRef, useCallback, useEffect } from 'react';

interface UseNativeScannerOptions {
  onImageCaptured?: (imageBase64: string) => void;
  onError?: (error: string) => void;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

interface UseNativeScannerReturn {
  isProcessing: boolean;
  error: string | null;
  capturedImage: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  triggerCapture: () => void;
  retake: () => void;
  clearError: () => void;
}

export const useNativeScanner = (options: UseNativeScannerOptions = {}): UseNativeScannerReturn => {
  const {
    onImageCaptured,
    onError,
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calcular dimensões mantendo proporção
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          // Configurar canvas
          canvas.width = width;
          canvas.height = height;

          if (!ctx) {
            reject(new Error('Não foi possível criar contexto do canvas'));
            return;
          }

          // Desenhar e otimizar imagem
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Aplicar filtros básicos para melhorar qualidade do documento
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;

          // Aumentar contraste para documentos
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Aplicar contraste
            const factor = 1.2;
            data[i] = Math.min(255, Math.max(0, (r - 128) * factor + 128));
            data[i + 1] = Math.min(255, Math.max(0, (g - 128) * factor + 128));
            data[i + 2] = Math.min(255, Math.max(0, (b - 128) * factor + 128));
          }

          ctx.putImageData(imageData, 0, 0);

          // Converter para base64
          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'));
      };

      img.src = URL.createObjectURL(file);
    });
  }, [quality, maxWidth, maxHeight]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 Evento de seleção de arquivo disparado');
    console.log('📸 Event target:', event.target);
    console.log('📸 Files length:', event.target.files?.length);
    
    const file = event.target.files?.[0];
    if (!file) {
      console.log('❌ Nenhum arquivo selecionado');
      console.log('❌ Event.target.files:', event.target.files);
      return;
    }

    console.log('📁 Arquivo selecionado:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Por favor, selecione apenas arquivos de imagem';
      console.error('❌ Tipo de arquivo inválido:', file.type);
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = 'Imagem muito grande. Máximo 10MB';
      console.error('❌ Arquivo muito grande:', file.size);
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('🔄 Iniciando processamento da imagem...');
      const processedImage = await processImage(file);
      
      console.log('✅ Imagem processada com sucesso, tamanho base64:', processedImage.length);
      console.log('✅ Preview da imagem:', processedImage.substring(0, 100) + '...');
      
      // Definir estado primeiro
      setCapturedImage(processedImage);
      console.log('✅ Estado capturedImage atualizado');
      
      // Chamar callback com delay para garantir que o estado seja atualizado
      setTimeout(() => {
        console.log('📤 Enviando imagem processada via callback');
        console.log('📤 Callback onImageCaptured existe?', !!onImageCaptured);
        onImageCaptured?.(processedImage);
        console.log('📤 Callback executado');
      }, 200);

    } catch (error) {
      console.error('❌ Erro ao processar imagem:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao processar imagem';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      console.log('🏁 Finalizando processamento, setIsProcessing(false)');
      setIsProcessing(false);
    }
  }, [processImage, onImageCaptured, onError]);

  // Conectar o evento onChange ao input quando ele estiver disponível
  useEffect(() => {
    const input = fileInputRef.current;
    if (input) {
      console.log('🔗 Conectando evento onChange ao input file');
      
      // Remover listener anterior se existir
      input.removeEventListener('change', handleFileSelect as any);
      
      // Adicionar novo listener
      input.addEventListener('change', handleFileSelect as any);
      
      return () => {
        console.log('🔌 Desconectando evento onChange do input file');
        input.removeEventListener('change', handleFileSelect as any);
      };
    }
  }, [handleFileSelect]);

  const triggerCapture = useCallback(() => {
    console.log('📷 Disparando captura da câmera nativa');
    
    // Limpar estado anterior
    setError(null);
    setCapturedImage(null);
    
    if (fileInputRef.current) {
      // Limpar valor anterior para permitir selecionar o mesmo arquivo novamente
      fileInputRef.current.value = '';
      fileInputRef.current.click();
      console.log('✅ Input file clicado com sucesso');
    } else {
      console.error('❌ Ref do input file não está disponível');
      setError('Erro interno: câmera não disponível');
    }
  }, []);

  const retake = useCallback(() => {
    console.log('🔄 Resetando captura');
    setCapturedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isProcessing,
    error,
    capturedImage,
    fileInputRef,
    triggerCapture,
    retake,
    clearError
  };
}; 