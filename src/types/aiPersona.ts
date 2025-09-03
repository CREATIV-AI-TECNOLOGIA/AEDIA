export interface AIPersonaConfig {
  id: string;
  professorId: string;
  name: string;
  description: string;
  personality: AIPersonality;
  teachingStyle: TeachingStyle;
  communicationStyle: CommunicationStyle;
  expertise: ExpertiseArea[];
  customInstructions: string;
  contextPreferences: ContextPreferences;
  responseFormat: ResponseFormat;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIPersonality {
  tone: 'formal' | 'casual' | 'friendly' | 'professional' | 'enthusiastic' | 'calm';
  empathy: 'high' | 'medium' | 'low';
  humor: 'none' | 'light' | 'moderate' | 'frequent';
  patience: 'high' | 'medium' | 'low';
  encouragement: 'constant' | 'moderate' | 'minimal';
  criticalThinking: 'socratic' | 'direct' | 'guided' | 'exploratory';
}

export interface TeachingStyle {
  methodology: 'construtivista' | 'tradicional' | 'montessori' | 'waldorf' | 'freinet' | 'hibrida';
  approach: 'visual' | 'auditivo' | 'cinestesico' | 'multimodal';
  difficulty: 'adaptativo' | 'progressivo' | 'desafiador' | 'suportivo';
  feedback: 'imediato' | 'detalhado' | 'construtivo' | 'motivacional';
  assessment: 'formativa' | 'somativa' | 'diagnostica' | 'peer-review';
}

export interface CommunicationStyle {
  language: 'pt-BR' | 'en-US' | 'es-ES';
  formality: 'muito-formal' | 'formal' | 'semi-formal' | 'informal' | 'muito-informal';
  complexity: 'simples' | 'intermediario' | 'avancado' | 'adaptativo';
  examples: 'muitos' | 'moderados' | 'poucos' | 'sob-demanda';
  analogies: 'frequentes' | 'ocasionais' | 'raras' | 'nunca';
  questioningStyle: 'socratico' | 'direto' | 'exploratório' | 'reflexivo';
}

export interface ExpertiseArea {
  subject: string;
  level: 'iniciante' | 'intermediario' | 'avancado' | 'especialista';
  focus: string[];
  methodologies: string[];
}

export interface ContextPreferences {
  includeStudentData: boolean;
  includeClassHistory: boolean;
  includeLessonPlans: boolean;
  includeAssessments: boolean;
  includeSchoolInfo: boolean;
  includePersonalNotes: boolean;
  contextDepth: 'minimal' | 'standard' | 'detailed' | 'comprehensive';
  memoryRetention: 'session' | 'daily' | 'weekly' | 'permanent';
}

export interface ResponseFormat {
  structure: 'livre' | 'topicos' | 'numerada' | 'markdown' | 'academica';
  length: 'concisa' | 'media' | 'detalhada' | 'extensiva';
  includeReferences: boolean;
  includeSuggestions: boolean;
  includeQuestions: boolean;
  includeResources: boolean;
  visualElements: 'nenhum' | 'emojis' | 'diagramas' | 'tabelas' | 'todos';
}

export interface AIMemory {
  id: string;
  professorId: string;
  personaId: string;
  type: 'conversation' | 'preference' | 'insight' | 'pattern' | 'feedback';
  content: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  context: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

export interface AIInsight {
  id: string;
  professorId: string;
  type: 'teaching_pattern' | 'student_need' | 'content_gap' | 'improvement_suggestion';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  suggestions: string[];
  data: Record<string, any>;
  createdAt: Date;
}

export interface PersonaTemplate {
  id: string;
  name: string;
  description: string;
  category: 'metodologia' | 'disciplina' | 'nivel' | 'personalidade';
  config: Partial<AIPersonaConfig>;
  isPublic: boolean;
  rating: number;
  usageCount: number;
} 