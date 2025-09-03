import { useState, useEffect, useRef, useCallback } from 'react';

// Polyfill para navegadores antigos
const getUserMedia = (() => {
  // Tentar APIs modernas primeiro
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  }
  
  // Fallback para APIs antigas
  const legacyGetUserMedia = (navigator as any).getUserMedia ||
                            (navigator as any).webkitGetUserMedia ||
                            (navigator as any).mozGetUserMedia ||
                            (navigator as any).msGetUserMedia;
  
  if (legacyGetUserMedia) {
    // Converter callback para Promise
    return (constraints: MediaStreamConstraints): Promise<MediaStream> => {
      return new Promise((resolve, reject) => {
        legacyGetUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }
  
  return null;
})();

export interface CameraConfig {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  aspectRatio?: number;
}

export interface CameraState {
  isSupported: boolean;
  isActive: boolean;
  stream: MediaStream | null;
  error: string | null;
  isLoading: boolean;
  debugInfo?: string[];
}

export const useCamera = (config: CameraConfig = {}) => {
  const [state, setState] = useState<CameraState>({
    isSupported: false,
    isActive: false,
    stream: null,
    error: null,
    isLoading: false,
    debugInfo: []
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Função para adicionar informações de debug
  const addDebugInfo = useCallback((info: string) => {
    console.log(`[Camera Debug] ${info}`);
    setState(prev => ({
      ...prev,
      debugInfo: [...(prev.debugInfo || []), `${new Date().toLocaleTimeString()}: ${info}`]
    }));
  }, []);

  // Verificação com polyfill
  useEffect(() => {
    const checkSupport = () => {
      addDebugInfo('🔍 Verificação com polyfill...');
      
      if (getUserMedia) {
        addDebugInfo('✅ API de câmera disponível (com polyfill)');
        setState(prev => ({ ...prev, isSupported: true, error: null }));
      } else {
        addDebugInfo('❌ Nenhuma API de câmera encontrada');
        setState(prev => ({ 
          ...prev, 
          isSupported: false,
          error: 'Navegador não suporta câmera'
        }));
      }
    };

    checkSupport();
  }, [addDebugInfo]);

  // Iniciar câmera com polyfill
  const startCamera = useCallback(async () => {
    addDebugInfo('🚀 Iniciando câmera com polyfill...');
    
    if (!getUserMedia) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'API de câmera não disponível'
      }));
      return false;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Configurações simples
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: config.facingMode || 'environment'
        },
        audio: false
      };

      addDebugInfo(`📱 Constraints: ${JSON.stringify(constraints)}`);

      // Usar polyfill
      const stream = await getUserMedia(constraints);
      
      addDebugInfo(`✅ Stream obtido! Tracks: ${stream.getTracks().length}`);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Aguardar carregamento
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('VideoRef perdido'));
            return;
          }

          const video = videoRef.current;
          
          const onLoadedMetadata = () => {
            addDebugInfo(`📹 Vídeo carregado: ${video.videoWidth}x${video.videoHeight}`);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };

          const onError = (e: Event) => {
            addDebugInfo(`❌ Erro no vídeo: ${e}`);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Erro ao carregar vídeo'));
          };

          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          
          // Timeout
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Timeout ao carregar vídeo'));
          }, 10000);
        });
      }

      setState(prev => ({
        ...prev,
        isActive: true,
        stream,
        isLoading: false,
        error: null
      }));

      addDebugInfo('🎉 Câmera iniciada com sucesso!');
      return true;

    } catch (error) {
      addDebugInfo(`❌ Erro: ${error}`);
      
      let errorMessage = 'Erro ao acessar a câmera';
      
      if (error instanceof Error) {
        addDebugInfo(`🔍 Tipo de erro: ${error.name}`);
        
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Permissão negada. Clique em "Permitir" quando solicitado.';
            break;
          case 'NotFoundError':
            errorMessage = 'Câmera não encontrada. Verifique se existe uma câmera no dispositivo.';
            break;
          case 'NotReadableError':
            errorMessage = 'Câmera em uso. Feche outros apps (WhatsApp, Instagram, etc).';
            break;
          case 'OverconstrainedError':
            errorMessage = 'Configurações não suportadas. Tentando configuração mais simples...';
            
            // Tentar novamente com configuração mais básica
            try {
              addDebugInfo('🔄 Tentando configuração básica...');
              const basicStream = await getUserMedia({ video: true, audio: false });
              
              streamRef.current = basicStream;
              if (videoRef.current) {
                videoRef.current.srcObject = basicStream;
              }
              
              setState(prev => ({
                ...prev,
                isActive: true,
                stream: basicStream,
                isLoading: false,
                error: null
              }));
              
              addDebugInfo('✅ Funcionou com configuração básica!');
              return true;
            } catch (basicError) {
              errorMessage = 'Não foi possível acessar a câmera com nenhuma configuração.';
            }
            break;
          case 'SecurityError':
            errorMessage = 'Erro de segurança. Tente recarregar a página.';
            break;
          default:
            errorMessage = `Erro: ${error.message}`;
        }
      }

      setState(prev => ({
        ...prev,
        isActive: false,
        stream: null,
        isLoading: false,
        error: errorMessage
      }));

      addDebugInfo(`💥 Falha final: ${errorMessage}`);
      return false;
    }
  }, [config, addDebugInfo]);

  // Parar câmera
  const stopCamera = useCallback(() => {
    addDebugInfo('🛑 Parando câmera...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
        addDebugInfo(`🔇 Track parado: ${track.kind}`);
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState(prev => ({
      ...prev,
      isActive: false,
      stream: null,
      error: null
    }));

    addDebugInfo('✅ Câmera parada');
  }, [addDebugInfo]);

  // Capturar foto
  const capturePhoto = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      addDebugInfo('📸 Capturando foto...');
      
      if (!videoRef.current || !state.isActive) {
        const error = 'Câmera não está ativa';
        addDebugInfo(`❌ ${error}`);
        reject(new Error(error));
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          const error = 'Canvas não suportado';
          addDebugInfo(`❌ ${error}`);
          reject(new Error(error));
          return;
        }

        const video = videoRef.current;
        
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          const error = 'Vídeo sem dimensões válidas';
          addDebugInfo(`❌ ${error}`);
          reject(new Error(error));
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        addDebugInfo(`📐 Capturando: ${canvas.width}x${canvas.height}`);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        
        addDebugInfo(`✅ Foto capturada: ${base64.length} bytes`);
        resolve(base64);
      } catch (error) {
        addDebugInfo(`❌ Erro na captura: ${error}`);
        reject(error);
      }
    });
  }, [state.isActive, addDebugInfo]);

  // Trocar câmera
  const switchCamera = useCallback(async () => {
    if (!state.isActive) return false;

    addDebugInfo('🔄 Trocando câmera...');
    
    stopCamera();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return startCamera();
  }, [state.isActive, stopCamera, startCamera]);

  // Verificar múltiplas câmeras
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  useEffect(() => {
    const checkMultipleCameras = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          const hasMultiple = videoDevices.length > 1;
          
          setHasMultipleCameras(hasMultiple);
          addDebugInfo(`📹 Múltiplas câmeras: ${hasMultiple ? 'Sim' : 'Não'} (${videoDevices.length})`);
        } else {
          addDebugInfo('⚠️ enumerateDevices não disponível');
        }
      } catch (error) {
        addDebugInfo(`❌ Erro ao verificar múltiplas câmeras: ${error}`);
      }
    };

    if (state.isSupported) {
      checkMultipleCameras();
    }
  }, [state.isSupported, addDebugInfo]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Função para obter informações de debug
  const getDebugInfo = useCallback(() => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      protocol: location.protocol,
      hostname: location.hostname,
      mediaDevicesSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      legacyApiSupported: !!((navigator as any).getUserMedia || (navigator as any).webkitGetUserMedia || (navigator as any).mozGetUserMedia || (navigator as any).msGetUserMedia),
      polyfillWorking: !!getUserMedia,
      debugLog: state.debugInfo || []
    };
  }, [state.debugInfo]);

  return {
    // Estado
    ...state,
    hasMultipleCameras,
    
    // Refs
    videoRef,
    
    // Ações
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    
    // Utilitários
    isReady: state.isActive && !state.isLoading && !state.error,
    getDebugInfo
  };
}; 