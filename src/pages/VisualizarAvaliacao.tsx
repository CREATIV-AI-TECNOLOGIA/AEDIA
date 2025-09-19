import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import AvaliacaoHeader from '../components/AvaliacaoHeader';
import AvaliacaoForm from '../components/AvaliacaoForm';
import WysiwygEditor from '../components/WysiwygEditor';
import { useAvaliacaoData } from '../hooks/useAvaliacaoData';
import { useAvaliacaoEditor } from '../hooks/useAvaliacaoEditor';
import { useAvaliacaoUtils } from '../hooks/useAvaliacaoUtils';

const VisualizarAvaliacao: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    avaliacao,
    dadosEdicao,
    setDadosEdicao,
    carregando,
    erro,
    modoEdicao,
    setModoEdicao,
    salvandoAlteracoes,
    menuExportacao,
    setMenuExportacao,
    salvarAlteracoes
  } = useAvaliacaoData();
  
  const {
    uploadandoImagem,
    abrirSeletorImagem,
    handleFileChange,
    executarComando,
    desfazer,
    refazer
  } = useAvaliacaoEditor();
  
  const {
    exportarPDF,
    exportarWord,
    imprimir,
    limparQuestoes,
    renumerarQuestoes,
    criarNovaQuestao
  } = useAvaliacaoUtils();

  const handleVoltar = () => {
    navigate('/avaliacoes');
  };

  const handleEditar = () => {
    setModoEdicao(true);
  };

  const handleCancelarEdicao = () => {
    if (avaliacao) {
      setDadosEdicao({
        titulo: avaliacao.titulo,
        descricao: avaliacao.descricao,
        conteudo_html: avaliacao.conteudo_html,
        tempo_limite: avaliacao.tempo_limite,
        nota_maxima: avaliacao.nota_maxima,
        data_inicio: avaliacao.data_inicio,
        data_fim: avaliacao.data_fim,
        tipo: avaliacao.tipo,
        status: avaliacao.status,
        disciplina: avaliacao.disciplina,
        turma: avaliacao.turma
      });
    }
    setModoEdicao(false);
  };

  const handleSalvar = async () => {
    await salvarAlteracoes();
  };

  const handleConteudoChange = (novoConteudo: string) => {
    setDadosEdicao(prev => ({
      ...prev,
      conteudo_html: novoConteudo
    }));
  };

  if (carregando) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (erro) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-4">{erro}</div>
          <button
            onClick={handleVoltar}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            Voltar para Avaliações
          </button>
        </div>
      </Layout>
    );
  }

  if (!avaliacao) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-muted-foreground text-lg mb-4">Avaliação não encontrada</div>
          <button
            onClick={handleVoltar}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            Voltar para Avaliações
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <AvaliacaoHeader
          modoEdicao={modoEdicao}
          salvandoAlteracoes={salvandoAlteracoes}
          menuExportacao={menuExportacao}
          onVoltar={handleVoltar}
          onEditar={handleEditar}
          onSalvar={handleSalvar}
          onCancelar={handleCancelarEdicao}
          onToggleMenuExportacao={() => setMenuExportacao(!menuExportacao)}
          onExportarPDF={exportarPDF}
          onExportarWord={exportarWord}
          onImprimir={imprimir}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <AvaliacaoForm
              avaliacao={avaliacao}
              dadosEdicao={dadosEdicao}
              modoEdicao={modoEdicao}
              onDadosChange={setDadosEdicao}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg shadow-sm border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Conteúdo da Avaliação
                </h3>
                
                <WysiwygEditor
                  conteudo={modoEdicao ? dadosEdicao.conteudo_html : avaliacao.conteudo_html}
                  modoEdicao={modoEdicao}
                  uploadandoImagem={uploadandoImagem}
                  onConteudoChange={handleConteudoChange}
                  onAbrirSeletorImagem={abrirSeletorImagem}
                  onExecutarComando={executarComando}
                  onDesfazer={desfazer}
                  onRefazer={refazer}
                  onLimparQuestoes={limparQuestoes}
                  onRenumerarQuestoes={renumerarQuestoes}
                  onCriarNovaQuestao={criarNovaQuestao}
                />
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-input"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VisualizarAvaliacao;