/**
 * Capitaliza a primeira letra de um texto
 * @param text - O texto a ser capitalizado
 * @returns O texto com a primeira letra maiúscula
 */
export const capitalizeFirstLetter = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Verifica se um campo é do tipo email baseado no name, id, type ou placeholder
 * @param fieldInfo - Informações do campo (name, id, type, placeholder)
 * @returns true se for um campo de email
 */
export const isEmailField = (fieldInfo: {
  name?: string;
  id?: string;
  type?: string;
  placeholder?: string;
}): boolean => {
  const { name, id, type, placeholder } = fieldInfo;
  
  if (type === 'email') return true;
  
  const emailKeywords = ['email', 'e-mail', 'mail'];
  const fieldsToCheck = [name, id, placeholder].filter(Boolean).map(field => field!.toLowerCase());
  
  return fieldsToCheck.some(field => 
    emailKeywords.some(keyword => field.includes(keyword))
  );
};

/**
 * Hook para ser usado em campos de entrada que aplica capitalização automática
 * exceto para campos de email
 * @param onChange - Função de mudança original
 * @param fieldInfo - Informações do campo para detectar se é email
 * @returns Função de onChange modificada
 */
export const useAutoCapitalize = (
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
  fieldInfo?: {
    name?: string;
    id?: string;
    type?: string;
    placeholder?: string;
  }
) => {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Extrair o valor do evento original sem modificá-lo
    const originalValue = e.target.value;
    
    if (fieldInfo && !isEmailField(fieldInfo)) {
      const capitalizedValue = capitalizeFirstLetter(originalValue);
      
      // Se o valor foi modificado, criar um novo evento sintético compatível
      if (capitalizedValue !== originalValue) {
        // Preservar todas as propriedades do evento original
        const target = e.target;
        
        // Criar um novo evento sintético que mantém compatibilidade com React
        const syntheticEvent = {
          ...e,
          target: {
            ...target,
            value: capitalizedValue
          },
          currentTarget: {
            ...e.currentTarget,
            value: capitalizedValue
          }
        } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
        
        // Preservar métodos importantes do evento original
        Object.defineProperty(syntheticEvent, 'persist', {
          value: e.persist?.bind(e) || (() => {}),
          writable: false
        });
        
        Object.defineProperty(syntheticEvent, 'preventDefault', {
          value: e.preventDefault.bind(e),
          writable: false
        });
        
        Object.defineProperty(syntheticEvent, 'stopPropagation', {
          value: e.stopPropagation.bind(e),
          writable: false
        });
        
        onChange(syntheticEvent);
      } else {
        // Se não houve mudança, usar o evento original
        onChange(e);
      }
    } else {
      // Para campos de email, usar o evento original sem modificações
      onChange(e);
    }
  };
};

/**
 * Aplica capitalização em tempo real a um valor de input
 * Use esta função quando você tem controle direto sobre o valor
 * @param value - Valor atual
 * @param isEmail - Se é um campo de email (opcional, pode ser inferido)
 * @param fieldInfo - Informações do campo para auto-detectar se é email
 * @returns Valor capitalizado ou original se for email
 */
export const applyAutoCapitalize = (
  value: string,
  isEmail?: boolean,
  fieldInfo?: {
    name?: string;
    id?: string;
    type?: string;
    placeholder?: string;
  }
): string => {
  if (isEmail || (fieldInfo && isEmailField(fieldInfo))) {
    return value;
  }
  return capitalizeFirstLetter(value);
};

/**
 * Versão alternativa mais simples que evita modificação de eventos
 * Retorna uma função que pode ser usada diretamente com onChange
 * @param setValue - Função para definir o valor do estado
 * @param fieldInfo - Informações do campo para detectar se é email
 * @returns Função de onChange que aplica capitalização automaticamente
 */
export const createAutoCapitalizeHandler = (
  setValue: (value: string) => void,
  fieldInfo?: {
    name?: string;
    id?: string;
    type?: string;
    placeholder?: string;
  }
) => {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    const shouldCapitalize = fieldInfo ? !isEmailField(fieldInfo) : true;
    
    if (shouldCapitalize) {
      setValue(capitalizeFirstLetter(value));
    } else {
      setValue(value);
    }
  };
};

export function capitalizeSentences(text: string): string {
  if (!text) return '';
  // Capitalize the very first letter
  let result = text.charAt(0).toUpperCase() + text.slice(1);
  
  // Capitalize letters after a sentence-ending punctuation mark followed by a space
  result = result.replace(/([.?!]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
  
  return result;
}; 