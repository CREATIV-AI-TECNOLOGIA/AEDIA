import React from 'react';

interface ColorBoxProps {
  name: string;
  colorClass: string;
  hexCode: string;
  description?: string;
}

const ColorBox: React.FC<ColorBoxProps> = ({ name, colorClass, hexCode, description }) => (
  <div className="group relative overflow-hidden rounded-lg shadow-sm hover:shadow-araruama transition-all duration-300">
    <div className={`h-20 ${colorClass} relative`}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity flex items-center justify-center">
        <span className="text-white text-xs font-medium px-2 py-1 bg-black/50 rounded">
          {hexCode}
        </span>
      </div>
    </div>
    <div className="p-3 bg-white">
      <h4 className="font-medium text-araruama-gray-800 text-sm">{name}</h4>
      <p className="text-xs text-araruama-gray-500 font-mono">{hexCode}</p>
      {description && (
        <p className="text-xs text-araruama-gray-600 mt-1">{description}</p>
      )}
    </div>
  </div>
);

const ColorPalette: React.FC = () => {
  const blueColors = [
    { name: 'Blue 50', colorClass: 'bg-araruama-blue-50', hexCode: '#f0f8ff', description: 'Backgrounds sutis' },
    { name: 'Blue 100', colorClass: 'bg-araruama-blue-100', hexCode: '#e0f2ff', description: 'Seções destacadas' },
    { name: 'Blue 200', colorClass: 'bg-araruama-blue-200', hexCode: '#bae5ff', description: 'Elementos secundários' },
    { name: 'Blue 300', colorClass: 'bg-araruama-blue-300', hexCode: '#7dd3fc', description: 'Hover states' },
    { name: 'Blue 400', colorClass: 'bg-araruama-blue-400', hexCode: '#38bdf8', description: 'Interativos' },
    { name: 'Blue 500', colorClass: 'bg-araruama-blue-500', hexCode: '#0ea5e9', description: 'Principal' },
    { name: 'Blue 600', colorClass: 'bg-araruama-blue-600', hexCode: '#0284c7', description: 'Hover botões' },
    { name: 'Blue 700', colorClass: 'bg-araruama-blue-700', hexCode: '#0369a1', description: 'Headers' },
    { name: 'Blue 800', colorClass: 'bg-araruama-blue-800', hexCode: '#1e3a8a', description: 'Textos importantes' },
    { name: 'Blue 900', colorClass: 'bg-araruama-blue-900', hexCode: '#1e293b', description: 'Contraste máximo' },
  ];

  const orangeColors = [
    { name: 'Orange 50', colorClass: 'bg-araruama-orange-50', hexCode: '#fff7ed', description: 'Backgrounds sutis' },
    { name: 'Orange 100', colorClass: 'bg-araruama-orange-100', hexCode: '#ffedd5', description: 'Alertas suaves' },
    { name: 'Orange 200', colorClass: 'bg-araruama-orange-200', hexCode: '#fed7aa', description: 'Elementos secundários' },
    { name: 'Orange 300', colorClass: 'bg-araruama-orange-300', hexCode: '#fdba74', description: 'Hover states' },
    { name: 'Orange 400', colorClass: 'bg-araruama-orange-400', hexCode: '#fb923c', description: 'Botões secundários' },
    { name: 'Orange 500', colorClass: 'bg-araruama-orange-500', hexCode: '#f97316', description: 'Call-to-actions' },
    { name: 'Orange 600', colorClass: 'bg-araruama-orange-600', hexCode: '#ea580c', description: 'Hover botões' },
    { name: 'Orange 700', colorClass: 'bg-araruama-orange-700', hexCode: '#c2410c', description: 'Textos importantes' },
    { name: 'Orange 800', colorClass: 'bg-araruama-orange-800', hexCode: '#9a3412', description: 'Destaque' },
    { name: 'Orange 900', colorClass: 'bg-araruama-orange-900', hexCode: '#7c2d12', description: 'Contraste alto' },
  ];

  const greenColors = [
    { name: 'Green 50', colorClass: 'bg-araruama-green-50', hexCode: '#f0fdf4', description: 'Success backgrounds' },
    { name: 'Green 100', colorClass: 'bg-araruama-green-100', hexCode: '#dcfce7', description: 'Notificações positivas' },
    { name: 'Green 200', colorClass: 'bg-araruama-green-200', hexCode: '#bbf7d0', description: 'Elementos secundários' },
    { name: 'Green 300', colorClass: 'bg-araruama-green-300', hexCode: '#86efac', description: 'Hover states' },
    { name: 'Green 400', colorClass: 'bg-araruama-green-400', hexCode: '#4ade80', description: 'Indicadores positivos' },
    { name: 'Green 500', colorClass: 'bg-araruama-green-500', hexCode: '#22c55e', description: 'Botões de sucesso' },
    { name: 'Green 600', colorClass: 'bg-araruama-green-600', hexCode: '#16a34a', description: 'Hover botões' },
    { name: 'Green 700', colorClass: 'bg-araruama-green-700', hexCode: '#15803d', description: 'Textos de sucesso' },
    { name: 'Green 800', colorClass: 'bg-araruama-green-800', hexCode: '#166534', description: 'Elementos importantes' },
    { name: 'Green 900', colorClass: 'bg-araruama-green-900', hexCode: '#14532d', description: 'Contraste alto' },
  ];

  const grayColors = [
    { name: 'Gray 50', colorClass: 'bg-araruama-gray-50', hexCode: '#f8fafc', description: 'Backgrounds' },
    { name: 'Gray 100', colorClass: 'bg-araruama-gray-100', hexCode: '#f1f5f9', description: 'Separadores sutis' },
    { name: 'Gray 200', colorClass: 'bg-araruama-gray-200', hexCode: '#e2e8f0', description: 'Bordas' },
    { name: 'Gray 300', colorClass: 'bg-araruama-gray-300', hexCode: '#cbd5e1', description: 'Elementos desabilitados' },
    { name: 'Gray 400', colorClass: 'bg-araruama-gray-400', hexCode: '#94a3b8', description: 'Placeholders' },
    { name: 'Gray 500', colorClass: 'bg-araruama-gray-500', hexCode: '#64748b', description: 'Textos secundários' },
    { name: 'Gray 600', colorClass: 'bg-araruama-gray-600', hexCode: '#475569', description: 'Textos normais' },
    { name: 'Gray 700', colorClass: 'bg-araruama-gray-700', hexCode: '#334155', description: 'Textos principais' },
    { name: 'Gray 800', colorClass: 'bg-araruama-gray-800', hexCode: '#1e293b', description: 'Headers' },
    { name: 'Gray 900', colorClass: 'bg-araruama-gray-900', hexCode: '#0f172a', description: 'Contraste máximo' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-araruama-blue-50 via-araruama-orange-50 to-white min-h-screen">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-araruama-blue-800 mb-4">
          Paleta de Cores Araruama Educar
        </h1>
        <p className="text-araruama-gray-600 max-w-3xl mx-auto">
          Inspirada na beleza natural de Araruama - suas águas cristalinas, o sol vibrante e a energia educacional. 
          Esta paleta reflete a identidade única da cidade e sua vocação para a educação de qualidade.
        </p>
      </div>

      {/* Demonstração de Componentes */}
      <div className="mb-12 bg-white rounded-2xl p-8 shadow-araruama">
        <h2 className="text-2xl font-bold text-araruama-blue-800 mb-6">Componentes em Ação</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-araruama-blue-700 hover:bg-araruama-blue-800 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 shadow-md">
            Botão Principal
          </button>
          <button className="bg-araruama-orange-500 hover:bg-araruama-orange-600 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 shadow-md">
            Botão Secundário
          </button>
          <button className="bg-araruama-green-500 hover:bg-araruama-green-600 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 shadow-md">
            Botão Sucesso
          </button>
          <input 
            placeholder="Campo de texto" 
            className="border-2 border-araruama-gray-200 focus:border-araruama-blue-500 focus:ring-2 focus:ring-araruama-blue-500/20 px-4 py-2 rounded-lg transition-all outline-none"
          />
        </div>
      </div>

      {/* Paleta de Cores */}
      <div className="space-y-12">
        {/* Azul - Cor Principal */}
        <section>
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-araruama-blue-500 rounded-full mr-4"></div>
            <div>
              <h2 className="text-2xl font-bold text-araruama-blue-800">Azul Araruama</h2>
              <p className="text-araruama-gray-600">Águas cristalinas da lagoa e do oceano Atlântico</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {blueColors.map((color) => (
              <ColorBox key={color.name} {...color} />
            ))}
          </div>
        </section>

        {/* Laranja - Educação */}
        <section>
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-araruama-orange-500 rounded-full mr-4"></div>
            <div>
              <h2 className="text-2xl font-bold text-araruama-blue-800">Laranja Educação</h2>
              <p className="text-araruama-gray-600">Energia educacional, sol nascente e criatividade</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {orangeColors.map((color) => (
              <ColorBox key={color.name} {...color} />
            ))}
          </div>
        </section>

        {/* Verde - Crescimento */}
        <section>
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-araruama-green-500 rounded-full mr-4"></div>
            <div>
              <h2 className="text-2xl font-bold text-araruama-blue-800">Verde Crescimento</h2>
              <p className="text-araruama-gray-600">Crescimento educacional, natureza e sustentabilidade</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {greenColors.map((color) => (
              <ColorBox key={color.name} {...color} />
            ))}
          </div>
        </section>

        {/* Cinza - Neutro */}
        <section>
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-araruama-gray-500 rounded-full mr-4"></div>
            <div>
              <h2 className="text-2xl font-bold text-araruama-blue-800">Cinza Neutro</h2>
              <p className="text-araruama-gray-600">Elegância, modernidade e profissionalismo</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {grayColors.map((color) => (
              <ColorBox key={color.name} {...color} />
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-araruama-gray-500">
        <p>Paleta criada com 💙 para a educação de Araruama 🏖️📚</p>
      </div>
    </div>
  );
};

export default ColorPalette; 