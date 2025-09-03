import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

// Interface para os dados do plano de aula
interface PlanoAulaData {
  titulo: string;
  disciplinaNome?: string;
  turmaAno?: string;
  modalidadeNome?: string;
  conteudoHTML: string;
}

// Interface para os dados da avaliação
interface AvaliacaoData {
  id?: string;
  titulo: string;
  disciplinaNome?: string;
  professorNome?: string;
  turmaAno?: string;
  turmaNome?: string;
  modalidade?: string;
  dataAplicacao?: string;
  tempoEstimado?: number;
  notaMaxima?: number;
  tipo?: string;
  codigoIdentificacao?: string; // Código único para identificação automática
  instrucoes?: string; // Campo opcional para instruções customizadas
  conteudoHTML: string;
}

// Função para limpar HTML e extrair texto puro
function htmlToText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

// Função para extrair seções do HTML
function parseHTMLSections(html: string): Array<{ type: 'heading' | 'paragraph' | 'list', content: string, level?: number }> {
  const div = document.createElement('div');
  div.innerHTML = html;
  
  const sections: Array<{ type: 'heading' | 'paragraph' | 'list', content: string, level?: number }> = [];
  
  const elements = div.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, li');
  
  elements.forEach(element => {
    const tagName = element.tagName.toLowerCase();
    const content = element.textContent || '';
    
    if (content.trim()) {
      if (tagName.startsWith('h')) {
        const level = parseInt(tagName.charAt(1));
        sections.push({ type: 'heading', content, level });
      } else if (tagName === 'p') {
        sections.push({ type: 'paragraph', content });
      } else if (tagName === 'ul' || tagName === 'ol' || tagName === 'li') {
        sections.push({ type: 'list', content });
      }
    }
  });
  
  return sections;
}

