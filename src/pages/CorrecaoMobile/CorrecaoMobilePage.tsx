import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';

const CorrecaoMobilePage: React.FC = () => {
  const navigate = useNavigate();

  // Redirecionar automaticamente para o scanner
  useEffect(() => {
    navigate('/correcao-mobile/escanear');
  }, [navigate]);

  return (\n    &lt;div className=&quot;min-h-screen bg-slate-50&quot;&gt;\n      &lt;div className=&quot;page-center px-4 sm:px-6 lg:px-8 pt-8 pb-16&quot;&gt;\n        &lt;div className=&quot;standard-page-card space-y-6 text-center&quot;&gt;\n          &lt;div className=&quot;w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6&quot;&gt;\n            &lt;Camera className=&quot;w-12 h-12 text-blue-600&quot; /&gt;\n          &lt;/div&gt;\n          &lt;h1 className=&quot;text-xl font-bold text-gray-900 mb-2&quot;&gt;\n            Scanner de Avaliações\n          &lt;/h1&gt;\n          &lt;p className=&quot;text-gray-600&quot;&gt;\n            Redirecionando para o scanner...\n          &lt;/p&gt;\n        &lt;/div&gt;\n      &lt;/div&gt;\n    &lt;/div&gt;\n  );
};

export default CorrecaoMobilePage;