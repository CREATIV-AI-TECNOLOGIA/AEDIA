import { supabase } from '../lib/supabase';

export interface ProvaEscaneada {
  id: string;
  sessao_escaneamento_id?: string;
  professor_id: number;
  avaliacao_original_id?: string;
  aluno_id?: number;
  imagem_url: string;
  imagem_nome?: string;
  imagem_tamanho_bytes?: number;
  imagem_tipo?: string;
  nome_aluno_detectado?: string;
  matricula_detectada?: string;
  confianca_identificacao?: number;
  status: 'pendente' | 'processando' | 'corrigida' | 'erro' | 'revisao_necessaria';
  tipo_correcao?: 'automatica' | 'manual' | 'hibrida';
  nota_automatica?: number;
  nota_final?: number;
  percentual_acerto?: number;
  respostas_detectadas?: any;
  questoes_corrigidas?: any;
  feedback_ia?: string;
  pontos_fortes?: string;
  areas_melhoria?: string;
  sugestoes_estudo?: string;
  necessita_revisao?: boolean;
  motivo_revisao?: string;
  confianca_correcao?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SessaoEscaneamento {
  id: string;
  professor_id: number;
  avaliacao_original_id?: string;
  escola_id: number;
  turma_id: number;
  disciplina_id: number;
  titulo: string;
  descricao?: string;
  data_sessao: string;
  status: 'pendente' | 'processando' | 'corrigida' | 'erro' | 'revisao_necessaria';
  correcao_automatica_ativa?: boolean;
  tolerancia_erro?: number;
  total_provas_esperadas?: number;
  total_provas_escaneadas?: number;
  total_provas_corrigidas?: number;
  total_provas_com_erro?: number;
  created_at?: string;
  updated_at?: string;
}

class ProvasService {
  // Criar uma nova sessão de escaneamento
  async criarSessaoEscaneamento(dados: Omit<SessaoEscaneamento, 'id' | 'created_at' | 'updated_at'>): Promise<SessaoEscaneamento> {
    console.log('🔄 Criando sessão de escaneamento:', dados);
    
    const { data, error } = await supabase
      .from('sessoes_escaneamento')
      .insert([dados])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar sessão:', error);
      throw new Error(`Erro ao criar sessão de escaneamento: ${error.message}`);
    }

    console.log('✅ Sessão criada:', data.id);
    return data;
  }

  // Salvar uma prova escaneada
  async salvarProvaEscaneada(dados: Omit<ProvaEscaneada, 'id' | 'created_at' | 'updated_at'>): Promise<ProvaEscaneada> {
    console.log('🔄 Salvando prova escaneada...');
    
    const { data, error } = await supabase
      .from('avaliacoes_escaneadas')
      .insert([dados])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar prova:', error);
      throw new Error(`Erro ao salvar prova escaneada: ${error.message}`);
    }

