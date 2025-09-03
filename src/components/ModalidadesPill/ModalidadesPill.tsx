import React from 'react';
import { Modalidade } from '../../services/ProfessorService';
import './ModalidadesPill.css';

interface ModalidadesPillProps {
  modalidades: Modalidade[];
  onChange: (modalidade: Modalidade) => void;
  selectedModalidade?: Modalidade | null;
}

const ModalidadesPill: React.FC<ModalidadesPillProps> = ({ 
  modalidades,
  onChange,
  selectedModalidade
}) => {
  if (!modalidades || modalidades.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {modalidades.map((modalidade) => (
        <button
          key={modalidade.id}
          type="button"
          onClick={() => onChange(modalidade)}
          className={`px-4 py-2 rounded-full transition-all duration-200 ${
            selectedModalidade?.id === modalidade.id
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          {modalidade.nome}
        </button>
      ))}
    </div>
  );
};

export default ModalidadesPill; 