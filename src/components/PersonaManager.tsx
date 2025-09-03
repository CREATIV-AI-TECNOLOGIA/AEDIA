import React, { useState, useEffect } from 'react';
import { 
  User, 
  Plus, 
  Edit3, 
  Trash2, 
  Star, 
  Brain,
  Sparkles,
  Save,
  X,
  Download
} from 'lucide-react';
import { aiPersonaService } from '../services/aiPersonaService';
import { AIPersonaConfig, PersonaTemplate } from '../types/aiPersona';

interface PersonaManagerProps {
  professorId: string;
  activePersona: AIPersonaConfig | null;
  onPersonaChange: (persona: AIPersonaConfig | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

const PersonaManager: React.FC<PersonaManagerProps> = ({
  professorId,
  activePersona,
  onPersonaChange,
  isOpen,
  onClose
}) => {
  const [personas, setPersonas] = useState<AIPersonaConfig[]>([]);
  const [templates, setTemplates] = useState<PersonaTemplate[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingPersona, setEditingPersona] = useState<AIPersonaConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    personality: AIPersonaConfig['personality'];
    teachingStyle: AIPersonaConfig['teachingStyle'];
    communicationStyle: AIPersonaConfig['communicationStyle'];
    expertise: AIPersonaConfig['expertise'];
    customInstructions: string;
    contextPreferences: AIPersonaConfig['contextPreferences'];
    responseFormat: AIPersonaConfig['responseFormat'];
  }>({
    name: '',
    description: '',
    personality: {
      tone: 'friendly',
      empathy: 'high',
      humor: 'light',
      patience: 'high',
      encouragement: 'moderate',
      criticalThinking: 'guided'
    },
    teachingStyle: {
      methodology: 'construtivista',
      approach: 'multimodal',
      difficulty: 'adaptativo',
      feedback: 'construtivo',
      assessment: 'formativa'
    },
    communicationStyle: {
      language: 'pt-BR',
      formality: 'semi-formal',
      complexity: 'adaptativo',
      examples: 'moderados',
      analogies: 'ocasionais',
      questioningStyle: 'exploratório'
    },
    expertise: [],
    customInstructions: '',
    contextPreferences: {
      includeStudentData: true,
      includeClassHistory: true,
      includeLessonPlans: true,
      includeAssessments: true,
      includeSchoolInfo: true,
      includePersonalNotes: false,
      contextDepth: 'standard',
      memoryRetention: 'weekly'
    },
    responseFormat: {
      structure: 'topicos',
      length: 'media',
      includeReferences: true,
      includeSuggestions: true,
      includeQuestions: true,
      includeResources: true,
      visualElements: 'emojis'
    }
  });

  useEffect(() => {
    if (isOpen) {
      loadPersonas();
      loadTemplates();
    }
  }, [isOpen, professorId]);

  const loadPersonas = async () => {
    console.log('🔄 Carregando personas...');
    console.log('👤 Professor ID:', professorId);
    
    try {
      const personasList = await aiPersonaService.getPersonas(professorId);
      console.log('📋 Personas carregadas:', personasList.length);
      console.log('🎭 Personas:', personasList.map(p => ({ 
        name: p.name, 
        isActive: p.isActive,
        hasCustomInstructions: !!p.customInstructions,
        customInstructionsLength: p.customInstructions?.length || 0
      })));
      setPersonas(personasList);
    } catch (error) {
      console.error('❌ Erro ao carregar personas:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const templatesList = await aiPersonaService.getPersonaTemplates();
      setTemplates(templatesList);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const handleCreatePersona = async () => {
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const newPersona = await aiPersonaService.createPersona(professorId, {
        ...formData,
        professorId,
        isActive: false
      });
      
      setPersonas([...personas, newPersona]);
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar persona:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePersona = async () => {
    if (!editingPersona) return;

    console.log('💾 Salvando persona...');
    console.log('📝 Dados do formulário:', {
      name: formData.name,
      customInstructions: formData.customInstructions,
      hasCustomInstructions: !!formData.customInstructions,
      customInstructionsLength: formData.customInstructions?.length || 0
    });

    setLoading(true);
    try {
      const updatedPersona = await aiPersonaService.updatePersona(editingPersona.id, formData);
      
      console.log('✅ Persona atualizada retornada:', {
        name: updatedPersona.name,
        customInstructions: updatedPersona.customInstructions,
        hasCustomInstructions: !!updatedPersona.customInstructions,
        customInstructionsLength: updatedPersona.customInstructions?.length || 0
      });
      
      setPersonas(personas.map(p => p.id === editingPersona.id ? updatedPersona : p));
      setEditingPersona(null);
      resetForm();
      
      if (activePersona?.id === editingPersona.id) {
        onPersonaChange(updatedPersona);
      }
      
      alert('Persona atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar persona:', error);
      alert(`Erro ao atualizar persona: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (persona: AIPersonaConfig) => {
    console.log('🎭 Ativando persona:', persona.name);
    console.log('👤 Professor ID:', professorId);
    console.log('🆔 Persona ID:', persona.id);
    
    try {
      await aiPersonaService.setActivePersona(professorId, persona.id);
      console.log('✅ Persona ativada com sucesso');
      
      // Atualizar estado local
      const updatedPersonas = personas.map(p => ({ ...p, isActive: p.id === persona.id }));
      setPersonas(updatedPersonas);
      
      // Notificar componente pai
      onPersonaChange(persona);
      
      // Feedback visual
      alert(`Persona "${persona.name}" ativada com sucesso!`);
      
    } catch (error) {
      console.error('❌ Erro ao ativar persona:', error);
      alert(`Erro ao ativar persona: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleDeactivateAll = async () => {
    if (!confirm('Tem certeza que deseja desativar todas as personas? Você ficará sem assistente personalizada.')) {
      return;
    }

    try {
      await aiPersonaService.deactivateAllPersonas(professorId);
      console.log('✅ Todas as personas desativadas');
      
      // Atualizar estado local
      const updatedPersonas = personas.map(p => ({ ...p, isActive: false }));
      setPersonas(updatedPersonas);
      
      // Notificar componente pai
      onPersonaChange(null);
      
      // Feedback visual
      alert('Todas as personas foram desativadas com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao desativar personas:', error);
      alert(`Erro ao desativar personas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleDeletePersona = async (persona: AIPersonaConfig) => {
    if (!confirm(`Tem certeza que deseja deletar a persona "${persona.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await aiPersonaService.deletePersona(persona.id);
      console.log('✅ Persona deletada');
      
      // Atualizar estado local
      const updatedPersonas = personas.filter(p => p.id !== persona.id);
      setPersonas(updatedPersonas);
      
      // Se a persona deletada estava ativa, notificar componente pai
      if (persona.isActive) {
        onPersonaChange(null);
      }
      
      // Feedback visual
      alert(`Persona "${persona.name}" deletada com sucesso!`);
      
    } catch (error) {
      console.error('❌ Erro ao deletar persona:', error);
      alert(`Erro ao deletar persona: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleCreateFromTemplate = async (template: PersonaTemplate) => {
    console.log('🎭 Criando persona do template:', template.name);
    setLoading(true);
    
    try {
      const newPersona = await aiPersonaService.createPersonaFromTemplate(
        professorId, 
        template.id, 
        { name: `${template.name} - Personalizada` }
      );
      
      console.log('✅ Persona criada com sucesso:', newPersona);
      setPersonas([...personas, newPersona]);
      setShowTemplates(false);
      
      // Mostrar feedback de sucesso
      alert(`Persona "${newPersona.name}" criada com sucesso!`);
      
    } catch (error) {
      console.error('❌ Erro ao criar persona do template:', error);
      alert(`Erro ao criar persona: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      personality: {
        tone: 'friendly',
        empathy: 'high',
        humor: 'light',
        patience: 'high',
        encouragement: 'moderate',
        criticalThinking: 'guided'
      },
      teachingStyle: {
        methodology: 'construtivista',
        approach: 'multimodal',
        difficulty: 'adaptativo',
        feedback: 'construtivo',
        assessment: 'formativa'
      },
      communicationStyle: {
        language: 'pt-BR',
        formality: 'semi-formal',
        complexity: 'adaptativo',
        examples: 'moderados',
        analogies: 'ocasionais',
        questioningStyle: 'exploratório'
      },
      expertise: [],
      customInstructions: '',
      contextPreferences: {
        includeStudentData: true,
        includeClassHistory: true,
        includeLessonPlans: true,
        includeAssessments: true,
        includeSchoolInfo: true,
        includePersonalNotes: false,
        contextDepth: 'standard',
        memoryRetention: 'weekly'
      },
      responseFormat: {
        structure: 'topicos',
        length: 'media',
        includeReferences: true,
        includeSuggestions: true,
        includeQuestions: true,
        includeResources: true,
        visualElements: 'emojis'
      }
    });
  };

  const startEdit = (persona: AIPersonaConfig) => {
    console.log('✏️ Iniciando edição da persona:', persona.name);
    console.log('📝 Instruções personalizadas carregadas:', {
      customInstructions: persona.customInstructions,
      hasCustomInstructions: !!persona.customInstructions,
      customInstructionsLength: persona.customInstructions?.length || 0
    });
    
    setEditingPersona(persona);
    setFormData({
      name: persona.name,
      description: persona.description,
      personality: persona.personality,
      teachingStyle: persona.teachingStyle,
      communicationStyle: persona.communicationStyle,
      expertise: persona.expertise,
      customInstructions: persona.customInstructions,
      contextPreferences: persona.contextPreferences,
      responseFormat: persona.responseFormat
    });
    setShowCreateForm(true);
    
    console.log('📋 FormData definido com instruções:', {
      customInstructions: persona.customInstructions,
      hasCustomInstructions: !!persona.customInstructions
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Gerenciar Personas de IA</h2>
                <p className="text-blue-100">Personalize sua assistente educacional</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!showCreateForm && !showTemplates ? (
            <>
              {/* Ações */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Suas Personas</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={loadPersonas}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                    title="Recarregar personas"
                  >
                    <Brain className="w-4 h-4" />
                    <span>Recarregar</span>
                  </button>
                  <button
                    onClick={handleDeactivateAll}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
                    title="Desativar todas as personas"
                  >
                    <X className="w-4 h-4" />
                    <span>Desativar Todas</span>
                  </button>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Templates</span>
                  </button>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Persona</span>
                  </button>
                </div>
              </div>

              {/* Lista de Personas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personas.map((persona) => (
                  <div
                    key={persona.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      persona.isActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          persona.isActive ? 'bg-blue-500' : 'bg-gray-400'
                        }`}>
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{persona.name}</h4>
                          <p className="text-sm text-gray-600">{persona.description}</p>
                        </div>
                      </div>
                      {persona.isActive && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-xs font-medium">Ativa</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 mb-3">
                      <span className="font-medium">Tom:</span> {persona.personality.tone} • 
                      <span className="font-medium ml-1">Metodologia:</span> {persona.teachingStyle.methodology}
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleSetActive(persona)}
                        disabled={persona.isActive}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          persona.isActive
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {persona.isActive ? 'Ativa' : 'Ativar'}
                      </button>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => startEdit(persona)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePersona(persona)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {personas.length === 0 && (
                  <div className="col-span-2 text-center py-12">
                    <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma persona criada</h3>
                    <p className="text-gray-600 mb-4">Crie sua primeira persona personalizada ou use um template</p>
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => setShowTemplates(true)}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        Ver Templates
                      </button>
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Criar Nova
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : showTemplates ? (
            <>
              {/* Templates */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Templates de Personas</h3>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Voltar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="p-4 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </div>
                      <div className="flex items-center space-x-1 text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-xs">{template.rating}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-3">
                      <span className="bg-gray-100 px-2 py-1 rounded">{template.category}</span>
                      <span className="ml-2">{template.usageCount} usos</span>
                    </div>

                    <button
                      onClick={() => handleCreateFromTemplate(template)}
                      disabled={loading}
                      className={`w-full px-3 py-2 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 ${
                        loading 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Criando...</span>
                        </>
                      ) : (
                        <span>Usar Template</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Formulário de Criação/Edição */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingPersona ? 'Editar Persona' : 'Nova Persona'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingPersona(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>

              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4">Informações Básicas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Persona</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Professora Ana - Matemática"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Especialista em ensino de matemática..."
                      />
                    </div>
                  </div>
                </div>

                {/* Personalidade */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4">Personalidade</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tom</label>
                      <select
                        value={formData.personality.tone}
                        onChange={(e) => setFormData({
                          ...formData,
                          personality: { ...formData.personality, tone: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="formal">Formal</option>
                        <option value="casual">Casual</option>
                        <option value="friendly">Amigável</option>
                        <option value="professional">Profissional</option>
                        <option value="enthusiastic">Entusiástico</option>
                        <option value="calm">Calmo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Empatia</label>
                      <select
                        value={formData.personality.empathy}
                        onChange={(e) => setFormData({
                          ...formData,
                          personality: { ...formData.personality, empathy: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="high">Alta</option>
                        <option value="medium">Média</option>
                        <option value="low">Baixa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Humor</label>
                      <select
                        value={formData.personality.humor}
                        onChange={(e) => setFormData({
                          ...formData,
                          personality: { ...formData.personality, humor: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="none">Nenhum</option>
                        <option value="light">Leve</option>
                        <option value="moderate">Moderado</option>
                        <option value="frequent">Frequente</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Estilo de Ensino */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4">Estilo de Ensino</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Metodologia</label>
                      <select
                        value={formData.teachingStyle.methodology}
                        onChange={(e) => setFormData({
                          ...formData,
                          teachingStyle: { ...formData.teachingStyle, methodology: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="construtivista">Construtivista</option>
                        <option value="tradicional">Tradicional</option>
                        <option value="montessori">Montessori</option>
                        <option value="waldorf">Waldorf</option>
                        <option value="freinet">Freinet</option>
                        <option value="hibrida">Híbrida</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Abordagem</label>
                      <select
                        value={formData.teachingStyle.approach}
                        onChange={(e) => setFormData({
                          ...formData,
                          teachingStyle: { ...formData.teachingStyle, approach: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="visual">Visual</option>
                        <option value="auditivo">Auditivo</option>
                        <option value="cinestesico">Cinestésico</option>
                        <option value="multimodal">Multimodal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                      <select
                        value={formData.teachingStyle.feedback}
                        onChange={(e) => setFormData({
                          ...formData,
                          teachingStyle: { ...formData.teachingStyle, feedback: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="imediato">Imediato</option>
                        <option value="detalhado">Detalhado</option>
                        <option value="construtivo">Construtivo</option>
                        <option value="motivacional">Motivacional</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Instruções Personalizadas */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4">Instruções Personalizadas</h4>
                  <textarea
                    value={formData.customInstructions}
                    onChange={(e) => {
                      console.log('📝 Alterando instruções personalizadas:', e.target.value);
                      setFormData({ ...formData, customInstructions: e.target.value });
                    }}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Instruções específicas para esta persona..."
                  />
                  <div className="mt-2 text-sm text-gray-600">
                    Caracteres: {formData.customInstructions.length}
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingPersona(null);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingPersona ? handleUpdatePersona : handleCreatePersona}
                    disabled={loading || !formData.name.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Salvando...' : editingPersona ? 'Atualizar' : 'Criar'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonaManager; 