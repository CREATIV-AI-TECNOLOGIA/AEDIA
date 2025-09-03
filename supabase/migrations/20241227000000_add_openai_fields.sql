-- Adicionar novos campos para configurações específicas de planos trimestrais
ALTER TABLE professor_ia_configuracoes 
ADD COLUMN IF NOT EXISTS preferencias_avaliacao TEXT,
ADD COLUMN IF NOT EXISTS recursos_disponiveis TEXT,
ADD COLUMN IF NOT EXISTS efemerides_periodo TEXT,
ADD COLUMN IF NOT EXISTS eventos_escolares TEXT;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN professor_ia_configuracoes.preferencias_avaliacao IS 'Preferências específicas de avaliação (ex: portfólio, rubricas, autoavaliação)';
COMMENT ON COLUMN professor_ia_configuracoes.recursos_disponiveis IS 'Recursos específicos disponíveis na escola (ex: projetor, tablets, laboratório)';
COMMENT ON COLUMN professor_ia_configuracoes.efemerides_periodo IS 'Efemérides e datas comemorativas do período letivo';
COMMENT ON COLUMN professor_ia_configuracoes.eventos_escolares IS 'Eventos escolares planejados para o período (ex: feira de ciências, mostra cultural)';

-- Adicionar campo para instruções personalizadas nas avaliações
ALTER TABLE avaliacoes 
ADD COLUMN IF NOT EXISTS instrucoes_personalizadas TEXT;

-- Comentário para documentar o novo campo
COMMENT ON COLUMN avaliacoes.instrucoes_personalizadas IS 'Instruções personalizadas do professor para o aluno na avaliação'; 