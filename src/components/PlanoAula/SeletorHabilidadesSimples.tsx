import React, { useState, useEffect, ChangeEvent } from 'react';

export interface Habilidade {
  id: string;
  codigo: string;
  descricao: string;
}

interface SeletorHabilidadesProps {
  habilidades: Habilidade[];
  habilidadesSelecionadas: Habilidade[];
  onConfirm: (habilidades: Habilidade[]) => void;
  loading?: boolean;
}

const SeletorHabilidadesSimples: React.FC<SeletorHabilidadesProps> = ({
  habilidades,
  habilidadesSelecionadas,
  onConfirm,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [filteredHabilidades, setFilteredHabilidades] = useState<Habilidade[]>(habilidades);
  
  useEffect(() => {
    const initialSelected: Record<string, boolean> = {};
    habilidadesSelecionadas.forEach(hab => {
      initialSelected[hab.id] = true;
    });
    setSelected(initialSelected);
  }, [habilidadesSelecionadas]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredHabilidades(habilidades);
      return;
    }
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    const filtered = habilidades.filter(
      (hab) =>
        hab.codigo.toLowerCase().includes(normalizedSearchTerm) ||
        hab.descricao.toLowerCase().includes(normalizedSearchTerm)
    );
    setFilteredHabilidades(filtered);
  }, [searchTerm, habilidades]);

  const handleCheckboxChange = (habilidade: Habilidade) => {
    setSelected((prev) => ({
      ...prev,
      [habilidade.id]: !prev[habilidade.id]
    }));
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleConfirm = () => {
    const selectedHabilidades = habilidades.filter((h) => selected[h.id]);
    onConfirm(selectedHabilidades);
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Pesquisar habilidades..."
          value={searchTerm}
          onChange={handleSearch}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="text-sm text-gray-600">
          {selectedCount} habilidade(s) selecionada(s)
        </div>
      </div>

      <div className="space-y-2">
        {filteredHabilidades.map((habilidade) => (
          <div
            key={habilidade.id}
            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-200 transition-colors"
          >
            <input
              type="checkbox"
              checked={selected[habilidade.id] || false}
              onChange={() => handleCheckboxChange(habilidade)}
              className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <div>
              <div className="font-medium text-gray-900">{habilidade.codigo}</div>
              <div className="text-gray-600">{habilidade.descricao}</div>
            </div>
          </div>
        ))}
      </div>

      {selectedCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Confirmar seleção
          </button>
        </div>
      )}
    </div>
  );
};

export default SeletorHabilidadesSimples; 