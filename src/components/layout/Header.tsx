import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { getUnreadNotifications, markNotificationAsRead, Notification, markAllNotificationsAsRead } from '../../services/notificationService';
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css'; // Supondo que você terá um CSS module

import SeletorEscolaModal from './SeletorEscolaModal';
import { Search, X, Sparkles } from 'lucide-react';
import Avatar from '../ui/Avatar';

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
  // Novo: callback para alternar a aparência da Sidebar
  onToggleSidebarStyle?: () => void;
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
  searchPlaceholder,
  onToggleSidebarStyle
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

  const avatarSrc = professorData?.avatar_url || (user as any)?.user_metadata?.avatar_url || undefined;
  const avatarName = professorData?.nome || (user as any)?.user_metadata?.full_name || user?.email || 'Usuário';

  return (
    <header className={`
      h-[64px] bg-white/60 backdrop-blur-md border-b border-gray-200
      sticky top-0 z-20 transition-all duration-300
      ${className || ''}
    `}>
      {NOTIFICATION_SOUND_URL && (
        <audio ref={notificationSoundRef} src={NOTIFICATION_SOUND_URL} preload="auto" />
      )}
      <div className="px-6 h-full flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
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
                  className="w-full py-2.5 pl-12 pr-12 bg-transparent text-slate-800 placeholder-slate-500 outline-none rounded-xl text-sm font-medium"
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
        <div className="flex items-center space-x-3 md:space-x-4 flex-shrink-0">
          {/* 1. Notificações */}
          <div className={styles.notificationContainer}>
            <button onClick={() => setIsNotificationOpen(prev => !prev)} className={`${styles.notificationButton} ${bellShouldShake ? styles.shake : ''}`} aria-label="Abrir notificações">
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
              <div className={styles.notificationDropdown} role="menu" aria-label="Notificações">
                <div className={styles.dropdownHeader}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Notificações</h3>
                    {notifications.length >= 2 && (
                      <button onClick={handleClearAll} className="text-xs text-blue-600 hover:underline">Marcar todas como lidas</button>
                    )}
                  </div>
                </div>
                <div className={styles.dropdownContent}>
                  {notifications.length === 0 ? (
                    <p className={styles.noNotifications}>Sem notificações</p>
                  ) : (
                    notifications.map((n) => (
                      <button key={n.id} onClick={() => handleNotificationClick(n)} className={styles.notificationItem}>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{n.title || 'Nova mensagem'}</p>
                          <p className="text-xs text-gray-500">{n.message || 'Você tem uma nova mensagem'}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Avatar/Perfil */}
          <button className={`${styles.avatarButton} flex items-center gap-2 rounded-full p-1 focus:outline-none focus-visible:outline-none focus:ring-0`} aria-label="Abrir perfil">
            <Avatar 
              src={avatarSrc}
              name={avatarName}
              size="sm"
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;