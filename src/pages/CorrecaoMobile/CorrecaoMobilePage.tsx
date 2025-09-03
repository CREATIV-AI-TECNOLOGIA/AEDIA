import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';

const CorrecaoMobilePage: React.FC = () => {
  const navigate = useNavigate();

  // Redirecionar automaticamente para o scanner
  useEffect(() => {
    navigate('/correcao-mobile/escanear');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Camera className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Scanner de Avaliações
        </h1>
        <p className="text-gray-600">
          Redirecionando para o scanner...
        </p>
      </div>
    </div>
  );
};

export default CorrecaoMobilePage; 