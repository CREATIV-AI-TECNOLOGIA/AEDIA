import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase'; // Ajuste o caminho se necessário
import { useAuth } from './AuthContext'; // Para obter o usuário logado
import { logSupabaseError } from '../utils/supabaseErrorHandler';

interface Escola {
  id: number;
  nome: string;
  // Outros campos da escola que possam ser úteis
}

interface EscolaContextType {
  escolasAssociadas: Escola[];
  escolaAtiva: Escola | null;
  setEscolaAtiva: (escola: Escola | null) => void;
  loadingEscolas: boolean;
  professorId: number | null; // Expor professorId para debug ou usos específicos
}

const EscolaContext = createContext<EscolaContextType | undefined>(undefined);

export function EscolaProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [professorId, setProfessorId] = useState<number | null>(null);
  const [escolasAssociadas, setEscolasAssociadas] = useState<Escola[]>([]);
  const [escolaAtiva, setEscolaAtivaState] = useState<Escola | null>(null);
  const [loadingEscolas, setLoadingEscolas] = useState(true);
  const [processingSession, setProcessingSession] = useState(false);

  const processUserSession = useCallback(async () => {
    // Evitar processamento duplicado usando flag específica
    if (processingSession) {
      console.log('[EscolaContext] processUserSession já está em execução, ignorando chamada duplicada');
      return;
    }
    
    setProcessingSession(true);
    setLoadingEscolas(true);
    if (!user) {
      setProfessorId(null);
      setEscolasAssociadas([]);
      setEscolaAtivaState(null);
      setLoadingEscolas(false);
      setProcessingSession(false);
      return;
    }
  
    const userRole = user?.user_metadata?.role;
    let currentProfessorId: number | null = null;
  
    if (userRole === 'professor') {
      try {
        // Buscar professor usando user_id ao invés de email para evitar problemas de RLS
        let { data: professorData, error: professorError } = await supabase
          .from('professores')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
  
        // Fallback: se não encontrou por user_id, tenta buscar por email
        if ((!professorData || professorData.length === 0) && user.email) {
          console.log('[EscolaContext] Professor não encontrado por user_id, tentando buscar por email:', user.email);
          const { data: professorByEmail, error: professorByEmailError } = await supabase
            .from('professores')
            .select('id')
            .eq('email', user.email)
            .limit(1);
          
          if (professorByEmail && professorByEmail.length > 0 && !professorByEmailError) {
            professorData = professorByEmail;
            professorError = null;
            
            // Atualizar o user_id do professor para futuras consultas com controle de concorrência otimista
            try {
              // Primeiro, buscar o registro atual com timestamp para verificação de concorrência
              const { data: currentRecord, error: fetchError } = await supabase
                .from('professores')
                .select('id, user_id, updated_at')
                .eq('id', professorByEmail[0].id)
                .single();
              
              if (fetchError) {
                console.warn('[EscolaContext] Erro ao buscar registro atual do professor:', fetchError);
              } else if (currentRecord) {
                // Verificar se o user_id ainda está null/vazio (evitar sobrescrever se já foi atualizado)
                if (!currentRecord.user_id) {
                  const currentTimestamp = new Date().toISOString();
                  
                  // Atualizar com verificação de concorrência usando updated_at
                  const { data: updateResult, error: updateError } = await supabase
                    .from('professores')
                    .update({ 
                      user_id: user.id,
                      updated_at: currentTimestamp
                    })
                    .eq('id', professorByEmail[0].id)
                    .eq('updated_at', currentRecord.updated_at) // Verificação de concorrência otimista
                    .select('id, user_id, updated_at');
                  
                  if (updateError) {
                    console.warn('[EscolaContext] Erro ao atualizar user_id do professor:', updateError);
                  } else if (updateResult && updateResult.length > 0) {
                    console.log('[EscolaContext] user_id do professor atualizado com sucesso usando controle de concorrência');
                  } else {
                    console.warn('[EscolaContext] Falha na atualização - possível condição de corrida detectada. Registro pode ter sido modificado por outra sessão.');
                    // Tentar buscar novamente para verificar se outro processo já atualizou
                    const { data: recheckData, error: recheckError } = await supabase
                      .from('professores')
                      .select('user_id')
                      .eq('id', professorByEmail[0].id)
                      .single();
                    
                    if (!recheckError && recheckData?.user_id) {
                      console.log('[EscolaContext] user_id já foi atualizado por outra sessão, continuando...');
                    }
                  }
                } else {
                  console.log('[EscolaContext] user_id do professor já está definido, não é necessário atualizar');
                }
              }
            } catch (concurrencyError: any) {
              console.error('[EscolaContext] Erro no controle de concorrência ao atualizar user_id:', concurrencyError);
            }
          }
        }

        if (professorError) {
          logSupabaseError('EscolaContext - Professor ID', professorError, { userId: user.id });
          // Não definir erro aqui, apenas logar e seguir para tentar buscar escolas de outra forma se aplicável
        } else if (professorData && professorData.length > 0) {
          currentProfessorId = professorData[0].id;
          setProfessorId(currentProfessorId);
          console.log('[EscolaContext] Professor encontrado com ID:', currentProfessorId);
        } else {
          console.warn("[EscolaContext] Nenhum professor encontrado na tabela 'professores' para o user_id:", user.id, "nem para o email:", user.email);
        }
      } catch (e: any) {
        console.error('[EscolaContext] Exceção ao buscar ID do professor:', e.message);
      }
    } else {
      setProfessorId(null); // Garante que professorId seja null para não-professores
    }
  
  // Buscar Escolas
  let fetchedEscolas: Escola[] = [];
  try {
    if (userRole === 'diretora') {
      console.log('[EscolaContext] Usuário é Diretora. Buscando todas as escolas.');
      const { data, error } = await supabase.from('escolas').select('id, nome').order('nome');
      if (error) throw error;
      fetchedEscolas = data || [];
    } else if (userRole === 'professor' && currentProfessorId) {
      console.log(`[EscolaContext] Usuário é Professor (ID: ${currentProfessorId}). Buscando escolas associadas.`);
      
      // Primeiro tentar buscar pela escola_id direta na tabela professores
      const { data: professorData, error: professorError } = await supabase
        .from('professores')
        .select('escola_id')
        .eq('id', currentProfessorId)
        .single();
      
      if (!professorError && professorData && professorData.escola_id) {
        // Professor tem uma escola direta
        const { data: escolaData, error: escolaError } = await supabase
          .from('escolas')
          .select('id, nome')
          .eq('id', professorData.escola_id)
          .single();
        
        if (!escolaError && escolaData) {
          fetchedEscolas = [escolaData as Escola];
        }
      } else {
        // Se não tem escola_id direta, verificar se há uma tabela de relacionamento
        console.log('[EscolaContext] Professor sem escola_id direta, verificando relacionamentos...');
        
        // Tentar buscar todas as escolas onde o professor leciona
        const { data: escolasData, error: escolasError } = await supabase
          .from('escolas')
          .select('id, nome')
          .order('nome');
        
        if (!escolasError && escolasData) {
          // Por enquanto, retornar todas as escolas para o professor escolher
          // Futuramente, implementar lógica de relacionamento professor-escola
          fetchedEscolas = escolasData;
          console.log(`[EscolaContext] Professor pode acessar ${escolasData.length} escolas`);
        }
      }
    } else if (userRole === 'professor' && !currentProfessorId){
        console.log('[EscolaContext] Professor sem ID de professor válido, não foi possível buscar escolas associadas.');
    } else {
      console.log('[EscolaContext] Role não é diretora nem professor, ou professor sem ID. Nenhuma escola específica será carregada por default.');
      // Para outros roles, ou se algo deu errado, não carrega escolas automaticamente
    }

    setEscolasAssociadas(fetchedEscolas);

    if (fetchedEscolas.length > 0) {
      const savedEscolaId = localStorage.getItem('escolaAtivaId');
      let escolaParaAtivar: Escola | null = null;
      if (savedEscolaId) {
        escolaParaAtivar = fetchedEscolas.find(e => e.id === parseInt(savedEscolaId)) || null;
        console.log(`[EscolaContext] Escola salva no localStorage: ${savedEscolaId}, encontrada: ${escolaParaAtivar?.nome || 'não'}`);
      }
      if (!escolaParaAtivar) {
        escolaParaAtivar = fetchedEscolas[0];
        console.log(`[EscolaContext] Usando primeira escola disponível: ${escolaParaAtivar.nome}`);
      }
      
      // Só atualizar se for diferente da atual
      if (!escolaAtiva || escolaAtiva.id !== escolaParaAtivar.id) {
        console.log(`[EscolaContext] Definindo escola ativa: ${escolaParaAtivar.nome} (ID: ${escolaParaAtivar.id})`);
        setEscolaAtivaState(escolaParaAtivar);
        localStorage.setItem('escolaAtivaId', escolaParaAtivar.id.toString());
      } else {
        console.log(`[EscolaContext] Escola ativa já é ${escolaAtiva.nome}, não alterando`);
      }
    } else {
      console.log('[EscolaContext] Nenhuma escola encontrada, limpando escola ativa');
      setEscolaAtivaState(null);
      localStorage.removeItem('escolaAtivaId');
    }
  } catch (e: any) {
    console.error('[EscolaContext] Exceção ao buscar escolas:', e.message);
    setEscolasAssociadas([]);
    setEscolaAtivaState(null);
  } finally {
    setLoadingEscolas(false);
    setProcessingSession(false);
  }
}, [user, escolaAtiva]);

useEffect(() => {
  if (!authLoading) {
    processUserSession();
  }
}, [authLoading, processUserSession]);

  const setEscolaAtiva = useCallback((escola: Escola | null) => {
    // Verificar se a escola já é a mesma para evitar atualizações desnecessárias
    if (escolaAtiva && escola && escolaAtiva.id === escola.id) {
      return;
    }
    
    setEscolaAtivaState(escola);
    
    if (escola) {
      localStorage.setItem('escolaAtivaId', escola.id.toString());
    } else {
      localStorage.removeItem('escolaAtivaId');
    }
  }, [escolaAtiva]);
  
  const value = {
    escolasAssociadas,
    escolaAtiva,
    setEscolaAtiva,
    loadingEscolas,
    professorId,
  };

  return (
    <EscolaContext.Provider value={value}>
      {children}
    </EscolaContext.Provider>
  );
}

export function useEscola() {
  const context = useContext(EscolaContext);
  if (context === undefined) {
    throw new Error('useEscola deve ser usado dentro de um EscolaProvider');
  }
  return context;
}