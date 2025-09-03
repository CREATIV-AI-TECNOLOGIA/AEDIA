import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { getUnreadNotifications, markNotificationAsRead, Notification, markAllNotificationsAsRead } from '../../services/notificationService';
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css'; // Supondo que você terá um CSS module

import SeletorEscolaModal from './SeletorEscolaModal';
import { Search, X } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
  className?: string;
  titulo?: string;
  subtitulo?: string;
  icone?: React.ReactNode;
  mostrarEscola?: boolean;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

// Removido URL externa do Freesound para evitar erro ORB
// const NOTIFICATION_SOUND_URL = 'https://cdn.freesound.org/previews/242/242857_4284964-lq.mp3';
const NOTIFICATION_SOUND_URL = null; // Som desabilitado temporariamente

const Header: React.FC<HeaderProps> = ({ 
  onMenuToggle, 
  className, 
  titulo = "Calendário escolar",
  subtitulo,
  icone,
  showSearch,
  searchValue,
  onSearchChange,
  searchPlaceholder
}) => {
  const { user, professorData } = useAuth();
  const navigate = useNavigate();
  const [avatarError, setAvatarError] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [bellShouldShake, setBellShouldShake] = useState(false);
  const notificationSoundRef = useRef<HTMLAudioElement>(null);
  
  // Usar o hook personalizado de notificações
  const { notifications, markAsRead, markConversationAsRead } = useNotifications(user?.id);

  const isDiretora = user?.user_metadata?.role === 'diretora';

  // Efeito para destravar o áudio após a primeira interação do usuário
  useEffect(() => {
    if (!NOTIFICATION_SOUND_URL) return;
    
    const unlockAudio = () => {
      notificationSoundRef.current?.play().catch(e => console.error("Erro ao destravar áudio:", e));
      notificationSoundRef.current?.pause();
      // Remove o listener após a primeira interação para não rodar desnecessariamente
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Efeito para tocar som quando há novas notificações
  useEffect(() => {
    if (notifications.length > 0) {
      setBellShouldShake(true);
      if (NOTIFICATION_SOUND_URL) {
        notificationSoundRef.current?.play().catch(e => console.error("Erro ao tocar som de notificação:", e));
      }
      setTimeout(() => setBellShouldShake(false), 500);
    }
  }, [notifications.length]);

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.type === 'new_message' && notification.data.conversa_id) {
      navigate(`/chat-interno?conversaId=${notification.data.conversa_id}`);
    }
    await markAsRead(notification.id);
    setIsNotificationOpen(false);
  };

  const handleClearAll = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.id);
    setIsNotificationOpen(false);
  };

  return (
    <header className={`
      bg-white/60 backdrop-blur-md border-b border-gray-200/80 shadow-sm
      sticky top-0 z-50 transition-all duration-300
      ${className || ''}
    `}>
      {NOTIFICATION_SOUND_URL && (
        <audio ref={notificationSoundRef} src={NOTIFICATION_SOUND_URL} preload="auto" />
      )}
      <div className="px-6 py-4 flex items-center justify-between h-24">
        <div className="flex items-center space-x-4 flex-1">
          {/* Botão do menu mobile */}
          <button
            onClick={onMenuToggle}
            className="md:hidden p-1.5 rounded-full bg-transparent text-gray-500 hover:bg-gray-200/80 hover:text-gray-700 focus:outline-none transition-all duration-200"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
          
          {/* Título da Página - Layout vertical */}
          <div className="flex flex-col">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">
                {titulo}
              </h1>
            </div>
            {subtitulo && (
              <div className="flex items-center text-gray-600 mt-1">
                {icone && <span className="mr-2">{icone}</span>}
                <span className="text-sm">{subtitulo}</span>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar Central - só aparece quando showSearch é true */}
        {showSearch && (
          <div className="hidden md:flex flex-1 max-w-lg mx-6">
            <div className="relative w-full">
              <div className="relative flex items-center rounded-xl border-2 border-indigo-200 bg-white shadow-lg hover:shadow-xl focus-within:shadow-xl focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100/50 transition-all duration-200">
                <Search className="w-5 h-5 absolute left-4 text-indigo-500" />
                <input
                  type="text"
                  value={searchValue || ''}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder={searchPlaceholder || 'Buscar...'}
                  className="w-full py-3 pl-12 pr-12 bg-transparent text-slate-800 placeholder-slate-500 outline-none rounded-xl text-sm font-medium"
                />
                {searchValue && (
                  <button 
                    onClick={() => onSearchChange?.('')}
                    className="absolute right-4 p-1.5 rounded-full hover:bg-slate-100 transition-all duration-200"
                  >
                    <X className="w-4 h-4 text-slate-500 hover:text-red-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Itens à Direita do Header */}
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* 1. Notificações */}
          <div className={styles.notificationContainer}>
            <button onClick={() => setIsNotificationOpen(prev => !prev)} className={`${styles.notificationButton} ${bellShouldShake ? styles.shake : ''}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {notifications.length > 0 && (
                <span className={styles.notificationBadge}>{notifications.length}</span>
              )}
            </button>
            {isNotificationOpen && (
              <div className={styles.notificationDropdown}>
                <div className={styles.dropdownHeader}>
                  <h4>Notificações</h4>
                  <button onClick={handleClearAll} className={styles.clearAllButton}>Limpar todas</button>
                </div>
                {notifications.length > 0 ? (
                  <ul>
                    {notifications.map(notif => (
                      <li key={notif.id} onClick={() => handleNotificationClick(notif)}>
                        <strong>{notif.data.sender_name}</strong> enviou uma mensagem:
                        <p>"{notif.data.message_preview}..."</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.noNotifications}>Nenhuma nova notificação</div>
                )}
              </div>
            )}
          </div>

          {/* 2. Seletor de Escola Modal */}
          {!isDiretora && (
            <div className="flex items-center">
              <SeletorEscolaModal />
            </div>
          )}
         
          {/* 3. Nome do Professor */}
          <span className="text-sm font-medium text-gray-700 truncate max-w-[120px] md:max-w-[150px] transition-colors duration-300 hover:text-gray-800">
            {professorData?.nome || user?.user_metadata?.nome || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Professor'}
          </span>
            
          {/* 4. Avatar do usuário com efeitos */}
          <div className="relative group/avatar">
            {((professorData?.avatar_url || user?.user_metadata?.avatar_url) && !avatarError) ? (
              <img
                src={professorData?.avatar_url || user?.user_metadata?.avatar_url}
                alt="Perfil"
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white/50 shadow-md transition-all duration-300 group/avatar:scale-110 group/avatar:ring-indigo-300"
                onError={() => setAvatarError(true)}
              />
            ) : !avatarError ? (
              <img 
                src="https://avatar.iran.liara.run/public/girl" 
                alt="Avatar Padrão"
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white/50 shadow-md transition-all duration-300 group/avatar:scale-110 group/avatar:ring-indigo-300"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-white/50 shadow-md transition-all duration-300 group/avatar:scale-110 group/avatar:ring-indigo-300">
                <span className="text-white text-lg font-medium">
                  {(user?.email?.[0] || 'P').toUpperCase()}
                </span>
              </div>
            )}
            {/* Indicador online */}
            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-sm animate-pulse"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;