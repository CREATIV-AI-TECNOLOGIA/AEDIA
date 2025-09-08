import { useCallback } from 'react';

export const useAvaliacaoUtils = () => {
  const getStatusLabel = useCallback((status: string): string => {
    const statusMap: Record<string, string> = {
      'rascunho': 'Rascunho',
      'publicada': 'Publicada',
      'em_andamento': 'Em Andamento',
      'finalizada': 'Finalizada'
    };
    return statusMap[status] || status;
  }, []);

  const getStatusBadgeClass = useCallback((status: string): string => {
    const classMap: Record<string, string> = {
      'rascunho': 'bg-gray-100 text-gray-800',
      'publicada': 'bg-green-100 text-green-800',
      'em_andamento': 'bg-blue-100 text-blue-800',
      'finalizada': 'bg-red-100 text-red-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }, []);

  const getTipoLabel = useCallback((tipo: string): string => {
    const tipoMap: Record<string, string> = {
      'prova': 'Prova',
      'trabalho': 'Trabalho',
      'exercicio': 'Exercício',
      'simulado': 'Simulado'
    };
    return tipoMap[tipo] || tipo;
  }, []);

  const exportarPDF = useCallback(() => {
    try {
      // Implementação simplificada - em produção, usar biblioteca como jsPDF
      window.print();
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF. Tente novamente.');
    }
  }, []);

  const exportarWord = useCallback(() => {
    try {
      // Implementação simplificada - em produção, usar biblioteca como docx
      const conteudo = document.querySelector('.editor-content')?.innerHTML || '';
      const blob = new Blob([`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Avaliação</title>
        </head>
        <body>
          ${conteudo}
        </body>
        </html>
      `], { type: 'application/msword' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'avaliacao.doc';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar Word:', error);
      alert('Erro ao exportar Word. Tente novamente.');
    }
  }, []);

  const imprimir = useCallback(() => {
    try {
      window.print();
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      alert('Erro ao imprimir. Tente novamente.');
    }
  }, []);

  const limparQuestoes = useCallback(() => {
    const editor = document.querySelector('.editor-content') as HTMLElement;
    if (editor) {
      editor.innerHTML = '';
      editor.focus();
    }
  }, []);

  const renumerarQuestoes = useCallback(() => {
    const editor = document.querySelector('.editor-content') as HTMLElement;
    if (!editor) return;

    const questoes = editor.querySelectorAll('p, div');
    let numeroQuestao = 1;

    questoes.forEach((questao) => {
      const texto = questao.textContent || '';
      if (texto.match(/^\d+[.)]/)) {
        questao.innerHTML = questao.innerHTML.replace(/^\d+[.)]/, `${numeroQuestao}.`);
        numeroQuestao++;
      }
    });
  }, []);

  const criarNovaQuestao = useCallback(() => {
    const editor = document.querySelector('.editor-content') as HTMLElement;
    if (!editor) return;

    const questoes = editor.querySelectorAll('p, div');
    const numeroProximaQuestao = questoes.length + 1;

    const novaQuestao = document.createElement('p');
    novaQuestao.innerHTML = `${numeroProximaQuestao}. `;
    
    editor.appendChild(novaQuestao);
    
    // Posicionar cursor no final da nova questão
    const range = document.createRange();
    const selection = window.getSelection();
    
    range.setStart(novaQuestao, 1);
    range.setEnd(novaQuestao, 1);
    
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    editor.focus();
  }, []);

  return {
    getStatusLabel,
    getStatusBadgeClass,
    getTipoLabel,
    exportarPDF,
    exportarWord,
    imprimir,
    limparQuestoes,
    renumerarQuestoes,
    criarNovaQuestao
  };
};