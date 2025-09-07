import { FC } from 'react';
import DOMPurify from 'dompurify';

interface AvaliacaoStructuredViewProps {
  conteudoHtml: string;
}

interface AvaliacaoData {
  titulo: string;
  disciplina: string;
  anoSerie: string;
  turma: string;
  modalidade: string;
  trimestre: string;
  professor: string;
  tipo: string;
  quantidadeQuestoes: string;
  notaMaxima: string;
  tempoEstimado: string;
  data: string;
  foco: string;
  instrucoes: string;
  questoes: Array<{
    numero: number;
    pontos: string;
    texto: string;
    alternativas?: string[];
  }>;
  nomeAluno?: string;
  nota?: string;
}

const AvaliacaoStructuredView: FC<AvaliacaoStructuredViewProps> = ({ conteudoHtml }) => {
  const parseAvaliacaoContent = (html: string): AvaliacaoData | null => {
    if (!html) return null;

    const sanitizedHtml = DOMPurify.sanitize(html);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizedHtml;
    const text = tempDiv.textContent || tempDiv.innerText || '';

    // Extrair informações básicas
    const titulo = extractField(text, /(?:Criando|Avaliação)\s*[:-]?\s*(.+?)(?:\n|$)/) || 
                  extractField(text, /^(.+?)(?:\n|ID:|Disciplina:)/) || 
                  'Avaliação';
    const disciplina = extractField(text, /Disciplina:\s*(.+?)(?:\n|$)/) || '';
    const anoSerie = extractField(text, /Ano\/Série:\s*(.+?)(?:\n|$)/) || '';
    const turma = extractField(text, /Turma:\s*(.+?)(?:\n|$)/) || '';
    const modalidade = extractField(text, /Modalidade:\s*(.+?)(?:\n|$)/) || '';
    const trimestre = extractField(text, /(?:Trimestre|Turma):\s*(.+?)(?:\n|$)/) || '';
    const professor = extractField(text, /Professor(?:a)?:\s*(.+?)(?:\n|$)/) || '';
    const tipo = extractField(text, /Tipo:\s*(.+?)(?:\n|$)/) || 
                extractField(text, /Tipo de Avaliação:\s*(.+?)(?:\n|$)/) || 'Prova';
    const quantidadeQuestoes = extractField(text, /Quantidade de Questões:\s*(.+?)(?:\n|$)/) || '';
    const notaMaxima = extractField(text, /Nota Máxima:\s*(.+?)(?:\n|$)/) || '100';
    const tempoEstimado = extractField(text, /Tempo:\s*(.+?)(?:\n|$)/) || 
                         extractField(text, /Tempo Estimado:\s*(.+?)(?:\n|$)/) || '20 min';
    const data = extractField(text, /Data:\s*(.+?)(?:\n|$)/) || new Date().toLocaleDateString('pt-BR');
    const foco = extractField(text, /Foco da Avaliação:\s*(.+?)(?:\n|$)/) || '';

    // Extrair instruções
    const instrucoesMatch = text.match(/Instruções[:\s]*([\s\S]*?)(?=Questões|QUESTÕES|Questão|$)/);
    const instrucoes = instrucoesMatch ? instrucoesMatch[1].trim() : 
                      'Leia atentamente cada questão e responda conforme solicitado. Utilize o espaço disponível para suas respostas.';

    // Extrair questões
    const questoes = extractQuestoes(text);

    return {
      titulo: titulo.replace(/^(Criando|Avaliação)\s*[:-]?\s*/, '').trim(),
      disciplina,
      anoSerie,
      turma,
      modalidade,
      trimestre,
      professor,
      tipo,
      quantidadeQuestoes,
      notaMaxima,
      tempoEstimado,
      data,
      foco,
      instrucoes,
      questoes
    };
  };

  const extractField = (text: string, regex: RegExp): string | null => {
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  const extractQuestoes = (text: string): Array<{ numero: number; pontos: string; texto: string; alternativas?: string[] }> => {
    const questoes: Array<{ numero: number; pontos: string; texto: string; alternativas?: string[] }> = [];
    
    // Múltiplos padrões para capturar questões
    const patterns = [
      /Questão\s+(\d+)\s*(?:\((\d+)\s*pontos?\))?\s*([\s\S]*?)(?=Questão\s+\d+|$)/gi,
      /(\d+)\s*[.)]\s*([\s\S]*?)(?=\d+\s*[.)]|$)/g,
      /Question\s+(\d+)\s*([\s\S]*?)(?=Question\s+\d+|$)/gi
    ];

    for (const pattern of patterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex
      
      while ((match = pattern.exec(text)) !== null) {
        const numero = parseInt(match[1]);
        const pontos = match[2] && !isNaN(parseInt(match[2])) ? match[2] : '10';
        let textoQuestao = (match[3] || match[2] || '').trim();

        // Verificar se há alternativas (A, B, C, D)
        const alternativasMatch = textoQuestao.match(/([ABCD])\s*[).]?\s*([^\n]*?)(?=\s*[ABCD]\s*[).]|$)/g);
        let alternativas: string[] | undefined;
        
        if (alternativasMatch && alternativasMatch.length > 1) {
          alternativas = alternativasMatch.map(alt => {
            const cleanAlt = alt.replace(/^[ABCD]\s*[).]?\s*/, '').trim();
            return cleanAlt;
          }).filter(alt => alt.length > 0);
          
          // Remover alternativas do texto da questão
          textoQuestao = textoQuestao.replace(/[ABCD]\s*[).]?\s*[^\n]*$/gm, '').trim();
        }

        // Evitar questões duplicadas
        if (!questoes.find(q => q.numero === numero) && textoQuestao.length > 0) {
          questoes.push({
            numero,
            pontos,
            texto: textoQuestao,
            alternativas
          });
        }
      }
      
      if (questoes.length > 0) break; // Se encontrou questões, para de tentar outros padrões
    }

    return questoes.sort((a, b) => a.numero - b.numero);
  };

  const avaliacaoData = parseAvaliacaoContent(conteudoHtml);

  if (!avaliacaoData) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-500 italic">Não foi possível estruturar o conteúdo da avaliação</p>
      </div>
    );
  }

  // Gerar ID único para a avaliação
  const avaliacaoId = `AV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 font-sans" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Cabeçalho Principal */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-black mb-4">{avaliacaoData.titulo}</h1>
        
        {/* ID da Avaliação */}
        <div className="flex justify-end mb-4">
          <div className="border-2 border-black px-3 py-1 text-sm font-bold">
            ID: {avaliacaoId}
          </div>
        </div>
      </div>

      {/* Informações em Layout de 3 Colunas - Exatamente como no PDF */}
      <div className="grid grid-cols-3 gap-8 mb-6 text-sm">
        {/* Coluna 1 */}
        <div className="space-y-2">
          <div>
            <span className="font-bold">Disciplina: </span>
            <span>{avaliacaoData.disciplina}</span>
          </div>
          <div>
            <span className="font-bold">Ano/Série: </span>
            <span>{avaliacaoData.anoSerie}</span>
          </div>
          <div>
            <span className="font-bold">Tipo: </span>
            <span>{avaliacaoData.tipo}</span>
          </div>
        </div>
        
        {/* Coluna 2 */}
        <div className="space-y-2">
          <div>
            <span className="font-bold">Professor: </span>
            <span>{avaliacaoData.professor}</span>
          </div>
          <div>
            <span className="font-bold">Turma: </span>
            <span>{avaliacaoData.turma}</span>
          </div>
          <div>
            <span className="font-bold">Tempo: </span>
            <span>{avaliacaoData.tempoEstimado}</span>
          </div>
        </div>
        
        {/* Coluna 3 */}
        <div className="space-y-2">
          <div>
            <span className="font-bold">Data: </span>
            <span>{avaliacaoData.data}</span>
          </div>
          <div>
            <span className="font-bold">Modalidade: </span>
            <span>{avaliacaoData.modalidade}</span>
          </div>
          <div>
            <span className="font-bold">Nota Máxima: </span>
            <span>{avaliacaoData.notaMaxima} pts</span>
          </div>
        </div>
      </div>

      {/* Linha para Nome do Aluno */}
      <div className="mb-6 pb-2 border-b border-gray-400">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-sm">Nome do(a) Aluno(a):</span>
          <div className="flex-1 border-b border-gray-400 h-6"></div>
          <span className="font-bold text-sm">Nota:</span>
          <div className="w-16 border-b border-gray-400 h-6"></div>
        </div>
      </div>

      {/* Instruções */}
      {avaliacaoData.instrucoes && (
        <div className="mb-6">
          <h3 className="font-bold text-base mb-2 text-blue-700">Instruções</h3>
          <p className="text-sm text-blue-800 italic">{avaliacaoData.instrucoes}</p>
        </div>
      )}

      {/* Questões */}
      {avaliacaoData.questoes.length > 0 && (
        <div>
          <h3 className="font-bold text-base mb-4 text-black">Questões</h3>
          <div className="space-y-6">
            {avaliacaoData.questoes.map((questao) => (
              <div key={questao.numero} className="">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-bold text-sm text-black">
                    Questão {questao.numero}
                  </h4>
                  <span className="text-sm font-bold text-blue-600">
                    {questao.pontos} pontos
                  </span>
                </div>
                
                <div className="text-sm text-black mb-4 leading-relaxed">
                  {questao.texto}
                </div>

                {questao.alternativas && questao.alternativas.length > 0 && (
                  <div className="space-y-2 ml-4 mb-4">
                    {questao.alternativas.map((alternativa, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="font-bold text-black min-w-[20px] text-sm">
                          {String.fromCharCode(65 + index)})
                        </span>
                        <span className="text-sm text-black">{alternativa}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Espaço para resposta */}
                <div className="mt-4">
                  <div className="border-b border-gray-300 h-8 mb-2"></div>
                  <div className="border-b border-gray-300 h-8 mb-2"></div>
                  <div className="border-b border-gray-300 h-8 mb-2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvaliacaoStructuredView;