import { supabase } from '../lib/supabase';

export interface SessaoCorrecao {
  id: string;
  titulo: string;
  status: 'pendente' | 'processando' | 'corrigida' | 'erro' | 'revisao_necessaria';
  avaliacao_titulo: string;
  turma_nome: string;
  disciplina_nome: string;
  total_esperadas: number;
  total_escaneadas: number;
  total_corrigidas: number;
  percentual_conclusao: number;
  created_at: string;
  finalizada_at?: string;
}

export interface AvaliacaoEscaneada {
  id: string;
  sessao_escaneamento_id: string;
  imagem_url: string;
  nome_aluno_detectado?: string;
  matricula_detectada?: string;
  status: 'pendente' | 'processando' | 'corrigida' | 'erro' | 'revisao_necessaria';
  nota_final?: number;
  percentual_acerto?: number;
  feedback_ia?: string;
  necessita_revisao: boolean;
  created_at: string;
  processada_em?: string;
}

export interface EstatisticasSessao {
  total_esperadas: number;
  total_escaneadas: number;
  total_corrigidas: number;
  total_com_erro: number;
  total_pendentes: number;
  total_processando: number;
  total_revisao_necessaria: number;
  media_notas?: number;
  percentual_conclusao: number;
}

export interface UploadResponse {
  success: boolean;
  avaliacaoEscaneadaId: string;
  imagemUrl: string;
  resultadoProcessamento?: any;
  estatisticasSessao?: EstatisticasSessao;
  message: string;
}

class CorrecaoMobileService {
  async obterSessoesAtivas(): Promise<{ sessoes: SessaoCorrecao[] }> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gestao-sessoes-correcao?action=listar&limite=50`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao obter sessões:', error);
      throw error;
    }
  }

  async obterDetalhesSessao(sessaoId: string): Promise<{
    sessao: SessaoCorrecao;
    avaliacoesEscaneadas: AvaliacaoEscaneada[];
    estatisticas: EstatisticasSessao;
  }> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gestao-sessoes-correcao?action=detalhes&sessaoId=${sessaoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao obter detalhes da sessão:', error);
      throw error;
    }
  }

  async uploadProva(sessaoId: string, imagemBase64: string, nomeArquivo?: string): Promise<UploadResponse> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-prova-mobile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessaoId,
          imagemBase64,
          nomeArquivo: nomeArquivo || `prova_${Date.now()}.jpg`,
          tipoImagem: 'image/jpeg',
          processarImediatamente: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro no upload da prova:', error);
      throw error;
    }
  }

  async obterEstatisticas(sessaoId: string): Promise<EstatisticasSessao> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gestao-sessoes-correcao?action=estatisticas&sessaoId=${sessaoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data.estatisticas;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  async criarSessao(dados: {
    avaliacaoOriginalId: string;
    titulo: string;
    descricao?: string;
    totalProvasEsperadas: number;
  }): Promise<{ sessaoId: string }> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gestao-sessoes-correcao/criar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      throw error;
    }
  }

  async finalizarSessao(sessaoId: string): Promise<{ success: boolean }> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gestao-sessoes-correcao/finalizar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessaoId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error);
      throw error;
    }
  }

  // Função para comprimir imagem antes do upload
  compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular dimensões mantendo proporção
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Converter para base64
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // Função para capturar foto da câmera
  async capturarFotoCamera(videoElement: HTMLVideoElement): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Não foi possível criar contexto do canvas');
    }

    // Definir dimensões do canvas baseado no vídeo
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Desenhar frame atual do vídeo
    ctx.drawImage(videoElement, 0, 0);

    // Converter para base64 com compressão
    return canvas.toDataURL('image/jpeg', 0.8);
  }
}

export const correcaoMobileService = new CorrecaoMobileService(); 