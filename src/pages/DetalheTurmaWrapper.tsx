import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import DetalheTurma from './DetalheTurma';

interface Turma {
  id: number;
  nome: string;
  ano: string;
  periodo: string;
  modalidade_id: number;
  modalidades?: { nome: string } | null;
  professores_turmas_disciplinas?: Array<{
    disciplinas: { nome: string };
  }>;
}

const DetalheTurmaWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [turma, setTurma] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTurmaData();
    }
  }, [id]);

  // Callback para quando a turma mudar no DetalheTurma
  const onTurmaChange = (novaTurma: any) => {
    setTurma(novaTurma);
    // NÃO alterar loading aqui para evitar piscadas
  };

  const fetchTurmaData = async () => {
    try {
      const { data: turmaData, error } = await supabase
        .from('turmas')
        .select(`
          id,
          nome,
          ano,
          periodo,
          modalidade_id,
          modalidades!modalidade_id(nome),
          professores_turmas_disciplinas(
            disciplinas!inner(nome)
          )
        `)
        .eq('id', Number(id))
        .single();

      if (error) {
        console.error('Erro ao buscar turma:', error);
        setTurma(null);
      } else {
        setTurma(turmaData);
      }
    } catch (error) {
      console.error('Erro ao buscar turma:', error);
      setTurma(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0">
      <DetalheTurma onTurmaChange={onTurmaChange} />
    </div>
  );
};

export default DetalheTurmaWrapper;