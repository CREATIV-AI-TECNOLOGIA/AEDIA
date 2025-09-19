import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CriarTurma: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    ano: new Date().getFullYear().toString(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Obtém o ID da escola do usuário logado (você precisará implementar isso)
      const escola_id = 1; // Por enquanto, usando ID fixo

      const { data, error } = await supabase
        .from('turmas')
        .insert([
          {
            nome: formData.nome,
            ano: formData.ano,
            escola_id: escola_id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Redireciona para a página da turma criada
      navigate(`/turma/${data.id}`);
    } catch (err) {
      console.error('Erro ao criar turma:', err);
      setError('Erro ao criar turma. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Criar Nova Turma</h1>
        </div>
        
        <div className="bg-card rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-gray-100 p-6 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="nome" className="block text-sm font-medium text-muted-foreground mb-1">
                Nome da Turma
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                maxLength={10}
                placeholder="Ex: 1º Ano A"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="ano" className="block text-sm font-medium text-muted-foreground mb-1">
                Ano
              </label>
              <input
                type="text"
                id="ano"
                name="ano"
                value={formData.ano}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                maxLength={4}
                pattern="\\d{4}"
                placeholder="Ex: 2024"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/turmas')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Criando...' : 'Criar Turma'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CriarTurma;