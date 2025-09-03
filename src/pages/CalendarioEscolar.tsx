import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getGreeting, getTimeBasedClasses } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { CalendarDays, PlusCircle, Edit3, Trash2, Info, Save } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

// Interfaces para os tipos de dados
interface Evento {
  id?: string;
  titulo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  tipo: 'feriado' | 'recesso' | 'evento_escolar' | 'outro';
  cor: string;
}

interface Trimestre {
  id?: string;
  numero: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
}

// Cores para categorias de eventos
const coresPorTipo = {
  feriado: 'bg-red-100 text-red-800 border-red-200',
  recesso: 'bg-blue-100 text-blue-800 border-blue-200',
  evento_escolar: 'bg-green-100 text-green-800 border-green-200',
  outro: 'bg-purple-100 text-purple-800 border-purple-200'
};

const CalendarioEscolar: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trimestreAtual, setTrimestreAtual] = useState<string>('');
  const [trimestres, setTrimestres] = useState<Trimestre[]>([
    { numero: 1, nome: '1º Trimestre', data_inicio: '', data_fim: '' },
    { numero: 2, nome: '2º Trimestre', data_inicio: '', data_fim: '' },
    { numero: 3, nome: '3º Trimestre', data_inicio: '', data_fim: '' },
  ]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [novoEvento, setNovoEvento] = useState<Evento>({
    titulo: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    tipo: 'evento_escolar',
    cor: ''
  });
  const [editandoEvento, setEditandoEvento] = useState<boolean>(false);
  const [eventoSelecionadoId, setEventoSelecionadoId] = useState<string | null>(null);
  const [exibirFormEvento, setExibirFormEvento] = useState<boolean>(false);
  const [mostrarInfoTrimestres, setMostrarInfoTrimestres] = useState<boolean>(false);

  // Classes dinâmicas com base no horário do dia
  const timeClasses = getTimeBasedClasses();
  const saudacao = getGreeting();

  // Função para determinar o trimestre atual
  const determinarTrimestreAtual = (trimestres: Trimestre[]) => {
    const hoje = new Date();
    for (const trimestre of trimestres) {
      if (trimestre.data_inicio && trimestre.data_fim) {
        const inicio = new Date(trimestre.data_inicio);
        const fim = new Date(trimestre.data_fim);
        if (hoje >= inicio && hoje <= fim) {
          setTrimestreAtual(trimestre.nome);
          return;
        }
      }
    }
    setTrimestreAtual('Período de Férias');
  };

  // Buscar dados existentes
  useEffect(() => {
    const carregarDados = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Buscar ID do professor
        const { data: professorData, error: professorError } = await supabase
          .from('professores')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (professorError) throw professorError;
        if (!professorData?.id) {
          throw new Error('Professor não encontrado');
        }

        // Buscar períodos letivos do ano atual
        const anoAtual = new Date().getFullYear();
        const { data: periodosData, error: periodosError } = await supabase
          .from('periodos_letivos')
          .select('*')
          .eq('ano', anoAtual)
          .eq('professor_id', professorData.id)
          .order('numero');

        if (periodosError) throw periodosError;

        if (periodosData && periodosData.length > 0) {
          const trimestresAtualizados = [...trimestres];
          periodosData.forEach(periodo => {
            const index = trimestresAtualizados.findIndex(t => t.numero === periodo.numero);
            if (index !== -1) {
              trimestresAtualizados[index] = {
                ...trimestresAtualizados[index],
                id: periodo.id,
                data_inicio: periodo.data_inicio,
                data_fim: periodo.data_fim
              };
            }
          });
          setTrimestres(trimestresAtualizados);
          determinarTrimestreAtual(trimestresAtualizados);
        }

        // Buscar eventos do calendário
        const { data: eventosData, error: eventosError } = await supabase
          .from('eventos_calendario')
          .select('*')
          .eq('professor_id', professorData.id)
          .order('data_inicio');

        if (eventosError) throw eventosError;

        if (eventosData) {
          setEventos(eventosData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do calendário:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [user]);

  // Atualizar trimestre
  const atualizarTrimestre = (index: number, campo: string, valor: string) => {
    const novosTrimestres = [...trimestres];
    (novosTrimestres[index] as any)[campo] = valor; // Adicionado as any para compatibilidade com o campo dinâmico
    setTrimestres(novosTrimestres);
  };

  // Salvar trimestres
  const salvarTrimestres = async () => {
    try {
      const anoAtual = new Date().getFullYear();

      // Buscar ID do professor
      const { data: professorData, error: professorError } = await supabase
        .from('professores')
        .select('id')
        .eq('email', user?.email)
        .maybeSingle();

      if (professorError) throw professorError;
      if (!professorData?.id) {
        throw new Error('Professor não encontrado');
      }
      
      // Array para armazenar as promessas de atualização/inserção
      const promises = [];
      
      for (const trimestre of trimestres) {
        if (!trimestre.data_inicio || !trimestre.data_fim) {
          continue; // Pula trimestres sem datas definidas
        }

        const periodoData = {
          ano: anoAtual,
          numero: trimestre.numero,
          nome: `${trimestre.numero}º Trimestre`,
          data_inicio: trimestre.data_inicio,
          data_fim: trimestre.data_fim,
          tipo: 'trimestre',
          professor_id: professorData.id
        };

        if (trimestre.id) {
          // Atualizar período existente
          promises.push(
            supabase
              .from('periodos_letivos')
              .update(periodoData)
              .eq('id', trimestre.id)
          );
        } else {
          // Inserir novo período
          promises.push(
            supabase
              .from('periodos_letivos')
              .insert([periodoData])
              .select()
          );
        }
      }

      if (promises.length === 0) {
        alert('Por favor, preencha as datas de pelo menos um trimestre.');
        return;
      }

      // Aguardar todas as operações serem concluídas
      console.log('Dados a serem enviados nas promessas:', promises.map(p => p)); // Log para ver o conteúdo das promessas
      console.log('Detalhes dos trimestres no estado:', trimestres);
      console.log('Ano atual sendo usado:', anoAtual);
      console.log('ID do Professor sendo usado:', professorData.id);
      
      const results = await Promise.all(promises);
      
      // Verificar se houve algum erro
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }

      // Recarregar os períodos após salvar
      const { data: periodosData, error: periodosError } = await supabase
        .from('periodos_letivos')
        .select('*')
        .eq('ano', anoAtual)
        .eq('professor_id', professorData.id)
        .order('numero');

      if (periodosError) throw periodosError;

      if (periodosData) {
        const trimestresAtualizados = [...trimestres];
        periodosData.forEach(periodo => {
          const index = trimestresAtualizados.findIndex(t => t.numero === periodo.numero);
          if (index !== -1) {
            trimestresAtualizados[index] = {
              ...trimestresAtualizados[index],
              id: periodo.id,
              data_inicio: periodo.data_inicio,
              data_fim: periodo.data_fim
            };
          }
        });
        setTrimestres(trimestresAtualizados);
        determinarTrimestreAtual(trimestresAtualizados);
      }

      alert('Trimestres salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar trimestres:', error);
      alert('Erro ao salvar trimestres. Por favor, tente novamente.');
    }
  };

  // Manipuladores para o formulário de eventos
  const handleNovoEventoChange = (campo: keyof Evento, valor: any) => {
    setNovoEvento(prev => ({ ...prev, [campo]: valor }));
    if (campo === 'tipo') {
      setNovoEvento(prev => ({ ...prev, cor: coresPorTipo[valor as keyof typeof coresPorTipo] || coresPorTipo.outro }));
    }
  };

  const adicionarOuAtualizarEvento = async () => {
    try {
      // Buscar ID do professor
      const { data: professorData, error: professorError } = await supabase
        .from('professores')
        .select('id')
        .eq('email', user?.email)
        .maybeSingle();

      if (professorError) throw professorError;
      if (!professorData?.id) {
        throw new Error('Professor não encontrado');
      }

      const eventoData = {
        titulo: novoEvento.titulo,
        descricao: novoEvento.descricao,
        data_inicio: novoEvento.data_inicio,
        data_fim: novoEvento.data_fim,
        tipo: novoEvento.tipo,
        cor: novoEvento.cor || '#1E40AF',
        professor_id: professorData.id
      };

      if (editandoEvento && eventoSelecionadoId) {
        // Atualizar evento existente
        const { error } = await supabase
          .from('eventos_calendario')
          .update(eventoData)
          .eq('id', eventoSelecionadoId);

        if (error) throw error;
      } else {
        // Adicionar novo evento
        const { error } = await supabase
          .from('eventos_calendario')
          .insert([eventoData]);

        if (error) throw error;
      }

      // Recarregar eventos
      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos_calendario')
        .select('*')
        .eq('professor_id', professorData.id)
        .order('data_inicio');

      if (eventosError) throw eventosError;
      if (eventosData) setEventos(eventosData);

      // Resetar formulário
      setNovoEvento({
        titulo: '',
        descricao: '',
        data_inicio: '',
        data_fim: '',
        tipo: 'evento_escolar',
        cor: ''
      });
      setEditandoEvento(false);
      setEventoSelecionadoId(null);
      setExibirFormEvento(false);

    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('Erro ao salvar evento. Por favor, tente novamente.');
    }
  };

  const editarEvento = async (id: string) => {
    try {
      const { data: evento, error } = await supabase
        .from('eventos_calendario')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (evento) {
        setNovoEvento(evento);
        setEditandoEvento(true);
        setEventoSelecionadoId(id);
        setExibirFormEvento(true);
      }
    } catch (error) {
      console.error('Erro ao carregar evento para edição:', error);
      alert('Erro ao carregar evento. Por favor, tente novamente.');
    }
  };

  const excluirEvento = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        const { error } = await supabase
          .from('eventos_calendario')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setEventos(eventos.filter(evt => evt.id !== id));
      } catch (error) {
        console.error('Erro ao excluir evento:', error);
        alert('Erro ao excluir evento. Por favor, tente novamente.');
      }
    }
  };

  // Variantes de animação para Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Carregando dados do calendário...</p>
        </div>
      ) : (
        <>
          {/* Seção de Informações e Trimestre Atual */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="mb-6 p-3 bg-white rounded-xl shadow-lg border border-gray-200"
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className={`text-xl font-semibold ${timeClasses.text}`}>{saudacao}, {user?.user_metadata?.nome || 'Professor(a)'}!</h2>
                <p className="text-gray-500">Hoje é {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
              </div>
              {trimestreAtual && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Trimestre Atual</p>
                  <p className="text-lg font-semibold text-indigo-600">{trimestreAtual}</p>
                </div>
              )}
            </div>
             <button 
                onClick={() => setMostrarInfoTrimestres(!mostrarInfoTrimestres)}
                className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 transition-colors mb-2"
              >
                <Info size={16} className="mr-2" />
                {mostrarInfoTrimestres ? 'Ocultar' : 'Como definir os trimestres?'}
              </button>
            {mostrarInfoTrimestres && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-700"
              >
                <p className="font-semibold mb-1">Definindo os Períodos Letivos:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Preencha as datas de início e fim para cada trimestre abaixo.</li>
                  <li>As datas devem estar no formato AAAA-MM-DD (ex: 2024-03-01).</li>
                  <li>Clique em "Salvar Trimestres" para registrar as datas no sistema.</li>
                  <li>O "Trimestre Atual" será determinado automaticamente com base na data de hoje.</li>
                </ul>
              </motion.div>
            )}
          </motion.div>

          {/* Seção de Gerenciamento de Trimestres */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mb-10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-gray-700">Configurar Períodos Letivos (Trimestres)</h2>
              <Button onClick={salvarTrimestres} className="bg-indigo-600 hover:bg-indigo-700">
                <Save size={18} className="mr-2" />
                Salvar Trimestres
              </Button>
            </div>
            <p className="text-sm text-gray-500 mb-6">Defina as datas de início e fim para cada trimestre do ano letivo atual.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {trimestres.map((trimestre, index) => (
                <motion.div variants={itemVariants} key={trimestre.numero}>
                  <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                    <div className="p-3 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 flex justify-between items-center">
                        {trimestre.nome}
                        {trimestreAtual === trimestre.nome && (
                          <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-2">Atual</span>
                        )}
                      </h3>
                    </div>
                    <div className="p-3 space-y-3 flex-grow">
                      <div>
                        <label htmlFor={`inicio-${index}`} className="block text-sm font-medium text-gray-600 mb-1">Data de Início</label>
                        <Input 
                          type="date" 
                          id={`inicio-${index}`} 
                          value={trimestre.data_inicio} 
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => atualizarTrimestre(index, 'data_inicio', e.target.value)} 
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label htmlFor={`fim-${index}`} className="block text-sm font-medium text-gray-600 mb-1">Data de Fim</label>
                        <Input 
                          type="date" 
                          id={`fim-${index}`} 
                          value={trimestre.data_fim} 
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => atualizarTrimestre(index, 'data_fim', e.target.value)} 
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Seção de Eventos do Calendário */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700">Eventos do Calendário</h2>
              <Button onClick={() => { setEditandoEvento(false); setNovoEvento({ titulo: '', descricao: '', data_inicio: '', data_fim: '', tipo: 'evento_escolar', cor: coresPorTipo.evento_escolar }); setExibirFormEvento(true); }} className="bg-green-500 hover:bg-green-600">
                <PlusCircle size={18} className="mr-2" />
                Adicionar Evento
              </Button>
            </div>
            
            {eventos.length === 0 && !loading && (
              <motion.div variants={itemVariants} className="text-center py-10 bg-white rounded-xl shadow p-6">
                <CalendarDays size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Nenhum evento cadastrado ainda.</p>
                <p className="text-sm text-gray-400">Clique em "Adicionar Evento" para começar.</p>
              </motion.div>
            )}
            
            <div className="space-y-4">
              {eventos.map(evento => (
                <motion.div variants={itemVariants} key={evento.id}>
                  <Card className={`shadow-sm hover:shadow-md transition-shadow ${coresPorTipo[evento.tipo] || coresPorTipo.outro} border-l-4 ${coresPorTipo[evento.tipo] ? coresPorTipo[evento.tipo].replace('bg-','border-').replace('-100', '-400') : 'border-gray-300'}`}>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-md font-semibold ">{evento.titulo}</h4>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full`}>
                          {evento.tipo.replace('_',' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <p className="text-sm  mb-3">
                        {new Date(evento.data_inicio).toLocaleDateString('pt-BR')} - {new Date(evento.data_fim).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-sm  mb-4">{evento.descricao}</p>
                      <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200/[.5]">
                        <Button variant="outline" size="sm" onClick={() => editarEvento(evento.id!)} className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700">
                          <Edit3 size={16} className="mr-1" /> Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => excluirEvento(evento.id!)} className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700">
                          <Trash2 size={16} className="mr-1" /> Excluir
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Modal para Adicionar/Editar Evento */}
          {exibirFormEvento && (
            <Modal isOpen={exibirFormEvento} onClose={() => setExibirFormEvento(false)} title={editandoEvento ? 'Editar Evento' : 'Adicionar Novo Evento'}>
              <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); adicionarOuAtualizarEvento(); }} className="space-y-4 p-1">
                <div>
                  <label htmlFor="titulo-evento" className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <Input 
                    type="text" 
                    id="titulo-evento" 
                    value={novoEvento.titulo} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNovoEventoChange('titulo', e.target.value)} 
                    placeholder="Ex: Reunião de Pais"
                    required 
                  />
                </div>
                <div>
                  <label htmlFor="descricao-evento" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea 
                    id="descricao-evento" 
                    rows={3} 
                    value={novoEvento.descricao} 
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleNovoEventoChange('descricao', e.target.value)} 
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Detalhes sobre o evento..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="data-inicio-evento" className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                    <Input type="date" id="data-inicio-evento" value={novoEvento.data_inicio} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNovoEventoChange('data_inicio', e.target.value)} required />
                  </div>
                  <div>
                    <label htmlFor="data-fim-evento" className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label>
                    <Input type="date" id="data-fim-evento" value={novoEvento.data_fim} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNovoEventoChange('data_fim', e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label htmlFor="tipo-evento" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento</label>
                  <select 
                    id="tipo-evento" 
                    value={novoEvento.tipo} 
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleNovoEventoChange('tipo', e.target.value as Evento['tipo'])} 
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="evento_escolar">Evento Escolar</option>
                    <option value="feriado">Feriado</option>
                    <option value="recesso">Recesso</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setExibirFormEvento(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    {editandoEvento ? 'Atualizar Evento' : 'Salvar Evento'}
                  </Button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}
    </div>
  );
};

export default CalendarioEscolar;