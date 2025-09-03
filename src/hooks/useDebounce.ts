import { useState, useEffect } from 'react';

/**
 * Hook personalizado para implementar debounce em valores
 * 
 * @param value - O valor a ser "debouncado"
 * @param delay - O tempo de delay em milissegundos (padrão: 300ms)
 * @returns O valor com debounce aplicado
 * 
 * @example
 * ```typescript
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 * // O debouncedSearchTerm só será atualizado 500ms após a última mudança
 * useEffect(() => {
 *   // Fazer busca apenas quando o valor estabilizar
 *   if (debouncedSearchTerm) {
 *     performSearch(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 * ```
 */
export const useDebounce = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Criar um timer que atualiza o valor após o delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpar o timer se o valor mudar antes do delay
    // Isso previne que o valor seja atualizado se o usuário continuar digitando
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para debounce específico de strings (mais comum para buscas)
 * 
 * @param value - String a ser "debouncada"
 * @param delay - Tempo de delay em milissegundos (padrão: 300ms)
 * @returns String com debounce aplicado
 */
export const useDebounceString = (value: string, delay: number = 300): string => {
  return useDebounce(value, delay);
};

/**
 * Hook para debounce com callback
 * Executa uma função após o valor estabilizar
 * 
 * @param value - Valor a ser monitorado
 * @param callback - Função a ser executada após o debounce
 * @param delay - Tempo de delay em milissegundos (padrão: 300ms)
 * 
 * @example
 * ```typescript
 * const [searchTerm, setSearchTerm] = useState('');
 * 
 * useDebounceCallback(searchTerm, (term) => {
 *   if (term) {
 *     performSearch(term);
 *   }
 * }, 500);
 * ```
 */
export const useDebounceCallback = <T>(
  value: T, 
  callback: (value: T) => void, 
  delay: number = 300
): void => {
  useEffect(() => {
    const handler = setTimeout(() => {
      callback(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, callback, delay]);
};

export default useDebounce; 