// Exportar como PDF - Versão 6.1 Final - Sem Emojis + Fonte Arial
export async function exportToPDF(planoData: PlanoAulaData): Promise<void> {
  try {
    // Criar PDF com configurações básicas e confiáveis
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configurações da página
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20; // Margem de 2cm
    const contentWidth = pageWidth - (margin * 2);
    const maxY = pageHeight - margin;
    
    let currentY = margin;
    
    // Função para verificar quebra de página
    const checkNewPage = (neededHeight: number) => {
      if (currentY + neededHeight > maxY) {
        pdf.addPage();
        currentY = margin;
      }
    };

    // Função para remover emojis usando regex robusta
    const removeEmojis = (text: string): string => {
      // Regex abrangente para remover emojis (baseada na documentação encontrada)
      const emojiRegex = /(?:(\ud83c[\udde6-\uddff]){2}|([\#\*0-9]\u20e3)|(?:\u00a9|\u00ae|[\u2000-\u3300]|[\ud83c-\ud83e][\ud000-\udfff])(?:(?:\ud83c[\udffb-\udfff])?(?:\ud83e[\uddb0-\uddb3])?(?:\ufe0f?\u200d(?:[\u2000-\u3300]|[\ud83c-\ud83e][\ud000-\udfff])\ufe0f?)?)*)+/g;
      
      return text.replace(emojiRegex, '').trim();
    };

    // Função para limpar texto preservando acentos mas removendo emojis
    const cleanText = (text: string): string => {
      return removeEmojis(text)
        .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove caracteres de largura zero
        .trim();
    };

    // Função para adicionar texto com fonte Arial (mais próxima da web)
    const addText = (text: string, fontSize: number, isBold: boolean = false, align: 'left' | 'center' = 'left', marginBottom: number = 5) => {
      // Limpar texto removendo emojis e preservando acentos
      const processedText = cleanText(text);
      
      if (!processedText) return;

      // Usar fonte Arial (helvetica no jsPDF - mais próxima das fontes web modernas)
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.setFontSize(fontSize);
      
      // Calcular altura da linha
      const lineHeight = fontSize * 0.5; // Altura em mm otimizada
      
      // Quebrar texto em linhas que cabem na largura
      const maxWidth = contentWidth - 10; // Margem de segurança
      const lines = pdf.splitTextToSize(processedText, maxWidth);
      
      // Verificar se precisa de nova página
      const totalHeight = lines.length * lineHeight + marginBottom;
      checkNewPage(totalHeight);
      
      // Adicionar cada linha
      lines.forEach((line: string) => {
        let x = margin;
        
        if (align === 'center') {
          const textWidth = pdf.getTextWidth(line);
          x = (pageWidth - textWidth) / 2;
        }
        
        pdf.text(line, x, currentY);
        currentY += lineHeight;
      });
      
      currentY += marginBottom;
    };

    // Função para adicionar linha separadora
    const addSeparator = () => {
      checkNewPage(10);
      pdf.setDrawColor(150, 150, 150);
      pdf.setLineWidth(0.5);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;
    };

    // 1. TÍTULO PRINCIPAL
    addText(planoData.titulo, 16, true, 'center', 10);

    // 2. INFORMAÇÕES DO PLANO
    if (planoData.disciplinaNome || planoData.turmaAno || planoData.modalidadeNome) {
      const infoLines = [];
      if (planoData.disciplinaNome) infoLines.push(`Disciplina: ${planoData.disciplinaNome}`);
      if (planoData.turmaAno) infoLines.push(`Ano: ${planoData.turmaAno}`);
      if (planoData.modalidadeNome) infoLines.push(`Modalidade: ${planoData.modalidadeNome}`);
      
      const infoText = infoLines.join(' | ');
      addText(infoText, 10, false, 'center', 15);
    }

    // 3. LINHA SEPARADORA
    addSeparator();

    // 4. PROCESSAR CONTEÚDO HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = planoData.conteudoHTML;
    
    // Função recursiva para processar elementos HTML
    const processElement = (element: Element): void => {
      const tagName = element.tagName?.toLowerCase() || '';
      
      // Para elementos que contêm outros elementos, processar filhos
      if (['div', 'section', 'article', 'main', 'header', 'footer'].includes(tagName)) {
        Array.from(element.children).forEach(child => {
          processElement(child);
        });
        return;
      }
      
      // Para listas, processar cada item
      if (['ul', 'ol'].includes(tagName)) {
        Array.from(element.children).forEach(child => {
          if (child.tagName.toLowerCase() === 'li') {
            processElement(child);
          }
        });
        return;
      }
      
      // Extrair e processar texto do elemento
      let textContent = element.textContent?.trim() || '';
      
      if (!textContent) return;

      // Para itens de lista, adicionar marcador
      if (tagName === 'li') {
        textContent = `• ${textContent}`;
      }

      // Aplicar formatação baseada no tipo de elemento
      switch (tagName) {
        case 'h1':
          addText(textContent, 14, true, 'left', 8);
          break;
        case 'h2':
          addText(textContent, 13, true, 'left', 7);
          break;
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          addText(textContent, 12, true, 'left', 6);
          break;
        case 'p':
          addText(textContent, 11, false, 'left', 6);
          break;
        case 'li':
          addText(textContent, 11, false, 'left', 4);
          break;
        case 'strong':
        case 'b':
          addText(textContent, 11, true, 'left', 4);
          break;
        case 'em':
        case 'i':
          addText(textContent, 11, false, 'left', 4);
          break;
        default:
          // Para outros elementos com texto, tratar como parágrafo
          if (textContent && !['script', 'style', 'meta', 'head'].includes(tagName)) {
            addText(textContent, 11, false, 'left', 6);
          }
          break;
      }
    };

    // Processar conteúdo HTML
    if (tempDiv.children.length > 0) {
      Array.from(tempDiv.children).forEach(element => {
        processElement(element);
      });
    } else {
      // Se não há estrutura HTML, processar como texto simples
      const plainText = tempDiv.textContent || '';
      if (plainText.trim()) {
        // Dividir em parágrafos
        const paragraphs = plainText.split(/\n\s*\n/).filter(p => p.trim());
        paragraphs.forEach(paragraph => {
          addText(paragraph.trim(), 11, false, 'left', 8);
        });
      }
    }

    // 5. RODAPÉ COM NUMERAÇÃO
    const totalPages = (pdf as any).internal.getNumberOfPages();
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      pdf.setPage(pageNum);
      
      // Linha no rodapé
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      // Número da página
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      
      const pageText = `Página ${pageNum} de ${totalPages}`;
      const pageTextWidth = pdf.getTextWidth(pageText);
      pdf.text(pageText, pageWidth - margin - pageTextWidth, pageHeight - 8);
      
      // Data (apenas primeira página)
      if (pageNum === 1) {
        const dateText = `Gerado em ${new Date().toLocaleDateString('pt-BR')}`;
        pdf.text(dateText, margin, pageHeight - 8);
      }
    }

    // 6. SALVAR
    pdf.save(`${planoData.titulo}.pdf`);
    
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    throw new Error('Falha ao exportar como PDF');
  }
}

// Exportar como DOCX
export async function exportToDOCX(planoData: PlanoAulaData): Promise<void> {
  try {
    const sections = parseHTMLSections(planoData.conteudoHTML);
    
    const children: Array<Paragraph> = [];
    
    // Adicionar título
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: planoData.titulo,
            bold: true,
            size: 32,
          }),
        ],
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      })
    );
    
    // Adicionar informações do plano
    if (planoData.disciplinaNome || planoData.turmaAno || planoData.modalidadeNome) {
      const infoText = [
        planoData.disciplinaNome ? `Disciplina: ${planoData.disciplinaNome}` : '',
        planoData.turmaAno ? `Ano: ${planoData.turmaAno}` : '',
        planoData.modalidadeNome ? `Modalidade: ${planoData.modalidadeNome}` : ''
      ].filter(Boolean).join(' | ');
      
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: infoText,
              italics: true,
              size: 20,
            }),
          ],
          spacing: { after: 400 },
        })
      );
    }
    
    // Adicionar conteúdo
    sections.forEach(section => {
      if (section.type === 'heading') {
        const headingLevel = section.level === 1 ? HeadingLevel.HEADING_1 : 
                           section.level === 2 ? HeadingLevel.HEADING_2 : 
                           HeadingLevel.HEADING_3;
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.content,
                bold: true,
                size: section.level === 1 ? 28 : section.level === 2 ? 24 : 20,
              }),
            ],
            heading: headingLevel,
            spacing: { before: 400, after: 200 },
          })
        );
      } else {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.content,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    });
    
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children,
        },
      ],
    });
    
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${planoData.titulo}.docx`);
    
  } catch (error) {
    console.error('Erro ao exportar DOCX:', error);
    throw new Error('Falha ao exportar como DOCX');
  }
}

// Função auxiliar para criar um blob de texto
export function createTextBlob(planoData: PlanoAulaData): Blob {
  const content = `