    console.log('✅ Prova salva:', data.id);
    return data;
  }

  // Listar provas escaneadas de um professor
  async listarProvasEscaneadas(professorId: number): Promise<ProvaEscaneada[]> {
    console.log('🔄 Listando provas do professor:', professorId);
    
    const { data, error } = await supabase
      .from('avaliacoes_escaneadas')
      .select('*')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao listar provas:', error);
      throw new Error(`Erro ao listar provas: ${error.message}`);
    }

    console.log('✅ Provas listadas:', data.length);
    return data || [];
  }

  // Listar sessões de escaneamento de um professor
  async listarSessoesEscaneamento(professorId: number): Promise<SessaoEscaneamento[]> {
    console.log('🔄 Listando sessões do professor:', professorId);
    
    const { data, error } = await supabase
      .from('sessoes_escaneamento')
      .select('*')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao listar sessões:', error);
      throw new Error(`Erro ao listar sessões: ${error.message}`);
    }

    console.log('✅ Sessões listadas:', data.length);
    return data || [];
  }

  // Atualizar status de uma prova
  async atualizarStatusProva(provaId: string, status: ProvaEscaneada['status']): Promise<void> {
    console.log('🔄 Atualizando status da prova:', provaId, status);
    
    const { error } = await supabase
      .from('avaliacoes_escaneadas')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', provaId);

    if (error) {
      console.error('❌ Erro ao atualizar status:', error);
      throw new Error(`Erro ao atualizar status: ${error.message}`);
    }

    console.log('✅ Status atualizado');
  }

  // Excluir uma prova
  async excluirProva(provaId: string): Promise<void> {
    console.log('🔄 Excluindo prova:', provaId);
    
    const { error } = await supabase
      .from('avaliacoes_escaneadas')
      .delete()
      .eq('id', provaId);

    if (error) {
      console.error('❌ Erro ao excluir prova:', error);
      throw new Error(`Erro ao excluir prova: ${error.message}`);
    }

    console.log('✅ Prova excluída');
  }

  // Upload de imagem para storage
  async uploadImagem(arquivo: File, professorId: number): Promise<string> {
    console.log('🔄 Fazendo upload da imagem:', arquivo.name);
    
    const nomeArquivo = `professor_${professorId}/${Date.now()}_${arquivo.name}`;
    
    const { data, error } = await supabase.storage
      .from('avaliacoes-escaneadas')
      .upload(nomeArquivo, arquivo);

    if (error) {
      console.error('❌ Erro no upload:', error);
      throw new Error(`Erro no upload: ${error.message}`);
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('avaliacoes-escaneadas')
      .getPublicUrl(data.path);

    console.log('✅ Upload concluído:', urlData.publicUrl);
    return urlData.publicUrl;
  }

  // Converter base64 para File
  base64ToFile(base64: string, filename: string): File {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  }

  // Processar prova completa (upload + salvar no banco)
  async processarProva(
    imagemBase64: string,
    professorId: number,
    turmaId: number,
    disciplinaId: number,
    escolaId: number,
    titulo: string
  ): Promise<{ prova: ProvaEscaneada; sessao: SessaoEscaneamento }> {
    console.log('🚀 Processando prova completa...');
    
    try {
      // 1. Criar sessão de escaneamento
      const sessao = await this.criarSessaoEscaneamento({
        professor_id: professorId,
        escola_id: escolaId,
        turma_id: turmaId,
        disciplina_id: disciplinaId,
        titulo: titulo,
        descricao: `Sessão criada automaticamente em ${new Date().toLocaleString('pt-BR')}`,
        data_sessao: new Date().toISOString().split('T')[0],
        status: 'pendente',
        correcao_automatica_ativa: true,
        total_provas_esperadas: 1
      });

      // 2. Converter base64 para arquivo
      const arquivo = this.base64ToFile(imagemBase64, `prova_${Date.now()}.jpg`);
      
      // 3. Upload da imagem
      const imagemUrl = await this.uploadImagem(arquivo, professorId);
      
      // 4. Salvar prova no banco
      const prova = await this.salvarProvaEscaneada({
        sessao_escaneamento_id: sessao.id,
        professor_id: professorId,
        imagem_url: imagemUrl,
        imagem_nome: arquivo.name,
        imagem_tamanho_bytes: arquivo.size,
        imagem_tipo: arquivo.type,
        status: 'pendente',
        tipo_correcao: 'automatica',
        necessita_revisao: false
      });

      console.log('✅ Prova processada com sucesso!');
      return { prova, sessao };
      
    } catch (error) {
      console.error('❌ Erro no processamento:', error);
      throw error;
    }
  }

  // Buscar provas por professor
  async buscarProvasPorProfessor(professorId: number): Promise<ProvaEscaneada[]> {
    try {
      console.log('🔍 Buscando provas do professor:', professorId);

      const { data, error } = await supabase
        .from('avaliacoes_escaneadas')
        .select('*')
        .eq('professor_id', professorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar provas:', error);
        throw error;
      }

      console.log('✅ Provas encontradas:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Erro no serviço buscarProvasPorProfessor:', error);
      throw error;
    }
  }
}

export const provasService = new ProvasService(); 