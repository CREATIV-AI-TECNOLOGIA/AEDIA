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



export function capitalizeSentences(text: string): string {
  if (!text) return '';
  // Capitalize the very first letter
  let result = text.charAt(0).toUpperCase() + text.slice(1);
  
  // Capitalize letters after a sentence-ending punctuation mark followed by a space
  result = result.replace(/([.?!]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
  
  return result;
};

/**
 * Extrai HTML puro removendo blocos de código, tags pre/code, aspas e crases
 * @param texto - O texto a ser processado
 * @returns O HTML puro extraído
 */
export function extrairHTMLPuro(texto: string | null | undefined): string {
  if (texto === null || texto === undefined) {
    return "";
  }
  // Remove blocos de código markdown
  let newTexto = texto.replace(/```[a-zA-Z]*\n([\s\S]*?)```/g, '$1');
  // Remove tags <pre> e <code>
  newTexto = newTexto.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, '$1');
  newTexto = newTexto.replace(/<pre>([\s\S]*?)<\/pre>/g, '$1');
  newTexto = newTexto.replace(/<code>([\s\S]*?)<\/code>/g, '$1');
  // Remove aspas duplas ou simples do início/fim
  newTexto = newTexto.trim().replace(/^[\'\"]+|[\'\"]+$/g, '');
  // Remove crases do início/fim
  newTexto = newTexto.replace(/^`+|`+$/g, '');
  return newTexto.trim();
}