${planoData.titulo}

${planoData.disciplinaNome ? `Disciplina: ${planoData.disciplinaNome}` : ''}
${planoData.turmaAno ? `Ano: ${planoData.turmaAno}` : ''}
${planoData.modalidadeNome ? `Modalidade: ${planoData.modalidadeNome}` : ''}

${htmlToText(planoData.conteudoHTML)}
  `.trim();
  
  return new Blob([content], { type: 'text/plain;charset=utf-8' });
}

// Exportar Avaliação como PDF - Versão 4.0 - Layout Limpo e Compacto
export async function exportAvaliacaoToPDF(avaliacaoData: AvaliacaoData): Promise<void> {
  try {
    // Criar PDF com configurações básicas e confiáveis
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configurações da página
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 12; // Margem menor para mais espaço
    const contentWidth = pageWidth - (margin * 2);
    const maxY = pageHeight - margin;
    
    let currentY = margin;
    
    // Função para verificar quebra de página
    const checkNewPage = (neededHeight: number) => {
      if (currentY + neededHeight > maxY) {
        pdf.addPage();
        currentY = margin;
        return true;
      }
      return false;
    };

    // Função para remover emojis usando regex robusta
    const removeEmojis = (text: string): string => {
      const emojiRegex = /(?:(\ud83c[\udde6-\uddff]){2}|([\#\*0-9]\u20e3)|(?:\u00a9|\u00ae|[\u2000-\u3300]|[\ud83c-\ud83e][\ud000-\udfff])(?:(?:\ud83c[\udffb-\udfff])?(?:\ud83e[\uddb0-\uddb3])?(?:\ufe0f?\u200d(?:[\u2000-\u3300]|[\ud83c-\ud83e][\ud000-\udfff])\ufe0f?)?)*)+/g;
      return text.replace(emojiRegex, '').trim();
    };

    // Função para limpar texto preservando acentos mas removendo emojis
    const cleanText = (text: string): string => {
      return removeEmojis(text)
        .replace(/\s+/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim();
    };

    // Debug para verificar dados do professor
    console.log('[DEBUG] Dados da avaliação:', {
      professorNome: avaliacaoData.professorNome,
      disciplinaNome: avaliacaoData.disciplinaNome,
      turmaAno: avaliacaoData.turmaAno
    });

    // 1. CABEÇALHO MAIS COMPACTO
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    
    // Verificar se o título já contém "AVALIAÇÃO" para evitar duplicação
    const tituloLimpo = cleanText(avaliacaoData.titulo);
    const titulo = tituloLimpo.toUpperCase().includes('AVALIAÇÃO') 
      ? tituloLimpo 
      : `AVALIAÇÃO: ${tituloLimpo}`;
    const tituloWidth = pdf.getTextWidth(titulo);
    const tituloX = (pageWidth - tituloWidth) / 2;
    pdf.text(titulo, tituloX, currentY + 5);
    
    // CÓDIGO DE IDENTIFICAÇÃO - Destaque especial no canto superior direito
    if (avaliacaoData.codigoIdentificacao) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      
      // Criar um box destacado para o código
      const codigoTexto = `ID: ${avaliacaoData.codigoIdentificacao}`;
      const codigoWidth = pdf.getTextWidth(codigoTexto);
      const boxWidth = codigoWidth + 8;
      const boxHeight = 8;
      const boxX = pageWidth - margin - boxWidth;
      const boxY = margin - 2;
      
      // Desenhar box com borda
      pdf.setDrawColor(0, 0, 0);
      pdf.setFillColor(245, 245, 245); // Cinza claro
      pdf.setLineWidth(1);
      pdf.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'FD'); // F=fill, D=draw
      
      // Texto do código
      pdf.setTextColor(0, 0, 0);
      pdf.text(codigoTexto, boxX + 4, boxY + 5.5);
    }
    
    // Linha horizontal simples
    currentY += 8;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;

    // 2. GRID DE INFORMAÇÕES MAIS COMPACTO
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    const colWidth = contentWidth / 3;
    
    // Linha 1
    let yPos = currentY;
    if (avaliacaoData.disciplinaNome) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Disciplina:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(cleanText(avaliacaoData.disciplinaNome), margin + 18, yPos);
    }
    
    // Verificar se professorNome existe e não está vazio
    const professorNome = avaliacaoData.professorNome?.trim() || 'Professor';
    if (professorNome) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Professor(a):', margin + colWidth, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(cleanText(professorNome), margin + colWidth + 24, yPos);
    }
    
    const dataTexto = avaliacaoData.dataAplicacao 
      ? new Date(avaliacaoData.dataAplicacao).toLocaleDateString('pt-BR')
      : new Date().toLocaleDateString('pt-BR');
    pdf.setFont('helvetica', 'bold');
    pdf.text('Data:', margin + (colWidth * 2), yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(dataTexto, margin + (colWidth * 2) + 12, yPos);
    
    // Linha 2
    yPos += 4;
    if (avaliacaoData.turmaAno) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Ano/Série:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(cleanText(avaliacaoData.turmaAno), margin + 18, yPos);
    }
    
    if (avaliacaoData.turmaNome) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Turma:', margin + colWidth, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(cleanText(avaliacaoData.turmaNome), margin + colWidth + 14, yPos);
    }
    
    if (avaliacaoData.modalidade) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Modalidade:', margin + (colWidth * 2), yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(cleanText(avaliacaoData.modalidade), margin + (colWidth * 2) + 22, yPos);
    }
    
    // Linha 3
    yPos += 4;
    if (avaliacaoData.tipo) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Tipo:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(cleanText(avaliacaoData.tipo), margin + 12, yPos);
    }
    
    if (avaliacaoData.tempoEstimado) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Tempo:', margin + colWidth, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${avaliacaoData.tempoEstimado} min`, margin + colWidth + 14, yPos);
    }
    
    if (avaliacaoData.notaMaxima) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Nota Máxima:', margin + (colWidth * 2), yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${avaliacaoData.notaMaxima} pts`, margin + (colWidth * 2) + 24, yPos);
    }
    
    currentY = yPos + 8;

    // 3. SEÇÃO DO ALUNO OTIMIZADA - NOME E NOTA NA MESMA LINHA
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    
    // Nome do aluno e nota na mesma linha
    pdf.text('Nome do(a) Aluno(a):', margin, currentY);
    
    // Linha para o nome (mais longa)
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(margin + 45, currentY + 1, pageWidth - margin - 60, currentY + 1);
    
    // Campo de nota na mesma linha, mais compacto
    pdf.text('Nota:', pageWidth - margin - 55, currentY);
    pdf.setLineWidth(0.3);
    pdf.line(pageWidth - margin - 35, currentY + 1, pageWidth - margin - 5, currentY + 1);
    
    currentY += 10;

    // 4. INSTRUÇÕES PARA O ALUNO (TOTALMENTE OPCIONAL)
    const instrucoesPersonalizadas = avaliacaoData.instrucoes?.trim();
    
    // Só mostrar instruções se o professor especificou algo
    if (instrucoesPersonalizadas) {
      checkNewPage(20);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.text('INSTRUÇÕES PARA O ALUNO', margin, currentY);
      
      currentY += 5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      
      const instrucoesLines = pdf.splitTextToSize(instrucoesPersonalizadas, pageWidth - 2 * margin);
      pdf.text(instrucoesLines, margin, currentY);
      currentY += instrucoesLines.length * 4 + 10;
    }

    // 6. TÍTULO DAS QUESTÕES COM ESPAÇO ADEQUADO
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('QUESTÕES', margin, currentY);
    
    currentY += 8;

    // 7. PROCESSAR QUESTÕES - PARSER ROBUSTO PARA QUESTÕES REAIS APENAS
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = avaliacaoData.conteudoHTML;
    
    // Primeiro, remover completamente elementos que sabemos que não são questões
    const metadataPatterns = [
      /AVALIAÇÃO:/i,
      /Disciplina:/i,
      /Professor\(a\):/i,
      /Ano\/Série:/i,
      /Turma:/i,
      /Data:/i,
      /Tipo:/i,
      /Tempo:/i,
      /Modalidade:/i,
      /Nota Máxima:/i,
      /Nome do\(a\) Aluno\(a\):/i,
      /Nota:/i,
      /INSTRUÇÕES/i,
      /Leia atentamente/i,
      /Use suas palavras/i,
      /Boa sorte/i
    ];
    
    // Função para verificar se um texto é metadado
    const isMetadata = (text: string): boolean => {
      return metadataPatterns.some(pattern => pattern.test(text));
    };
    
    // Extrair apenas questões reais - ALGORITMO MELHORADO
    const questoesReais: Array<{enunciado: string, alternativas: string[]}> = [];
    
    // Método 1: Buscar por estruturas de questão com numeração MELHORADO
    const todoTexto = tempDiv.textContent || '';
    const linhas = todoTexto.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    
    console.log(`[DEBUG] Total de linhas processadas: ${linhas.length}`);
    
    // Detectar início das questões com padrões mais robustos
    const questoesStartIndex = linhas.findIndex(linha => 
      linha.toLowerCase().includes('questões') || 
      linha.toLowerCase().includes('questão 1') ||
      /^questão\s+\d+/i.test(linha) ||
      /^\d+\.\s/.test(linha) ||
      linha.toLowerCase().includes('questão')
    );
    
    console.log(`[DEBUG] Índice de início das questões: ${questoesStartIndex}`);
    
    if (questoesStartIndex >= 0) {
      // Processar apenas a partir da seção de questões
      const linhasQuestoes = linhas.slice(questoesStartIndex);
      console.log(`[DEBUG] Linhas da seção de questões: ${linhasQuestoes.length}`);
      
      let questaoAtual = '';
      let alternativasAtuais: string[] = [];
      let isInQuestionContext = false;
      let questaoNumero = 0;
      
      for (let i = 0; i < linhasQuestoes.length; i++) {
        const linha = linhasQuestoes[i];
        
        // Pular linhas vazias ou muito curtas
        if (linha.length < 3) continue;
        
        // Pular se for metadado conhecido
        if (isMetadata(linha)) continue;
        
        // Pular linha de separação "QUESTÕES"
        if (linha.toLowerCase() === 'questões') continue;
        
        // Detectar início de nova questão - PADRÕES MELHORADOS
        const isNovaQuestao = (
          /^questão\s+\d+/i.test(linha) || 
          /^\d+\.\s/.test(linha) ||
          /questão\s+\d+/i.test(linha)
        );
        
        if (isNovaQuestao) {
          // Salvar questão anterior se existir
          if (questaoAtual && questaoAtual.length > 10) {
            questoesReais.push({
              enunciado: questaoAtual,
              alternativas: [...alternativasAtuais]
            });
            console.log(`[DEBUG] Questão ${questaoNumero} salva: "${questaoAtual.substring(0, 50)}..."`);
          }
          
          // Limpar para nova questão
          questaoAtual = '';
          alternativasAtuais = [];
          isInQuestionContext = true;
          questaoNumero++;
          console.log(`[DEBUG] Iniciando questão ${questaoNumero}: "${linha}"`);
          continue;
        }
        
        // Se estamos no contexto de questão
        if (isInQuestionContext) {
          // Detectar alternativas (a), b), c), d))
          if (/^[a-d]\)\s/.test(linha)) {
            alternativasAtuais.push(linha);
            console.log(`[DEBUG] Alternativa encontrada: "${linha}"`);
          } else if (linha.length > 8 && !questaoAtual) {
            // Primeira linha substantiva é o enunciado
            questaoAtual = linha;
            console.log(`[DEBUG] Enunciado definido: "${linha.substring(0, 50)}..."`);
          } else if (linha.length > 8 && questaoAtual && !linha.includes('questão') && !linha.includes('Questão')) {
            // Continuar o enunciado se for uma linha longa que não é nova questão
            questaoAtual += ' ' + linha;
            console.log(`[DEBUG] Enunciado expandido: "${questaoAtual.substring(0, 50)}..."`);
          }
        }
      }
      
      // CRÍTICO: Salvar última questão - SEMPRE
      if (questaoAtual && questaoAtual.length > 10) {
        questoesReais.push({
          enunciado: questaoAtual,
          alternativas: [...alternativasAtuais]
        });
        console.log(`[DEBUG] ÚLTIMA questão ${questaoNumero} salva: "${questaoAtual.substring(0, 50)}..."`);
      }
    }
    
    // Se não encontrou questões pelo método acima, tentar método alternativo MELHORADO
    if (questoesReais.length === 0) {
      console.log('[DEBUG] Tentando método alternativo melhorado...');
      
      // Buscar por patterns específicos de questão
      const questaoPatterns = [
        /\?\s*$/,  // Termina com ?
        /complete/i,  // Palavras típicas de questão
        /analise/i,
        /explique/i,
        /descreva/i,
        /calcule/i,
        /resolva/i,
        /determine/i
      ];
      
      let possiveisQuestoes = linhas.filter(linha => {
        if (linha.length < 10) return false;
        if (isMetadata(linha)) return false;
        
        return questaoPatterns.some(pattern => pattern.test(linha)) ||
               linha.length > 25; // Textos longos podem ser questões
      });
      
      console.log(`[DEBUG] Possíveis questões encontradas: ${possiveisQuestoes.length}`);
      
      // Processar possíveis questões
      for (let i = 0; i < possiveisQuestoes.length; i++) {
        const enunciado = possiveisQuestoes[i];
        const alternativas: string[] = [];
        
        // Verificar se as próximas linhas são alternativas
        const enunciadoIndex = linhas.indexOf(enunciado);
        const nextLines = linhas.slice(enunciadoIndex + 1, enunciadoIndex + 6);
        nextLines.forEach(linha => {
          if (/^[a-d]\)\s/.test(linha)) {
            alternativas.push(linha);
          }
        });
        
        if (enunciado.length > 10) {
          questoesReais.push({ enunciado, alternativas });
          console.log(`[DEBUG] Questão alternativa ${i + 1} adicionada: "${enunciado.substring(0, 50)}..."`);
        }
      }
    }
    
    console.log(`[DEBUG] TOTAL DE QUESTÕES ENCONTRADAS: ${questoesReais.length}`);
    console.log(`[DEBUG] Questões encontradas:`, questoesReais.map((q, i) => `${i + 1}: ${q.enunciado.substring(0, 30)}...`));
    
    // MÉTODO ADICIONAL: Se ainda não temos 10 questões, tentar extrair do HTML diretamente
    if (questoesReais.length < 10) {
      console.log(`[DEBUG] Tentando método HTML direto - questões atuais: ${questoesReais.length}`);
      
      // Buscar por elementos H3 que geralmente contêm títulos de questões
      const h3Elements = tempDiv.querySelectorAll('h3');
      console.log(`[DEBUG] Elementos H3 encontrados: ${h3Elements.length}`);
      
      h3Elements.forEach((h3, index) => {
        const textoH3 = h3.textContent?.trim() || '';
        console.log(`[DEBUG] H3 ${index + 1}: "${textoH3}"`);
        
        if (/questão\s+\d+/i.test(textoH3)) {
          // Encontrar o próximo elemento que contém o enunciado
          let proximoElemento = h3.nextElementSibling;
          let enunciado = '';
          let alternativas: string[] = [];
          
          while (proximoElemento && !proximoElemento.textContent?.includes('Questão')) {
            const texto = proximoElemento.textContent?.trim() || '';
            
            if (texto.length > 10 && !isMetadata(texto)) {
              if (/^[a-d]\)\s/.test(texto)) {
                alternativas.push(texto);
              } else if (!enunciado && texto.length > 15) {
                enunciado = texto;
              }
            }
            
            proximoElemento = proximoElemento.nextElementSibling;
          }
          
          if (enunciado && enunciado.length > 10) {
            // Verificar se já não temos esta questão
            const jaExiste = questoesReais.some(q => 
              q.enunciado.substring(0, 30) === enunciado.substring(0, 30)
            );
            
            if (!jaExiste) {
              questoesReais.push({ enunciado, alternativas });
              console.log(`[DEBUG] Questão HTML ${questoesReais.length} adicionada: "${enunciado.substring(0, 50)}..."`);
            }
          }
        }
      });
      
      // Se ainda não temos questões suficientes, tentar buscar por padrões de texto mais amplos
      if (questoesReais.length < 5) {
        console.log(`[DEBUG] Tentando busca por padrões amplos - questões atuais: ${questoesReais.length}`);
        
        // Buscar por qualquer texto que termine com ? e seja longo o suficiente
        const paragrafos = tempDiv.querySelectorAll('p, div');
        paragrafos.forEach((p, index) => {
          const texto = p.textContent?.trim() || '';
          
          if (texto.length > 20 && 
              (texto.includes('?') || texto.includes('Complete') || texto.includes('complete')) &&
              !isMetadata(texto)) {
            
            const jaExiste = questoesReais.some(q => 
              q.enunciado.substring(0, 30) === texto.substring(0, 30)
            );
            
            if (!jaExiste) {
              questoesReais.push({ enunciado: texto, alternativas: [] });
              console.log(`[DEBUG] Questão padrão amplo ${questoesReais.length} adicionada: "${texto.substring(0, 50)}..."`);
            }
          }
        });
      }
    }
    
    console.log(`[DEBUG] FINAL - TOTAL DE QUESTÕES: ${questoesReais.length}`);
    
    // Renderizar questões encontradas
    questoesReais.forEach((questao, index) => {
      renderizarQuestao(questao.enunciado, questao.alternativas, index + 1);
    });

    function renderizarQuestao(enunciado: string, alternativas: string[], numero: number): void {
      // Calcular altura de forma mais compacta
      const linhasEnunciado = pdf.splitTextToSize(cleanText(enunciado), contentWidth - 10);
      const alturaBase = 10; // Reduzido de 15 para 10
      const alturaEnunciado = linhasEnunciado.length * 4; // Reduzido de 5.5 para 4
      const alturaAlternativas = alternativas.length * 4; // Reduzido de 5.5 para 4
      const alturaLinhasResposta = alternativas.length === 0 ? 15 : 0; // Reduzido de 20 para 15
      const alturaTotal = alturaBase + alturaEnunciado + alturaAlternativas + alturaLinhasResposta + 4; // Reduzido padding
      
      // CONTROLE INTELIGENTE: Se não couber completa, vai para próxima página
      if (currentY + alturaTotal > maxY) {
        pdf.addPage();
        currentY = margin;
      }
      
      // Espaço entre questões (apenas se necessário)
      if (numero > 1 && currentY > margin) {
        currentY += 4; // Reduzido de 8 para 4
      }
      
      // Título da questão - COMPACTO
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11); // Reduzido de 12 para 11
      pdf.setTextColor(60, 60, 60);
      pdf.text(`Questão ${numero}`, margin, currentY);
      
      currentY += 5; // Reduzido de 8 para 5
      
      // Enunciado - mais compacto
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11); // Reduzido de 12 para 11
      pdf.setTextColor(0, 0, 0);
      
      let yTexto = currentY;
      linhasEnunciado.forEach((linha: string) => {
        pdf.text(linha, margin, yTexto);
        yTexto += 4; // Reduzido de 5.5 para 4
      });
      
      // Alternativas com círculos
      if (alternativas.length > 0) {
        yTexto += 3; // Reduzido de 5 para 3
        
        alternativas.forEach((alt: string) => {
          if (alt.trim()) {
            // Círculo para marcação - mais compacto
            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(0.3);
            pdf.circle(margin + 6, yTexto - 1, 1.2); // Reduzido de 1.5 para 1.2
            
            // Texto da alternativa - mais compacto
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10); // Reduzido de 11 para 10
            pdf.text(cleanText(alt), margin + 12, yTexto); // Reduzido espaço
            yTexto += 4; // Reduzido de 5.5 para 4
          }
        });
      } else {
        // Linhas para resposta dissertativa - mais compactas
        yTexto += 3; // Reduzido de 6 para 3
        for (let i = 0; i < 3; i++) { // Reduzido de 4 para 3 linhas
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.2);
          pdf.line(margin + 3, yTexto, pageWidth - margin - 3, yTexto);
          yTexto += 5; // Reduzido de 7 para 5
        }
      }
      
      currentY = yTexto + 3; // Reduzido de 6 para 3
    }

    // 8. RODAPÉ SIMPLES - SEM LINHA
    const totalPages = (pdf as any).internal.getNumberOfPages();
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      pdf.setPage(pageNum);
      
      // Número da página
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9); // Aumentado de 8 para 9
      pdf.setTextColor(120, 120, 120);
      
      const pageText = `Página ${pageNum} de ${totalPages}`;
      const pageTextWidth = pdf.getTextWidth(pageText);
      pdf.text(pageText, pageWidth - margin - pageTextWidth, pageHeight - 8); // Subiu um pouco
      
      // Data de aplicação (apenas primeira página)
      if (pageNum === 1) {
        const dataText = avaliacaoData.dataAplicacao 
          ? `Aplicada em ${new Date(avaliacaoData.dataAplicacao).toLocaleDateString('pt-BR')}`
          : `Gerada em ${new Date().toLocaleDateString('pt-BR')}`;
        pdf.text(dataText, margin, pageHeight - 8); // Subiu um pouco
      }
    }

    // 9. SALVAR
    const nomeArquivo = `${avaliacaoData.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_avaliacao.pdf`;
    pdf.save(nomeArquivo);
    
  } catch (error) {
    console.error('Erro ao exportar PDF da avaliação:', error);
    throw new Error('Falha ao exportar avaliação como PDF');
  }
} 