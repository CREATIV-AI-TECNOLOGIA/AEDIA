import React, { useState } from 'react';

// URL base para o serviço de avatares DiceBear (mais estável)
const AVATAR_API_BASE_URL = 'https://api.dicebear.com/8.x/initials/svg';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  className?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  className = '',
  status,
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Obter as iniciais do nome
  const getInitials = () => {
    if (!name) return '';
    
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };
  
  const sizeStyles = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };
  
  const shapeStyles = {
    circle: 'rounded-full',
    square: 'rounded-md',
  };
  
  const statusStyles = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
  };
  
  const bgColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  const getBackgroundColor = () => {
    if (!name) return bgColors[0];
    const firstChar = name.charAt(0).toLowerCase();
    const charCode = firstChar.charCodeAt(0);
    return bgColors[charCode % bgColors.length];
  };
  
  // Garantir que a URL do avatar seja válida
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const avatarUrl = (src && isValidUrl(src)) ? src : `${AVATAR_API_BASE_URL}?seed=${encodeURIComponent(name || 'U')}&size=48`;

  // Debug para verificar os dados recebidos
  React.useEffect(() => {
    if (src) {
      console.log('🖼️ Avatar Component Debug:', {
        src,
        name,
        isValidUrl: isValidUrl(src || ''),
        size,
        finalUrl: avatarUrl
      });
    }
  }, [src, name, size, avatarUrl]);

  const avatarStyle = {
    width: sizeStyles[size],
  };
  
  return (
    <div className={`relative inline-flex ${className}`}>
      {(src && isValidUrl(src) && !imageError) ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={`${sizeStyles[size]} ${shapeStyles[shape]} object-cover`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div 
          className={`${sizeStyles[size]} ${shapeStyles[shape]} ${getBackgroundColor()} flex items-center justify-center text-white font-medium`}
        >
          {getInitials()}
        </div>
      )}
      
      {status && (
        <span 
          className={`absolute bottom-0 right-0 block border-2 border-white ${statusStyles[status]} rounded-full w-2.5 h-2.5`}
        />
      )}
    </div>
  );
};

export default Avatar;