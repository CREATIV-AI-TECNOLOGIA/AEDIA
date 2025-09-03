export interface ProfessorIAConfiguracoes {
  id?: string;
  professor_id: number;
  escola_id: number;
  
  // Configurações pedagógicas
  metodologia_preferida?: string;
  estilo_ensino?: string;
  nivel_detalhamento: 'basico' | 'medio' | 'detalhado';
  
  // Configurações de conteúdo
  incluir_atividades_praticas: boolean;
  incluir_recursos_digitais: boolean;
  incluir_avaliacao: boolean;
  incluir_materiais_necessarios: boolean;
  incluir_tempo_estimado: boolean;
  
  // Configurações de adaptação
  considerar_inclusao: boolean;
  considerar_diversidade: boolean;
  adaptar_para_recursos_limitados: boolean;
  
  // Configurações de formato
  formato_preferido: 'estruturado' | 'narrativo' | 'topicos';
  linguagem_nivel: 'formal' | 'informal' | 'academico';
  
  // Configurações específicas para planos trimestrais
  preferencias_avaliacao?: string;
  recursos_disponiveis?: string;
  efemerides_periodo?: string;
  eventos_escolares?: string;
  
  // Observações personalizadas
  observacoes_especiais?: string;
  contexto_escola?: string;
  
  // Metadados
  created_at?: string;
  updated_at?: string;
}

export const METODOLOGIAS_OPCOES = [
  { value: 'construtivista', label: 'Construtivista - O aluno constrói seu próprio conhecimento' },
  { value: 'tradicional', label: 'Tradicional - Ensino direto com foco no conteúdo' },
  { value: 'montessori', label: 'Montessori - Aprendizado através da exploração livre' },
  { value: 'waldorf', label: 'Waldorf - Desenvolvimento integral com arte e criatividade' },
  { value: 'freinet', label: 'Freinet - Aprendizado cooperativo e expressão livre' },
  { value: 'sociointeracionista', label: 'Sociointeracionista - Aprendizado através da interação social' },
  { value: 'cognitivista', label: 'Cognitivista - Foco nos processos mentais de aprendizagem' },
  { value: 'behaviorista', label: 'Behaviorista - Aprendizado através de estímulos e recompensas' },
  { value: 'humanista', label: 'Humanista - Valoriza a experiência e autonomia do aluno' },
  { value: 'mista', label: 'Abordagem Mista - Combina diferentes metodologias' }
];

export const ESTILOS_ENSINO_OPCOES = [
  { value: 'visual', label: 'Visual - Uso de imagens, gráficos e recursos visuais' },
  { value: 'auditivo', label: 'Auditivo - Explicações verbais, discussões e música' },
  { value: 'cinestesico', label: 'Cinestésico - Atividades práticas e movimento' },
  { value: 'leitura_escrita', label: 'Leitura/Escrita - Textos, anotações e exercícios escritos' },
  { value: 'misto', label: 'Misto - Combina diferentes estilos de aprendizagem' }
];

export const NIVEL_DETALHAMENTO_OPCOES = [
  { value: 'basico', label: 'Básico', description: 'Planos mais simples e diretos' },
  { value: 'medio', label: 'Médio', description: 'Planos com detalhamento equilibrado' },
  { value: 'detalhado', label: 'Detalhado', description: 'Planos muito completos e específicos' }
];

export const FORMATO_PREFERIDO_OPCOES = [
  { value: 'estruturado', label: 'Estruturado', description: 'Formato organizado em seções claras' },
  { value: 'narrativo', label: 'Narrativo', description: 'Formato mais fluido e descritivo' },
  { value: 'topicos', label: 'Tópicos', description: 'Formato em lista de pontos principais' }
];

export const LINGUAGEM_NIVEL_OPCOES = [
  { value: 'formal', label: 'Formal', description: 'Linguagem técnica e profissional' },
  { value: 'informal', label: 'Informal', description: 'Linguagem mais acessível e prática' },
  { value: 'academico', label: 'Acadêmico', description: 'Linguagem científica e rigorosa' }
];

// Configurações padrão para novos professores - APENAS o mínimo necessário
export const CONFIGURACOES_PADRAO: Omit<ProfessorIAConfiguracoes, 'id' | 'professor_id' | 'escola_id' | 'created_at' | 'updated_at'> = {
  metodologia_preferida: undefined,
  estilo_ensino: undefined,
  nivel_detalhamento: 'medio', // Apenas este campo tem padrão pois é obrigatório
  incluir_atividades_praticas: false, // Professor deve escolher explicitamente
  incluir_recursos_digitais: false,
  incluir_avaliacao: false,
  incluir_materiais_necessarios: false,
  incluir_tempo_estimado: false,
  considerar_inclusao: false,
  considerar_diversidade: false,
  adaptar_para_recursos_limitados: false,
  formato_preferido: 'estruturado', // Apenas este campo tem padrão pois é obrigatório
  linguagem_nivel: 'formal', // Apenas este campo tem padrão pois é obrigatório
  preferencias_avaliacao: undefined,
  recursos_disponiveis: undefined,
  efemerides_periodo: undefined,
  eventos_escolares: undefined,
  observacoes_especiais: undefined,
  contexto_escola: undefined
}; 