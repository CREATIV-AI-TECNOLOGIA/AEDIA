import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  FileText,
  Clock,
  Award,
  Calendar,
  BookOpen,
  Users,
  Star,
  Eye,
  Edit,
  Save,
  X,
  ClipboardCheck,
  Image,
  Upload
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/layout/Card';
import ExportMenuAvaliacao from '../components/ui/ExportMenuAvaliacao';
import AvaliacaoStructuredView from '../components/ui/AvaliacaoStructuredView';
import DOMPurify from 'dompurify';

// Configuração segura do DOMPurify para prevenir XSS
const configurarDOMPurify = () => {
  // Remover atributos perigosos que podem executar código
  DOMPurify.addHook('beforeSanitizeAttributes', function (node) {
    // Remover todos os atributos de evento
    if (node.tagName) {
      const attributes = node.attributes;
      for (let i = attributes.length - 1; i >= 0; i--) {
        const attrName = attributes[i].name;
        if (attrName.startsWith('on')) {
          node.removeAttribute(attrName);
        }
      }
    }
  });
};

// Inicializar configuração do DOMPurify
configurarDOMPurify();

// Função utilitária para sanitização segura
const sanitizarHTML = (html: string): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html);
};

interface AvaliacaoDetalhada {
  id: string;
  titulo: string;
  descricao: string;
  conteudo_html: string;
  tipo: string;
  data_aplicacao: string;
  tempo_estimado: number;
  nota_maxima: number;
  peso: number;
  status: string;
  quantidade_questoes: number;
  foco_avaliacao: string;
  incluir_imagens: boolean;
  incluir_audio: boolean;
  codigo_identificacao?: string; // Código único para identificação automática
  instrucoes_personalizadas?: string;
  created_at: string;
  disciplinas?: { nome: string };
  turmas?: { nome: string; ano: string };
  planos_aula?: { titulo: string };
}

// Cache em memória para preservar dados da avaliação entre navegações
const avaliacaoCache = new Map<string, {
  avaliacao: AvaliacaoDetalhada;
  dadosEdicao: Partial<AvaliacaoDetalhada>;
  modoEdicao: boolean;
  timestamp: number;
}>();

// Limpar cache antigo (mais de 10 minutos)
const limparCacheAntigo = () => {
  const agora = Date.now();
  const TEMPO_CACHE = 10 * 60 * 1000; // 10 minutos
  
  for (const [key, value] of avaliacaoCache.entries()) {
    if (agora - value.timestamp > TEMPO_CACHE) {
      avaliacaoCache.delete(key);
    }
  }
};

