import { useState, useRef, useCallback } from 'react';
import DOMPurify from 'dompurify';

export const useAvaliacaoEditor = () => {
  const [uploadandoImagem, setUploadandoImagem] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const executarComando = useCallback((comando: string) => {
    document.execCommand(comando, false, undefined);
  }, []);

  const abrirSeletorImagem = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploadandoImagem(true);

    try {
      // Converter para base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        
        // Inserir imagem no editor
        const img = document.createElement('img');
        img.src = base64;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.alt = 'Imagem inserida';
        
        // Inserir no cursor atual
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(img);
          
          // Mover cursor após a imagem
          range.setStartAfter(img);
          range.setEndAfter(img);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        
        setUploadandoImagem(false);
      };
      
      reader.onerror = () => {
        alert('Erro ao processar a imagem.');
        setUploadandoImagem(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro no upload da imagem:', error);
      alert('Erro ao fazer upload da imagem.');
      setUploadandoImagem(false);
    }

    // Limpar input
    e.target.value = '';
  }, []);

  const sanitizeHtml = useCallback((html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'span', 'div'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class']
    });
  }, []);

  return {
    uploadandoImagem,
    fileInputRef,
    executarComando,
    abrirSeletorImagem,
    handleFileChange,
    sanitizeHtml
  };
};