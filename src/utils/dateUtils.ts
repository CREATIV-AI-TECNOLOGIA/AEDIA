/**
 * Retorna uma saudação adequada com base na hora do dia.
 * @returns {string} Saudação (Bom dia, Boa tarde ou Boa noite)
 */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'Bom dia';
  } else if (hour >= 12 && hour < 18) {
    return 'Boa tarde';
  } else {
    return 'Boa noite';
  }
};

/**
 * Retorna a classe CSS adequada para o gradiente de cores baseado na hora do dia.
 * @returns {string} Classe CSS para o gradiente
 */
export const getGreetingGradientClass = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'text-gradient-morning'; // Azul-claro para manhã
  } else if (hour >= 12 && hour < 18) {
    return 'text-gradient-afternoon'; // Dourado para tarde
  } else {
    return 'text-gradient-night'; // Violeta para noite
  }
};

/**
 * Retorna as classes CSS para o ícone e fundo com base na hora do dia.
 * @returns {object} Objeto com as classes para ícone e fundo
 */
export const getTimeBasedClasses = (): { icon: string, background: string, text: string } => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return {
      icon: 'text-amber-500',
      background: 'bg-amber-100',
      text: 'text-amber-500'
    }; // Manhã: tons de amarelo/âmbar
  } else if (hour >= 12 && hour < 18) {
    return {
      icon: 'text-orange-500',
      background: 'bg-orange-100',
      text: 'text-orange-500'
    }; // Tarde: tons de laranja
  } else {
    return {
      icon: 'text-indigo-500',
      background: 'bg-indigo-100',
      text: 'text-indigo-500'
    }; // Noite: tons de índigo/roxo
  }
}; 