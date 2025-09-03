import { useState, useEffect } from 'react';

const MENU_FIXED_KEY = '@app-professor:menu-fixed';

export const useMenuFixed = () => {
  const [isMenuFixed, setIsMenuFixed] = useState(() => {
    const stored = localStorage.getItem(MENU_FIXED_KEY);
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem(MENU_FIXED_KEY, JSON.stringify(isMenuFixed));
  }, [isMenuFixed]);

  const toggleMenuFixed = () => {
    setIsMenuFixed((prev: boolean) => !prev);
  };

  return {
    isMenuFixed,
    toggleMenuFixed
  };
}; 