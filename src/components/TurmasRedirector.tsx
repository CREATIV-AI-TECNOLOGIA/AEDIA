import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEscola } from '../context/EscolaContext';
import { supabase } from '../lib/supabaseClient';
import Turmas from '../pages/Turmas';

interface TurmaData {
  id: number;
  nome: string;
  ano: string;
  escola_id: number;
  created_at: string;
  disciplina: string;
  modalidade: string;
  modalidade_id?: number;
  periodo: string;
  professor_id?: string;
  professor_nome?: string;
  alunos_count?: number;
}

const TurmasRedirector: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { escolaAtiva, loadingEscolas } = useEscola();
  const [loading, setLoading] = useState(true);
  const [shouldShowTurmas, setShouldShowTurmas] = useState(false);

  const isProfessor = userProfile === 'professor';
  const isGestor = userProfile === 'diretora';

  useEffect(() => {
    const checkTurmasAndRedirect = async () => {
      // Aguarda dados necessários
      if (userProfile === null || loadingEscolas || !escolaAtiva || !user) {
        return;
      }

      // Gestor sempre vê a lista
      if (!isProfessor || isGestor) {
        setShouldShowTurmas(true);
        setLoading(false);
        return;
      }

      try {
        // Buscar ID numérico do professor
        const { data: professorData, error: professorError } = await supabase
          .from('professores')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (professorError || !professorData) {
          setShouldShowTurmas(true);
          setLoading(false);
          return;
        }

        const professorId = professorData.id;

        // Buscar turmas do professor na escola ativa
        const { data: turmasDoProf, error: profError } = await supabase
          .from('professores_turmas_disciplinas')
          .select('turma_id, turmas!inner(id, escola_id)')
          .eq('professor_id', professorId)
          .eq('turmas.escola_id', escolaAtiva.id);

        if (profError) {
          setShouldShowTurmas(true);
          setLoading(false);
          return;
        }

        const turmaIds = turmasDoProf?.map((t) => t.turma_id) || [];
        const uniqueTurmaIds = [...new Set(turmaIds)];

        if (uniqueTurmaIds.length > 0) {
          // Redireciona diretamente para a primeira turma
          navigate(`/turmas/${uniqueTurmaIds[0]}`, { replace: true });
          return;
        }

        // Sem turmas: mostra a lista (vazia)
        setShouldShowTurmas(true);
        setLoading(false);
      } catch (error) {
        setShouldShowTurmas(true);
        setLoading(false);
      }
    };

    checkTurmasAndRedirect();
  }, [isProfessor, isGestor, loadingEscolas, escolaAtiva, user, userProfile, navigate]);

  // Loading dentro do conteúdo, sem ocupar tela inteira para evitar piscar
  if (loading || userProfile === null) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Renderiza lista de turmas quando aplicável
  if (shouldShowTurmas) {
    return <Turmas />;
  }

  // Fallback
  return null;
};

export default TurmasRedirector;