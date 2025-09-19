import React, { useState, useEffect } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import { User, Lock, Palette, Bell, Settings, Briefcase, BookOpen, Clock, Building, Camera, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { 
  getProfessorComModalidades, 
  ProfessorComModalidades, 
  getTurmasDoProfessorDetalhado, 
  TurmaDetalhadaProfessor,
  getEscolaNomeById
} from '../../services/ProfessorService';

const SectionCard: React.FC<{ 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`bg-card shadow-sm rounded-lg p-5 h-full ${className}`}>
    <div className="flex items-center mb-4">
      <Icon className="w-5 h-5 mr-2.5 text-indigo-600" />
      <h2 className="text-lg font-semibold text-foreground/90">{title}</h2>
    </div>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);

const SettingItem: React.FC<{ 
  label: string; 
  children: React.ReactNode; 
  description?: string;
  compact?: boolean;
}> = ({ label, children, description, compact }) => (
  <div className={`${compact ? 'py-2' : 'py-3'} border-b border-border last:border-b-0`}>
    <div className="flex items-center justify-between">
      <div>
        <label className="block text-sm font-medium text-foreground">{label}</label>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="ml-4">{children}</div>
    </div>
  </div>
);

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
  <button
    type="button"
    className={`relative inline-flex items-center h-5 rounded-full w-10 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400 ${
      enabled ? 'bg-indigo-600' : 'bg-muted'
    }`}
    onClick={() => onChange(!enabled)}
  >
    <span
      className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
        enabled ? 'translate-x-5.5' : 'translate-x-1'
      }`}
    />
  </button>
);

const ConfiguracoesPage: React.FC = () => {
  const { user, loading: authLoading, professorData: authProfessorData, refreshProfessorData } = useAuth();

  const [professorData, setProfessorData] = useState<ProfessorComModalidades | null>(null);
  const [turmasProfessor, setTurmasProfessor] = useState<TurmaDetalhadaProfessor[]>([]);
  const [nomeEscola, setNomeEscola] = useState<string | null>(null);
  const [loadingProfileData, setLoadingProfileData] = useState<boolean>(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);

  const userName = authProfessorData?.nome || user?.user_metadata?.name || user?.email?.split('@')[0] || "Usuário";
  const userEmail = user?.email || "email@exemplo.com";

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !authProfessorData?.id) return;

    // Validações
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem.');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Upload para o Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${authProfessorData.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('professor-avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        toast.error('Erro ao fazer upload da imagem.');
        return;
      }

      // Obter URL pública
      const { data } = supabase.storage
        .from('professor-avatars')
        .getPublicUrl(filePath);

      const newAvatarUrl = data.publicUrl;

      // Atualizar banco de dados
      const { error: updateError } = await supabase
        .from('professores')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', authProfessorData.id);

      if (updateError) {
        console.error('Erro ao atualizar professor:', updateError);
        toast.error('Erro ao salvar foto de perfil.');
        return;
      }

      toast.success('Foto de perfil atualizada com sucesso!');
      
      // Atualizar estado local imediatamente
      if (professorData) {
        setProfessorData({
          ...professorData,
          avatar_url: newAvatarUrl
        });
      }

      // Recarregar dados do professor no contexto para atualizar o header
      await refreshProfessorData();
      
      // Atualizar dados locais também
      if (user?.email) {
        const profData = await getProfessorComModalidades(user.email);
        setProfessorData(profData);
      }
      
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao atualizar foto.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    const fetchProfessorProfileData = async () => {
      if (user && user.email && !authLoading) {
        setLoadingProfileData(true);
        try {
          const profData = await getProfessorComModalidades(user.email);
          setProfessorData(profData);

          if (profData) {
            if (profData.id) {
              const turmas = await getTurmasDoProfessorDetalhado(profData.id);
              setTurmasProfessor(turmas);
            }
            if (profData.escola_id) {
              const escola = await getEscolaNomeById(profData.escola_id);
              setNomeEscola(escola);
            }
          }
        } catch (error) {
          console.error("Erro ao buscar dados do perfil do professor:", error);
        } finally {
          setLoadingProfileData(false);
        }
      }
    };

    fetchProfessorProfileData();
  }, [user, authLoading]);

  if (authLoading || loadingProfileData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="ml-3 text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="standard-page-card space-y-6">
          {/* Conteúdo Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Coluna Principal - Perfil */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card Principal do Perfil */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                  <h2 className="text-xl font-semibold mb-2">Perfil do Usuário</h2>
                  <p className="text-indigo-100">Informações pessoais e profissionais</p>
                </div>
                
                <div className="p-6">
                  {/* Foto de Perfil Centralizada */}
                  <div className="flex justify-center mb-6 -mt-12">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                        <img
                          src={professorData?.avatar_url || authProfessorData?.avatar_url || "https://avatar.iran.liara.run/public/girl"}
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <label className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full cursor-pointer transition-all duration-200 shadow-lg hover:scale-110">
                        <Camera size={16} />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={uploadingAvatar}
                        />
                      </label>
                    </div>
                  </div>

                  {uploadingAvatar && (
                    <div className="flex justify-center mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Upload size={16} className="mr-2 animate-pulse" />
                        Enviando nova foto...
                      </div>
                    </div>
                  )}

                  {/* Informações do Perfil */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Nome Completo</label>
                      <p className="text-lg font-semibold text-gray-900">{professorData?.nome || userName}</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <label className="block text-sm font-medium text-gray-500 mb-1">E-mail</label>
                      <p className="text-lg font-semibold text-gray-900">{userEmail}</p>
                    </div>

                    {nomeEscola && (
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <label className="block text-sm font-medium text-blue-600 mb-1">Escola Principal</label>
                        <div className="flex items-center">
                          <Building size={18} className="mr-2 text-blue-500"/>
                          <p className="text-lg font-semibold text-gray-900">{nomeEscola}</p>
                        </div>
                      </div>
                    )}

                    {professorData?.carga_horaria_semanal_total && (
                      <div className="p-4 bg-green-50 rounded-xl">
                        <label className="block text-sm font-medium text-green-600 mb-1">Carga Horária Semanal</label>
                        <div className="flex items-center">
                          <Clock size={18} className="mr-2 text-green-500"/>
                          <p className="text-lg font-semibold text-gray-900">{professorData.carga_horaria_semanal_total}h</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botão Alterar Senha */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
                      <Lock size={18} className="mr-2"/>
                      Alterar Senha
                    </button>
                  </div>
                </div>
              </div>

              {/* Turmas e Disciplinas */}
              {turmasProfessor.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 text-white">
                    <div className="flex items-center">
                      <Briefcase className="w-6 h-6 mr-3" />
                      <div>
                        <h2 className="text-xl font-semibold">Minhas Turmas</h2>
                        <p className="text-blue-100">Disciplinas e turmas que você leciona</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                      {turmasProfessor.map((turma, index) => (
                        <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200">
                          <div className="flex items-start">
                            <div className="p-2 bg-blue-500 rounded-lg">
                              <BookOpen size={16} className="text-white"/>
                            </div>
                            <div className="ml-3 flex-1">
                              <h4 className="font-semibold text-foreground">{turma.nome_turma}</h4>
                              <p className="text-sm text-muted-foreground">{turma.ano_turma}</p>
                              <p className="text-sm font-medium text-blue-600 mt-1">{turma.nome_disciplina}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Coluna Lateral - Preferências */}
            <div className="space-y-6">
              
              {/* Aparência */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 text-white">
                  <div className="flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    <h3 className="text-lg font-semibold">Aparência</h3>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">Modo Escuro</p>
                      <p className="text-sm text-muted-foreground">Interface com tema escuro</p>
                    </div>
                    <ToggleSwitch enabled={darkMode} onChange={setDarkMode} />
                  </div>
                  
                  <div className="p-3 bg-muted rounded-xl">
                    <label className="block font-medium text-foreground mb-2">Tamanho da Fonte</label>
                    <select className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>Pequeno</option>
                      <option selected>Médio</option>
                      <option>Grande</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notificações */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    <h3 className="text-lg font-semibold">Notificações</h3>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">Push</p>
                      <p className="text-sm text-muted-foreground">Alertas do sistema</p>
                    </div>
                    <ToggleSwitch enabled={notificationsEnabled} onChange={setNotificationsEnabled} />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">E-mail</p>
                      <p className="text-sm text-muted-foreground">Atualizações por e-mail</p>
                    </div>
                    <ToggleSwitch enabled={emailNotifs} onChange={setEmailNotifs} />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">Sons</p>
                      <p className="text-sm text-muted-foreground">Sons para notificações</p>
                    </div>
                    <ToggleSwitch enabled={soundsEnabled} onChange={setSoundsEnabled} />
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </PageContainer>
  );
};

export default ConfiguracoesPage;