const VisualizarAvaliacao: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, professorData } = useAuth();

  const [avaliacao, setAvaliacao] = useState<AvaliacaoDetalhada | null>(null);
  const [loading, setLoading] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  
  // Estados para edição
  const [dadosEdicao, setDadosEdicao] = useState<Partial<AvaliacaoDetalhada>>({});
  
  // Ref para o editor
  const editorRef = React.useRef<HTMLDivElement>(null);
  
  // Estado para controlar hover no editor (removido pois não é usado)
  // const [editorHovered, setEditorHovered] = useState(false);
  
  // Estado para controlar se o editor foi inicializado
  const [editorInicializado, setEditorInicializado] = useState(false);
  
  // Estado para upload de imagens
  const [uploadandoImagem, setUploadandoImagem] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados removidos - botões flutuantes deletados

  // Ref para controlar se os dados já foram carregados para evitar recarregamentos desnecessários
  const dadosCarregadosRef = useRef(false);
  const avaliacaoIdRef = useRef<string | null>(null);
  const componenteMontadoRef = useRef(false);

  // useEffect para marcar componente como montado
  useEffect(() => {
    componenteMontadoRef.current = true;
    return () => {
      componenteMontadoRef.current = false;
      // Não limpar o cache aqui para permitir navegação entre páginas
    };
  }, []);

  // useEffect para limpar cache quando usuário muda
  useEffect(() => {
    return () => {
      // Limpar cache apenas se o usuário mudou
      if (!professorData?.id) {
        avaliacaoCache.clear();
        console.log('[VisualizarAvaliacao] Cache limpo devido a mudança de usuário');
      }
    };
  }, [professorData?.id]);

  // useEffect otimizado para carregar avaliação apenas quando necessário
  useEffect(() => {
    // Só carregar se:
    // 1. Temos professorData e id
    // 2. O ID mudou (navegação para outra avaliação)
    // 3. Os dados ainda não foram carregados para este ID
    // 4. O componente está montado
    if (professorData && id && componenteMontadoRef.current && (avaliacaoIdRef.current !== id || !dadosCarregadosRef.current)) {
      console.log('[VisualizarAvaliacao] Verificando cache para avaliação:', { id, professorId: professorData.id });
      
      // Limpar cache antigo primeiro
      limparCacheAntigo();
      
      // Verificar se existe no cache
      const cacheKey = `${professorData.id}-${id}`;
      const dadosCache = avaliacaoCache.get(cacheKey);
      
             if (dadosCache) {
         console.log('[VisualizarAvaliacao] Dados encontrados no cache, restaurando...');
         setAvaliacao(dadosCache.avaliacao);
         setDadosEdicao(dadosCache.dadosEdicao);
         setModoEdicao(dadosCache.modoEdicao || false);
         setLoading(false);
         dadosCarregadosRef.current = true;
         avaliacaoIdRef.current = id;
      } else {
        console.log('[VisualizarAvaliacao] Dados não encontrados no cache, carregando do banco...');
        avaliacaoIdRef.current = id;
        dadosCarregadosRef.current = false;
      carregarAvaliacao();
    }
    }
  }, [id, professorData?.id]); // Usar apenas professorData.id para evitar recarregamentos desnecessários

  // Inicializar o editor quando entrar no modo de edição
  useEffect(() => {
    if (modoEdicao && editorRef.current && dadosEdicao.conteudo_html && !editorInicializado) {
      // Sanitizar o conteúdo antes de inserir no editor
      const conteudoSanitizado = sanitizarHTML(dadosEdicao.conteudo_html);
      editorRef.current.innerHTML = conteudoSanitizado;
      setEditorInicializado(true);
    }
  }, [modoEdicao, dadosEdicao.conteudo_html, editorInicializado]);

  // Reset do editor quando sair do modo de edição
  useEffect(() => {
    if (!modoEdicao) {
      setEditorInicializado(false);
    }
  }, [modoEdicao]);

  // Verificar se é uma avaliação recém-criada e mostrar mensagem de boas-vindas
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isNewlyCreated = urlParams.get('created') === 'true';
    
    if (isNewlyCreated && avaliacao) {
      toast.success('🎉 Avaliação criada com sucesso! Aqui você pode visualizar, exportar ou imprimir.', {
        duration: 4000,
        position: 'top-center'
      });
      
      // Limpar o parâmetro da URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [avaliacao]);

  const carregarAvaliacao = async () => {
    try {
      setLoading(true);

      if (!id || !professorData?.id) {
        toast.error('Dados do professor não encontrados');
        navigate('/avaliacoes');
        return;
      }

      console.log('[VisualizarAvaliacao] Buscando avaliação no banco:', { id, professorId: professorData.id });

      const { data, error } = await supabase
        .from('avaliacoes')
        .select(`
          *,
          disciplinas(nome),
          turmas(nome, ano),
          planos_aula(titulo)
        `)
        .eq('id', id)
        .eq('professor_id', professorData.id)
        .single();

      if (error) {
        console.error('Erro ao carregar avaliação:', error);
        toast.error('Erro ao carregar avaliação');
        navigate('/avaliacoes');
        return;
      }

      console.log('[VisualizarAvaliacao] Avaliação carregada com sucesso:', data.titulo);
      setAvaliacao(data);
      
      // Inicializar dados de edição
      const dadosEdicaoIniciais = {
        titulo: data.titulo,
        descricao: data.descricao,
        conteudo_html: data.conteudo_html,
        tipo: data.tipo,
        data_aplicacao: data.data_aplicacao,
        tempo_estimado: data.tempo_estimado,
        nota_maxima: data.nota_maxima,
        peso: data.peso,
        status: data.status,
        quantidade_questoes: data.quantidade_questoes,
        foco_avaliacao: data.foco_avaliacao,
        incluir_imagens: data.incluir_imagens,
        incluir_audio: data.incluir_audio,
        instrucoes_personalizadas: data.instrucoes_personalizadas
      };
      
      setDadosEdicao(dadosEdicaoIniciais);

      // Salvar no cache para evitar recarregamentos futuros
      const cacheKey = `${professorData.id}-${id}`;
      avaliacaoCache.set(cacheKey, {
        avaliacao: data,
        dadosEdicao: dadosEdicaoIniciais,
        modoEdicao: false,
        timestamp: Date.now()
      });
      console.log('[VisualizarAvaliacao] Dados salvos no cache:', cacheKey);

      // Marcar como carregado
      dadosCarregadosRef.current = true;
    } catch (error) {
      console.error('Erro ao carregar avaliação:', error);
      toast.error('Erro ao carregar avaliação');
      navigate('/avaliacoes');
    } finally {
      setLoading(false);
    }
  };

  const salvarAlteracoes = useCallback(async () => {
    if (!avaliacao || !dadosEdicao) {
      console.log('[VisualizarAvaliacao] Erro: avaliacao ou dadosEdicao não disponíveis', { avaliacao: !!avaliacao, dadosEdicao: !!dadosEdicao });
      return;
    }

    try {
      setSalvando(true);
      console.log('[VisualizarAvaliacao] Iniciando salvamento com dados:', {
        titulo: dadosEdicao.titulo,
        descricao: dadosEdicao.descricao?.substring(0, 50),
        avaliacaoId: avaliacao.id
      });

      // Sanitizar o conteúdo HTML antes de salvar no banco
      const conteudoSanitizado = sanitizarHTML(dadosEdicao.conteudo_html || '');

      const { error } = await supabase
        .from('avaliacoes')
        .update({
          titulo: dadosEdicao.titulo,
          descricao: dadosEdicao.descricao,
          conteudo_html: conteudoSanitizado,
          tipo: dadosEdicao.tipo,
          data_aplicacao: dadosEdicao.data_aplicacao,
          tempo_estimado: dadosEdicao.tempo_estimado,
          nota_maxima: dadosEdicao.nota_maxima,
          peso: dadosEdicao.peso,
          status: dadosEdicao.status,
          quantidade_questoes: dadosEdicao.quantidade_questoes,
          foco_avaliacao: dadosEdicao.foco_avaliacao,
          incluir_imagens: dadosEdicao.incluir_imagens,
          incluir_audio: dadosEdicao.incluir_audio,
          instrucoes_personalizadas: dadosEdicao.instrucoes_personalizadas,
          updated_at: new Date().toISOString()
        })
        .eq('id', avaliacao.id);

      if (error) {
        console.error('Erro ao salvar alterações no banco:', error);
        toast.error('Erro ao salvar alterações');
        return;
      }

      console.log('[VisualizarAvaliacao] Salvamento no banco realizado com sucesso');

      // Atualizar estado local - CRÍTICO: Manter dadosEdicao para visualização
      const avaliacaoAtualizada = avaliacao ? { ...avaliacao, ...dadosEdicao } : null;
      setAvaliacao(avaliacaoAtualizada);
      
      // IMPORTANTE: Não limpar dadosEdicao imediatamente para manter a visualização atualizada
      console.log('[VisualizarAvaliacao] Estado local atualizado:', {
        tituloAnterior: avaliacao.titulo,
        tituloNovo: avaliacaoAtualizada?.titulo
      });
      
      setModoEdicao(false);
      
      // Atualizar cache com os novos dados
      if (avaliacaoAtualizada && professorData?.id && id) {
        const cacheKey = `${professorData.id}-${id}`;
        avaliacaoCache.set(cacheKey, {
          avaliacao: avaliacaoAtualizada,
          dadosEdicao: { ...dadosEdicao },
          modoEdicao: false,
          timestamp: Date.now()
        });
        console.log('[VisualizarAvaliacao] Cache atualizado após salvamento:', cacheKey);
      }
      
      toast.success('Alterações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setSalvando(false);
    }
  }, [avaliacao, dadosEdicao, professorData?.id, id]);

  const cancelarEdicao = useCallback(() => {
    if (!avaliacao) return;
    
    // Restaurar dados originais
    setDadosEdicao({
      titulo: avaliacao.titulo,
      descricao: avaliacao.descricao,
      conteudo_html: avaliacao.conteudo_html,
      tipo: avaliacao.tipo,
      data_aplicacao: avaliacao.data_aplicacao,
      tempo_estimado: avaliacao.tempo_estimado,
      nota_maxima: avaliacao.nota_maxima,
      peso: avaliacao.peso,
      status: avaliacao.status,
      quantidade_questoes: avaliacao.quantidade_questoes,
      foco_avaliacao: avaliacao.foco_avaliacao,
      incluir_imagens: avaliacao.incluir_imagens,
      incluir_audio: avaliacao.incluir_audio,
      instrucoes_personalizadas: avaliacao.instrucoes_personalizadas
    });
    setModoEdicao(false);
  }, [avaliacao]);

  const iniciarEdicao = useCallback(() => {
    setModoEdicao(true);
  }, []);

  // Função para atualizar cache com dados de edição
  const atualizarCacheEdicao = useCallback(() => {
    if (avaliacao && professorData?.id && id) {
      const cacheKey = `${professorData.id}-${id}`;
      const cacheExistente = avaliacaoCache.get(cacheKey);
      
      if (cacheExistente) {
        avaliacaoCache.set(cacheKey, {
          ...cacheExistente,
          dadosEdicao: { ...dadosEdicao },
          modoEdicao: modoEdicao,
          timestamp: Date.now()
        });
      }
    }
  }, [avaliacao, professorData?.id, id, dadosEdicao]);

  // useEffect para atualizar cache quando dados de edição mudam
  useEffect(() => {
    if (modoEdicao && dadosEdicao && Object.keys(dadosEdicao).length > 0) {
      const timeoutId = setTimeout(atualizarCacheEdicao, 1000); // Debounce de 1 segundo
      return () => clearTimeout(timeoutId);
    }
  }, [dadosEdicao, modoEdicao, atualizarCacheEdicao]);

  // Funções para o editor WYSIWYG
  const executarComando = useCallback((comando: string, valor?: string) => {
    // Salvar posição do scroll e seleção
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    
    document.execCommand(comando, false, valor);
    
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setDadosEdicao(prev => ({ ...prev, conteudo_html: html }));
      
      // Usar requestAnimationFrame para garantir restauração após render
      requestAnimationFrame(() => {
        // Restaurar posição do scroll
        window.scrollTo(scrollLeft, scrollTop);
        
        // Tentar restaurar seleção se possível
        if (range && selection) {
          try {
            selection.removeAllRanges();
            selection.addRange(range);
          } catch (e) {
            // Ignorar erros de seleção
            console.log('Erro ao restaurar seleção:', e);
          }
        }
      });
    }
  }, []);

  const inserirTexto = useCallback((texto: string) => {
    if (editorRef.current) {
      // Salvar posição do scroll
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      editorRef.current.focus();
      document.execCommand('insertText', false, texto);
      const html = editorRef.current.innerHTML;
      
      // Forçar atualização do estado
      setDadosEdicao(prev => ({ 
        ...prev, 
        conteudo_html: html 
      }));
      
      console.log('[InserirTexto] Texto inserido, HTML atualizado');
      
      // Restaurar posição do scroll
      requestAnimationFrame(() => {
        window.scrollTo(scrollLeft, scrollTop);
      });
    }
  }, []);

  const limparFormatacao = useCallback(() => {
    executarComando('removeFormat');
  }, [executarComando]);

  // Função para fazer upload de imagem
  const handleUploadImagem = useCallback(async (file: File) => {
    if (!file || !professorData?.id || !avaliacao?.id) {
      toast.error('Erro ao fazer upload da imagem');
      return;
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadandoImagem(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avaliacoes/${professorData.id}/${avaliacao.id}/${fileName}`;

      // Upload para o Supabase Storage (usando bucket 'avatars' que já existe)
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (error) {
        console.error('Erro no upload:', error);
        toast.error('Erro ao fazer upload da imagem');
        return;
      }

      // Obter URL pública da imagem
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        // Inserir imagem no editor
        const imgHtml = `<img src="${urlData.publicUrl}" alt="Imagem da avaliação" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
        
        if (editorRef.current) {
          editorRef.current.focus();
          document.execCommand('insertHTML', false, imgHtml);
          const html = editorRef.current.innerHTML;
          setDadosEdicao(prev => ({ ...prev, conteudo_html: html }));
        }

        toast.success('Imagem adicionada com sucesso!');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setUploadandoImagem(false);
    }
  }, [professorData?.id, avaliacao?.id]);

  // Função para abrir seletor de arquivo
  const abrirSeletorImagem = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Handler para mudança de arquivo
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUploadImagem(file);
    }
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
  }, [handleUploadImagem]);

  // Função para limpar emojis e formatação indesejada das questões
  const limparQuestoes = useCallback(() => {
    if (!editorRef.current) return;
    
    const elementos = editorRef.current.querySelectorAll('*');
    elementos.forEach((elemento) => {
      const texto = elemento.textContent?.trim() || '';
      
      // Se contém padrão de questão com emoji, limpar
      if (/^[\u{1F4DD}\u{1F3AF}]\s*questão/iu.test(texto)) {
        const textoLimpo = texto.replace(/^[\u{1F4DD}\u{1F3AF}]\s*/iu, '');
        if (elemento.textContent !== textoLimpo) {
          elemento.textContent = textoLimpo;
        }
      }
    });
    
    // Atualizar estado após limpeza
    const html = editorRef.current.innerHTML;
    setDadosEdicao(prev => ({ ...prev, conteudo_html: html }));
    
    console.log('[LimparQuestoes] Emojis removidos das questões');
  }, []);

  // Função para renumerar todas as questões sequencialmente (preservando HTML)
  const renumerarQuestoes = useCallback(() => {
    if (!editorRef.current) return;
    
    console.log('[DEBUG] renumerarQuestoes iniciada');
    
    const elementos = editorRef.current.querySelectorAll('*');
    const questoesEncontradas: HTMLElement[] = [];
    
    // Encontrar todas as questões no documento
    elementos.forEach((elemento) => {
      const texto = elemento.textContent?.trim() || '';
      const isQuestao = /^questão\s+\d+/i.test(texto);
      
      if (isQuestao && elemento instanceof HTMLElement) {
        questoesEncontradas.push(elemento);
        console.log('[DEBUG] Questão encontrada para renumerar:', texto);
      }
    });
    
    console.log('[DEBUG] Total de questões encontradas para renumerar:', questoesEncontradas.length);
    
    // Ordenar questões por posição no documento
    questoesEncontradas.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return rectA.top - rectB.top;
    });
    
    // Renumerar sequencialmente preservando HTML
    questoesEncontradas.forEach((elemento, index) => {
      const novoNumero = index + 1;
      const htmlAtual = elemento.innerHTML;
      
      // Substituir apenas o número da questão, preservando tags HTML
      const htmlNovo = htmlAtual.replace(
        /questão\s+\d+/gi, 
        `Questão ${novoNumero}`
      );
      
      console.log('[DEBUG] Renumerando questão', index + 1, 'de', htmlAtual, 'para', htmlNovo);
      // Sanitizar o conteúdo antes de inserir
      elemento.innerHTML = sanitizarHTML(htmlNovo);
    });
    
    // Atualizar estado do editor
    const html = editorRef.current.innerHTML;
    setDadosEdicao(prev => ({ ...prev, conteudo_html: html }));
    
    console.log('[RenumerarQuestoes] Questões renumeradas preservando HTML. Total:', questoesEncontradas.length);
  }, []);

  // Funções de ferramentas removidas - botões flutuantes deletados

  // Função para criar questões no final (barra de ferramentas)
  const criarNovaQuestao = useCallback((tipo: 'multipla' | 'discursiva') => {
    if (!editorRef.current || salvando) return;
    
    setSalvando(true);
    
    try {
      // Contar questões existentes para numeração
      const elementosQuestao = editorRef.current.querySelectorAll('*');
      let contadorQuestoes = 0;
      elementosQuestao.forEach(el => {
        if (el.textContent && /^questão\s+\d+/i.test(el.textContent.trim())) {
          contadorQuestoes++;
        }
      });
      const proximoNumero = contadorQuestoes + 1;
      
      // Criar HTML
      let novaQuestaoHTML = '';
      if (tipo === 'multipla') {
        novaQuestaoHTML = `<br><br><p><strong>Questão ${proximoNumero}</strong></p><p><br></p><p>a) </p><p>b) </p><p>c) </p><p>d) </p><br>`;
      } else {
        novaQuestaoHTML = `<br><br><p><strong>Questão ${proximoNumero}</strong></p><p><br></p><p>_________________________________________________________________</p><p>_________________________________________________________________</p><p>_________________________________________________________________</p><br>`;
      }
      
      // Inserir no final
      editorRef.current.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      // Sanitizar o conteúdo antes de inserir
      const novaQuestaoSanitizada = sanitizarHTML(novaQuestaoHTML);
      document.execCommand('insertHTML', false, novaQuestaoSanitizada);
      
      const html = editorRef.current.innerHTML;
      setDadosEdicao(prev => ({ ...prev, conteudo_html: html }));
      
      toast.success(`Questão ${tipo === 'multipla' ? 'de múltipla escolha' : 'discursiva'} adicionada!`);
      
      // APENAS desbloqueio, SEM renumeração automática
      setSalvando(false);
      
    } catch (error) {
      console.error('Erro ao criar questão:', error);
      toast.error('Erro ao criar questão');
      setSalvando(false);
    }
  }, [salvando]);

  // Função removida - botões flutuantes deletados

  // Funções de duplicar e remover removidas - botões flutuantes deletados

  // useEffects removidos - botões flutuantes deletados

  const getStatusLabel = (status: string) => {
    const labels = {
      pendente: 'Pendente',
      aplicada: 'Aplicada',
      corrigida: 'Corrigida',
      publicada: 'Publicada'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      aplicada: 'bg-blue-100 text-blue-800 border-blue-300',
      corrigida: 'bg-purple-100 text-purple-800 border-purple-300',
      publicada: 'bg-green-100 text-green-800 border-green-300'
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      prova: 'Prova',
      trabalho: 'Trabalho',
      projeto: 'Projeto',
      apresentacao: 'Apresentação',
      atividade: 'Atividade',
      diagnostica: 'Diagnóstica',
      formativa: 'Formativa',
      somativa: 'Somativa'
    };
    return tipos[tipo] || tipo;
  };

  if (loading) {
    return (
      <Layout
        headerTitle="Visualizar Avaliação"
        headerSubtitle="Carregando..."
        headerIcon={<Eye className="h-5 w-5 text-indigo-600" />}
        mostrarEscola={true}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Carregando avaliação...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!avaliacao) {
    return (
      <Layout
        headerTitle="Visualizar Avaliação"
        headerSubtitle="Erro"
        headerIcon={<Eye className="h-5 w-5 text-red-600" />}
        mostrarEscola={true}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Avaliação não encontrada</h2>
            <p className="text-gray-600 mb-4">A avaliação solicitada não foi encontrada ou você não tem permissão para visualizá-la.</p>
            <button
              onClick={() => navigate('/avaliacoes')}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar às Avaliações
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      headerTitle={modoEdicao ? "Editando Avaliação" : "Visualizar Avaliação"}
      headerSubtitle={avaliacao ? (dadosEdicao?.titulo || avaliacao.titulo) : "Carregando..."}
      headerIcon={modoEdicao ? <Edit className="h-5 w-5 text-amber-600" /> : <Eye className="h-5 w-5 text-indigo-600" />}
      mostrarEscola={true}
    >
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header com botão voltar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/avaliacoes')}
                  className="inline-flex items-center px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-700 font-medium rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </button>
                
                {avaliacao && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Criada em {new Date(avaliacao.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>
              
              {avaliacao && (
                <div className="flex items-center space-x-3">
                  {!modoEdicao && (
                    <>

                      
                                          <ExportMenuAvaliacao 
                      avaliacaoData={{
                        id: avaliacao.id,
                        titulo: dadosEdicao?.titulo || avaliacao.titulo,
                        disciplinaNome: avaliacao.disciplinas?.nome,
                        professorNome: user?.user_metadata?.nome || 'Professor',
                        turmaAno: avaliacao.turmas?.ano,
                        turmaNome: avaliacao.turmas?.nome,
                        modalidade: getTipoLabel(dadosEdicao?.tipo || avaliacao.tipo),
                        dataAplicacao: dadosEdicao?.data_aplicacao || avaliacao.data_aplicacao,
                        tempoEstimado: dadosEdicao?.tempo_estimado || avaliacao.tempo_estimado,
                        notaMaxima: dadosEdicao?.nota_maxima || avaliacao.nota_maxima,
                        tipo: getTipoLabel(dadosEdicao?.tipo || avaliacao.tipo),
                        codigoIdentificacao: avaliacao.codigo_identificacao,
                        instrucoes: dadosEdicao?.instrucoes_personalizadas || avaliacao.instrucoes_personalizadas,
                        conteudoHTML: dadosEdicao?.conteudo_html || avaliacao.conteudo_html
                      }}
                    />
                    </>
                  )}
                  
                  {modoEdicao ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={salvarAlteracoes}
                        disabled={salvando}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {salvando ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button
                        onClick={cancelarEdicao}
                        disabled={salvando}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={iniciarEdicao}
                      className="inline-flex items-center px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>



          {/* Informações da Avaliação */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
            <Card className="lg:col-span-2 p-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5 flex items-center">
                <FileText className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                Informações Gerais
              </h3>
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-1.5 rounded">
                    <label className="block text-xs font-medium text-gray-500 mb-0.5">Disciplina</label>
                    <div className="flex items-center">
                      <BookOpen className="w-3 h-3 mr-1 text-blue-500" />
                      <span className="text-xs text-gray-900 font-medium">{avaliacao.disciplinas?.nome || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-1.5 rounded">
                    <label className="block text-xs font-medium text-gray-500 mb-0.5">Turma</label>
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1 text-green-500" />
                      <span className="text-xs text-gray-900 font-medium">
                        {avaliacao.turmas ? `${avaliacao.turmas.ano} ${avaliacao.turmas.nome}` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {(avaliacao.planos_aula?.titulo || (modoEdicao ? dadosEdicao.foco_avaliacao : avaliacao.foco_avaliacao)) && (
                  <div className="grid grid-cols-2 gap-2">
                    {avaliacao.planos_aula?.titulo && (
                      <div className="bg-gray-50 p-1.5 rounded">
                        <label className="block text-xs font-medium text-gray-500 mb-0.5">Plano de Aula Base</label>
                        <div className="flex items-center">
                          <FileText className="w-3 h-3 mr-1 text-purple-500" />
                          <span className="text-xs text-gray-900 font-medium">{avaliacao.planos_aula.titulo}</span>
                        </div>
                      </div>
                    )}

                    {(modoEdicao ? dadosEdicao.foco_avaliacao : avaliacao.foco_avaliacao) && (
                      <div className="bg-gray-50 p-1.5 rounded">
                        <label className="block text-xs font-medium text-gray-500 mb-0.5">Foco da Avaliação</label>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-1 text-yellow-500" />
                          <span className="text-xs text-gray-900 font-medium">
                            {modoEdicao ? dadosEdicao.foco_avaliacao : avaliacao.foco_avaliacao}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5 flex items-center">
                <Award className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                Configurações
              </h3>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between py-0.5 px-1.5 bg-gray-50 rounded text-xs">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-gray-400" />
                    <span className="font-medium text-gray-600">Tempo</span>
                  </div>
                  {modoEdicao ? (
                    <input
                      type="number"
                      value={dadosEdicao.tempo_estimado || ''}
                      onChange={(e) => setDadosEdicao(prev => ({ ...prev, tempo_estimado: parseInt(e.target.value) || 0 }))}
                      className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="1"
                      max="300"
                      style={{
                        cursor: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'20\' viewBox=\'0 0 16 20\'%3E%3Cpath d=\'M8 0 L8 20 M4 2 L12 2 M4 18 L12 18\' stroke=\'%23000000\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") 8 10, text',
                        caretColor: '#000000'
                      }}
                    />
                  ) : (
                    <span className="font-bold text-gray-900">{avaliacao.tempo_estimado} min</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between py-0.5 px-1.5 bg-gray-50 rounded text-xs">
                  <div className="flex items-center">
                    <Star className="w-3 h-3 mr-1 text-gray-400" />
                    <span className="font-medium text-gray-600">Nota Máx</span>
                  </div>
                  {modoEdicao ? (
                    <input
                      type="number"
                      value={dadosEdicao.nota_maxima || ''}
                      onChange={(e) => setDadosEdicao(prev => ({ ...prev, nota_maxima: parseFloat(e.target.value) || 0 }))}
                      className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="0"
                      max="100"
                      step="0.5"
                      style={{
                        cursor: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'20\' viewBox=\'0 0 16 20\'%3E%3Cpath d=\'M8 0 L8 20 M4 2 L12 2 M4 18 L12 18\' stroke=\'%23000000\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") 8 10, text',
                        caretColor: '#000000'
                      }}
                    />
                  ) : (
                    <span className="font-bold text-gray-900">{avaliacao.nota_maxima}</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-xs">
                  <div className="flex items-center">
                    <Award className="w-3 h-3 mr-1 text-gray-400" />
                    <span className="font-medium text-gray-600">Peso</span>
                  </div>
                  {modoEdicao ? (
                    <input
                      type="number"
                      value={dadosEdicao.peso || ''}
                      onChange={(e) => setDadosEdicao(prev => ({ ...prev, peso: parseFloat(e.target.value) || 0 }))}
                      className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="0"
                      max="10"
                      step="0.1"
                      style={{
                        cursor: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'20\' viewBox=\'0 0 16 20\'%3E%3Cpath d=\'M8 0 L8 20 M4 2 L12 2 M4 18 L12 18\' stroke=\'%23000000\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") 8 10, text',
                        caretColor: '#000000'
                      }}
                    />
                  ) : (
                    <span className="font-bold text-gray-900">{avaliacao.peso}</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-xs">
                  <div className="flex items-center">
                    <FileText className="w-3 h-3 mr-1 text-gray-400" />
                    <span className="font-medium text-gray-600">Questões</span>
                  </div>
                  {modoEdicao ? (
                    <input
                      type="number"
                      value={dadosEdicao.quantidade_questoes || ''}
                      onChange={(e) => setDadosEdicao(prev => ({ ...prev, quantidade_questoes: parseInt(e.target.value) || 0 }))}
                      className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="1"
                      max="50"
                      style={{
                        cursor: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'20\' viewBox=\'0 0 16 20\'%3E%3Cpath d=\'M8 0 L8 20 M4 2 L12 2 M4 18 L12 18\' stroke=\'%23000000\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") 8 10, text',
                        caretColor: '#000000'
                      }}
                    />
                  ) : (
                    <span className="font-bold text-gray-900">{avaliacao.quantidade_questoes}</span>
                  )}
                </div>
                
                {(avaliacao.data_aplicacao || modoEdicao) && (
                  <div className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-xs">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                      <span className="font-medium text-gray-600">Data</span>
                    </div>
                    {modoEdicao ? (
                      <input
                        type="date"
                        value={dadosEdicao.data_aplicacao || ''}
                        onChange={(e) => setDadosEdicao(prev => ({ ...prev, data_aplicacao: e.target.value }))}
                        className="px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        style={{
                          cursor: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'20\' viewBox=\'0 0 16 20\'%3E%3Cpath d=\'M8 0 L8 20 M4 2 L12 2 M4 18 L12 18\' stroke=\'%23000000\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") 8 10, text',
                          caretColor: '#000000'
                        }}
                      />
                    ) : (
                      <span className="font-bold text-gray-900">
                        {new Date(avaliacao.data_aplicacao).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                )}

                {/* Tipo da Avaliação */}
                <div className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-xs">
                  <div className="flex items-center">
                    <FileText className="w-3 h-3 mr-1 text-gray-400" />
                    <span className="font-medium text-gray-600">Tipo</span>
                  </div>
                  {modoEdicao ? (
                    <select
                      value={dadosEdicao.tipo || ''}
                      onChange={(e) => setDadosEdicao(prev => ({ ...prev, tipo: e.target.value }))}
                      className="px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      style={{
                        cursor: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'20\' viewBox=\'0 0 16 20\'%3E%3Cpath d=\'M8 0 L8 20 M4 2 L12 2 M4 18 L12 18\' stroke=\'%23000000\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") 8 10, text',
                        caretColor: '#000000'
                      }}
                    >
                      <option value="prova">Prova</option>
                      <option value="trabalho">Trabalho</option>
                      <option value="projeto">Projeto</option>
                      <option value="apresentacao">Apresentação</option>
                      <option value="atividade">Atividade</option>
                      <option value="diagnostica">Diagnóstica</option>
                      <option value="formativa">Formativa</option>
                      <option value="somativa">Somativa</option>
                    </select>
                  ) : (
                    <span className="font-bold text-gray-900">{getTipoLabel(avaliacao.tipo)}</span>
                  )}
                </div>

                {/* Status da Avaliação */}
                <div className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-xs">
                  <div className="flex items-center">
                    <Star className="w-3 h-3 mr-1 text-gray-400" />
                    <span className="font-medium text-gray-600">Status</span>
                  </div>
                  {modoEdicao ? (
                    <select
                      value={dadosEdicao.status || ''}
                      onChange={(e) => setDadosEdicao(prev => ({ ...prev, status: e.target.value }))}
                      className="px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      style={{
                        cursor: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'20\' viewBox=\'0 0 16 20\'%3E%3Cpath d=\'M8 0 L8 20 M4 2 L12 2 M4 18 L12 18\' stroke=\'%23000000\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") 8 10, text',
                        caretColor: '#000000'
                      }}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="aplicada">Aplicada</option>
                      <option value="corrigida">Corrigida</option>
                      <option value="publicada">Publicada</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(avaliacao.status)}`}>
                      {getStatusLabel(avaliacao.status)}
                    </span>
                  )}
                </div>

                {/* Código de Identificação */}
                {avaliacao.codigo_identificacao && (
                  <div className="flex items-center justify-between py-1 px-2 bg-indigo-50 rounded text-xs border border-indigo-200">
                    <div className="flex items-center">
                      <ClipboardCheck className="w-3 h-3 mr-1 text-indigo-600" />
                      <span className="font-medium text-indigo-700">Código ID</span>
                    </div>
                    <span className="font-mono font-bold text-indigo-800 bg-white px-2 py-0.5 rounded border">
                      {avaliacao.codigo_identificacao}
                    </span>
                  </div>
                )}

                {/* Recursos incluídos */}
                <div className="pt-1 mt-2 border-t border-gray-200">
                  <h4 className="text-xs font-medium text-gray-700 mb-1">Recursos</h4>
                  {modoEdicao ? (
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={dadosEdicao.incluir_imagens || false}
                          onChange={(e) => setDadosEdicao(prev => ({ ...prev, incluir_imagens: e.target.checked }))}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-700">Incluir imagens</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={dadosEdicao.incluir_audio || false}
                          onChange={(e) => setDadosEdicao(prev => ({ ...prev, incluir_audio: e.target.checked }))}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-700">Incluir áudio</span>
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {avaliacao.incluir_imagens && (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          Imagens
                        </span>
                      )}
                      {avaliacao.incluir_audio && (
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          🔊 Áudio
                        </span>
                      )}
                      {!avaliacao.incluir_imagens && !avaliacao.incluir_audio && (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          Apenas texto
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Conteúdo da Avaliação */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                Conteúdo da Avaliação
              </h3>
              {modoEdicao && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={salvarAlteracoes}
                    disabled={salvando}
                    className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              {modoEdicao ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conteúdo da Avaliação
                    </label>
                    <div className="border border-gray-300 rounded-md overflow-hidden">
                      {/* Barra de ferramentas */}
                      <div className="bg-gray-50 border-b border-gray-300 p-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Formatação de texto */}
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => executarComando('bold')}
                              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
                              title="Negrito (Ctrl+B)"
                            >
                              B
                            </button>
                            <button
                              type="button"
                              onClick={() => executarComando('italic')}
                              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 italic"
                              title="Itálico (Ctrl+I)"
                            >
                              I
                            </button>
                            <button
                              type="button"
                              onClick={() => executarComando('underline')}
                              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 underline"
                              title="Sublinhado (Ctrl+U)"
                            >
                              U
                            </button>
                          </div>
                          
                          <div className="w-px h-4 bg-gray-300"></div>
                          
                          {/* Upload de Imagem */}
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={abrirSeletorImagem}
                              disabled={uploadandoImagem}
                              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 flex items-center space-x-1 disabled:opacity-50"
                              title="Adicionar Imagem"
                            >
                              {uploadandoImagem ? (
                                <Upload className="h-3 w-3 animate-spin" />
                              ) : (
                                <Image className="h-3 w-3" />
                              )}
                              <span>{uploadandoImagem ? 'Enviando...' : 'Imagem'}</span>
                            </button>
                          </div>
                          
                          <div className="w-px h-4 bg-gray-300"></div>
                          
                          {/* Desfazer/Refazer */}
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => executarComando('undo')}
                              className="px-2 py-1 text-xs bg-gray-50 border border-gray-300 rounded hover:bg-gray-100"
                              title="Desfazer (Ctrl+Z)"
                            >
                              ↶ Desfazer
                            </button>
                            <button
                              type="button"
                              onClick={() => executarComando('redo')}
                              className="px-2 py-1 text-xs bg-gray-50 border border-gray-300 rounded hover:bg-gray-100"
                              title="Refazer (Ctrl+Y ou Ctrl+Shift+Z)"
                            >
                              ↷ Refazer
                            </button>
                          </div>
                          
                                                    {/* Seção de ações especiais removida */}
                        </div>
                      </div>
                      
                      {/* Input de arquivo oculto para upload de imagens */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      
                      {/* Editor visual com ferramentas de questão */}
                      <div className="relative">
                        {/* Botões flutuantes removidos - funcionalidade deletada */}

                        <style>
                          {`
                            /* Cursor preto personalizado para toda a área editável */
                            .editor-content,
                            .editor-content *,
                            .editor-content p, 
                            .editor-content span, 
                            .editor-content div, 
                            .editor-content h1, 
                            .editor-content h2, 
                            .editor-content h3, 
                            .editor-content li, 
                            .editor-content ul, 
                            .editor-content ol,
                            .editor-content strong,
                            .editor-content em,
                            .editor-content b,
                            .editor-content i,
                            .editor-content u,
                            .editor-content:hover,
                            .editor-content *:hover {
                              cursor: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='20' viewBox='0 0 16 20'%3E%3Cpath d='M8 0 L8 20 M4 2 L12 2 M4 18 L12 18' stroke='%23000000' stroke-width='2' fill='none'/%3E%3C/svg%3E") 8 10, text !important;
                            }
                            
                            /* Garantir que inputs também tenham cursor preto */
                            input[type="text"]:focus,
                            input[type="number"]:focus,
                            input[type="date"]:focus,
                            textarea:focus,
                            select:focus {
                              cursor: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='20' viewBox='0 0 16 20'%3E%3Cpath d='M8 0 L8 20 M4 2 L12 2 M4 18 L12 18' stroke='%23000000' stroke-width='2' fill='none'/%3E%3C/svg%3E") 8 10, text !important;
                            }

                            /* Garantir que o menu de ferramentas fique dentro do container */
                            .ferramenta-questao {
                              max-width: 200px;
                              overflow: hidden;
                            }
                            
                            /* Evitar que botões flutuantes se sobreponham */
                            .botao-ferramenta-questao {
                              pointer-events: auto;
                              z-index: 10;
                            }
                          `}
                        </style>

                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning={true}
                        data-placeholder="Digite o conteúdo da avaliação aqui..."
                        onInput={(e) => {
                          // Salvar posição do scroll e cursor antes da atualização
                          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                          const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                          
                          // Salvar posição do cursor
                          const selection = window.getSelection();
                          let cursorPosition = null;
                          if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            cursorPosition = {
                              startContainer: range.startContainer,
                              startOffset: range.startOffset,
                              endContainer: range.endContainer,
                              endOffset: range.endOffset
                            };
                          }
                          
                          const html = e.currentTarget.innerHTML;
                          
                          // Extrair título do conteúdo HTML automaticamente
                          const tempDiv = document.createElement('div');
                          tempDiv.innerHTML = html;
                          
                          // Procurar por texto que contenha "AVALIAÇÃO:" para extrair o título
                          const textoCompleto = tempDiv.textContent || '';
                          const linhas = textoCompleto.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                          
                          let tituloExtraido = '';
                          for (const linha of linhas) {
                            if (linha.toUpperCase().includes('AVALIAÇÃO:')) {
                              // Extrair o título após "AVALIAÇÃO:"
                              const match = linha.match(/AVALIAÇÃO:\s*(.+?)(\?|$)/i);
                              if (match && match[1]) {
                                tituloExtraido = match[1].trim();
                                break;
                              }
                            }
                          }
                          
                          // Atualizar tanto o conteúdo HTML quanto o título
                          setDadosEdicao(prev => ({ 
                            ...prev, 
                            conteudo_html: html,
                            titulo: tituloExtraido || prev.titulo // Manter título anterior se não encontrar novo
                          }));
                          
                          // Usar requestAnimationFrame para garantir que a atualização aconteça após o render
                          requestAnimationFrame(() => {
                            // Restaurar posição do scroll
                            window.scrollTo(scrollLeft, scrollTop);
                            
                            // Restaurar posição do cursor se possível
                            if (cursorPosition && selection) {
                              try {
                                const newRange = document.createRange();
                                newRange.setStart(cursorPosition.startContainer, cursorPosition.startOffset);
                                newRange.setEnd(cursorPosition.endContainer, cursorPosition.endOffset);
                                selection.removeAllRanges();
                                selection.addRange(newRange);
                              } catch (e) {
                                // Ignorar erros de seleção
                                console.log('Erro ao restaurar cursor:', e);
                              }
                            }
                          });
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const text = e.clipboardData.getData('text/plain');
                          document.execCommand('insertText', false, text);
                        }}
                        onKeyDown={(e) => {
                          // Atalhos de teclado
                          if (e.ctrlKey || e.metaKey) {
                            switch (e.key) {
                              case 'b':
                                e.preventDefault();
                                executarComando('bold');
                                break;
                              case 'i':
                                e.preventDefault();
                                executarComando('italic');
                                break;
                              case 'u':
                                e.preventDefault();
                                executarComando('underline');
                                break;
                              case 'z':
                                e.preventDefault();
                                if (e.shiftKey) {
                                  // Ctrl+Shift+Z = Refazer
                                  executarComando('redo');
                                } else {
                                  // Ctrl+Z = Desfazer
                                  executarComando('undo');
                                }
                                break;
                              case 'y':
                                e.preventDefault();
                                // Ctrl+Y = Refazer (alternativo)
                                executarComando('redo');
                                break;
                            }
                          }
                        }}
                        onMouseEnter={() => {}}
                        onMouseLeave={() => {}}
                        onMouseMove={() => {
                          // O cursor preto é aplicado via CSS
                        }}
                        onFocus={() => {
                          // Prevenir scroll automático no foco
                        }}
                        onBlur={() => {
                          // Salvar posição quando perder foco
                          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                          const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                          
                          requestAnimationFrame(() => {
                            window.scrollTo(scrollLeft, scrollTop);
                          });
                        }}
                        className="editor-content min-h-[400px] p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 prose prose-indigo max-w-none
                          prose-headings:text-gray-900 prose-headings:hover:bg-blue-50 prose-headings:hover:rounded
                          prose-p:text-gray-700 prose-p:hover:bg-blue-50 prose-p:hover:rounded prose-p:hover:px-2 prose-p:hover:py-1
                          prose-strong:text-gray-900
                          prose-ul:text-gray-700 prose-ul:hover:bg-blue-50 prose-ul:hover:rounded prose-ul:hover:px-2 prose-ul:hover:py-1
                          prose-ol:text-gray-700 prose-ol:hover:bg-blue-50 prose-ol:hover:rounded prose-ol:hover:px-2 prose-ol:hover:py-1
                          prose-li:text-gray-700 prose-li:hover:bg-blue-50 prose-li:hover:rounded prose-li:hover:px-1
                          prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h1:hover:px-2 prose-h1:hover:py-1
                          prose-h2:text-xl prose-h2:font-semibold prose-h2:mb-3 prose-h2:hover:px-2 prose-h2:hover:py-1
                          prose-h3:text-lg prose-h3:font-medium prose-h3:mb-2 prose-h3:hover:px-2 prose-h3:hover:py-1
                          hover:bg-gray-50 transition-colors duration-200
                          empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:italic
                          cursor-none"

                        style={{ 
                          backgroundColor: 'white',
                          lineHeight: '1.6',
                          minHeight: '400px',
                          cursor: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'20\' viewBox=\'0 0 16 20\'%3E%3Cpath d=\'M8 0 L8 20 M4 2 L12 2 M4 18 L12 18\' stroke=\'%23000000\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") 8 10, text', // Cursor preto personalizado
                          caretColor: '#000000',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text',
                          userSelect: 'text',
                          scrollBehavior: 'auto',
                          contain: 'layout style'
                        }}
                      >
                        {/* Conteúdo será inserido via JavaScript para evitar re-renders */}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        💡 Use a barra de ferramentas para formatar. <strong>Ctrl+Z</strong> desfaz, <strong>Ctrl+Y</strong> refaz. Posição mantida durante edição.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <AvaliacaoStructuredView 
                  conteudoHtml={avaliacao.conteudo_html}
                />
              )}
            </div>
          </Card>
        </div>
      </div>


    </Layout>
  );
};

export default VisualizarAvaliacao;