// Utilitários para conversão de classes CSS hardcoded para classes compatíveis com tema

// Mapeamento de classes problemáticas para classes compatíveis com tema
export const themeClassMap = {
  // Backgrounds
  'bg-white': 'bg-background',
  'bg-gray-50': 'bg-muted',
  'bg-gray-100': 'bg-muted',
  'bg-gray-200': 'bg-border',
  
  // Text colors
  'text-black': 'text-foreground',
  'text-gray-900': 'text-foreground',
  'text-gray-800': 'text-foreground',
  'text-gray-700': 'text-foreground/90',
  'text-gray-600': 'text-muted-foreground',
  'text-gray-500': 'text-muted-foreground',
  
  // Borders
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  'border-gray-100': 'border-border/50',
  
  // Hover states
  'hover:bg-gray-50': 'hover:bg-muted/50',
  'hover:bg-gray-100': 'hover:bg-muted',
  'hover:bg-gray-200': 'hover:bg-muted/80',
  'hover:text-gray-600': 'hover:text-muted-foreground',
  'hover:text-gray-700': 'hover:text-foreground/90',
};

// Função para converter classes CSS hardcoded
export function convertToThemeClasses(className: string): string {
  let convertedClassName = className;
  
  Object.entries(themeClassMap).forEach(([oldClass, newClass]) => {
    const regex = new RegExp(`\\b${oldClass}\\b`, 'g');
    convertedClassName = convertedClassName.replace(regex, newClass);
  });
  
  return convertedClassName;
}

// Classes recomendadas para componentes comuns
export const themeComponents = {
  card: 'bg-card text-card-foreground border border-border rounded-lg shadow-sm',
  cardHeader: 'p-6 pb-4',
  cardContent: 'p-6 pt-0',
  cardFooter: 'p-6 pt-4',
  
  button: {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-ring',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-2 focus:ring-ring',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-ring',
    ghost: 'hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-ring',
  },
  
  input: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  
  select: 'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  
  modal: 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
  modalContent: 'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 rounded-lg',
  
  table: 'w-full caption-bottom text-sm',
  tableHeader: 'border-b border-border',
  tableRow: 'border-b border-border transition-colors hover:bg-muted/50',
  tableCell: 'p-4 align-middle',
  
  loading: 'min-h-screen flex items-center justify-center bg-background text-foreground',
  loadingSpinner: 'animate-spin rounded-full h-12 w-12 border-b-2 border-primary',
};

// Função para aplicar classes de tema a um componente
export function applyThemeClasses(component: keyof typeof themeComponents, variant?: string): string {
  const baseClasses = themeComponents[component];
  
  if (typeof baseClasses === 'object' && variant) {
    return baseClasses[variant as keyof typeof baseClasses] || '';
  }
  
  return typeof baseClasses === 'string' ? baseClasses : '';
}

// Verificar se o tema atual é dark
export function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

// Obter cor CSS baseada no tema
export function getThemeColor(colorVar: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(`--${colorVar}`);
}