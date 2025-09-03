import React, { useState } from 'react';
import { Search, ExternalLink, AlertCircle, Globe } from 'lucide-react';

interface WebSearchIndicatorProps {
  webSearch?: {
    used: boolean;
    sources: string[];
    error?: string;
  };
  isSearching?: boolean;
}

const WebSearchIndicator: React.FC<WebSearchIndicatorProps> = ({ 
  webSearch, 
  isSearching = false 
}) => {
  const [hoveredSource, setHoveredSource] = useState<number | null>(null);

  // Mostrar indicador de busca em andamento
  if (isSearching) {
    return (
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-200">
          <Search className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">Pesquisando na web...</span>
        </div>
      </div>
    );
  }

  // Se não há dados de busca web, não mostrar nada
  if (!webSearch) return null;

  // Se houve erro na busca web
  if (webSearch.error) {
    return (
      <div className="flex items-center justify-center gap-2 py-3">
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full border border-amber-200">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Erro na busca web</span>
        </div>
      </div>
    );
  }

  // Se a busca web foi usada com sucesso
  if (webSearch.used && webSearch.sources.length > 0) {
    return (
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 text-gray-600">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Fontes consultadas</span>
          </div>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {webSearch.sources.slice(0, 6).map((source, index) => (
            <div
              key={index}
              className="relative group"
              onMouseEnter={() => setHoveredSource(index)}
              onMouseLeave={() => setHoveredSource(null)}
            >
              <a
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 group-hover:bg-blue-50"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {getDomainFromUrl(source)}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {getPathFromUrl(source)}
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </a>
              
              {/* Tooltip elegante */}
              {hoveredSource === index && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-[9999]">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 max-w-xs">
                    <div className="text-xs font-medium text-gray-900 mb-1">
                      {getDomainFromUrl(source)}
                    </div>
                    <div className="text-xs text-gray-600 break-all">
                      {source}
                    </div>
                    {/* Seta */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {webSearch.sources.length > 6 && (
          <div className="mt-3 text-center">
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              +{webSearch.sources.length - 6} fontes adicionais
            </span>
          </div>
        )}
      </div>
    );
  }

  return null;
};

/**
 * Extrai o domínio da URL
 */
function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Fonte';
  }
}

/**
 * Extrai o caminho da URL de forma limpa
 */
function getPathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    if (path === '/' || path === '') return 'Página inicial';
    return path.length > 30 ? path.substring(0, 27) + '...' : path;
  } catch {
    return 'Link';
  }
}

export default WebSearchIndicator; 