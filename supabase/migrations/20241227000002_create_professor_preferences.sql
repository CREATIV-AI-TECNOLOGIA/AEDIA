-- Criar tabela para preferências de interface do professor
CREATE TABLE IF NOT EXISTS professor_preferencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id INTEGER NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  
  -- Preferências da interface de criação de plano
  plano_aula_cards_visible BOOLEAN DEFAULT true,
  plano_aula_conteudos_curriculares_visible BOOLEAN DEFAULT true,
  
  -- Outras preferências de interface (para futuras expansões)
  tema_interface TEXT DEFAULT 'claro',
  notificacoes_ativas BOOLEAN DEFAULT true,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_professor_preferencias_professor_id ON professor_preferencias(professor_id);

-- Constraint para garantir uma preferência por professor
CREATE UNIQUE INDEX IF NOT EXISTS idx_professor_preferencias_unique 
ON professor_preferencias(professor_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_professor_preferencias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_professor_preferencias_updated_at
  BEFORE UPDATE ON professor_preferencias
  FOR EACH ROW
  EXECUTE FUNCTION update_professor_preferencias_updated_at();

-- RLS (Row Level Security)
ALTER TABLE professor_preferencias ENABLE ROW LEVEL SECURITY;

-- Política para professores verem apenas suas próprias preferências
CREATE POLICY "Professores podem ver suas preferências" ON professor_preferencias
  FOR SELECT USING (
    professor_id IN (
      SELECT id FROM professores WHERE user_id = auth.uid() OR email = auth.email()
    )
  );

-- Política para professores criarem suas preferências
CREATE POLICY "Professores podem criar suas preferências" ON professor_preferencias
  FOR INSERT WITH CHECK (
    professor_id IN (
      SELECT id FROM professores WHERE user_id = auth.uid() OR email = auth.email()
    )
  );

-- Política para professores atualizarem suas preferências
CREATE POLICY "Professores podem atualizar suas preferências" ON professor_preferencias
  FOR UPDATE USING (
    professor_id IN (
      SELECT id FROM professores WHERE user_id = auth.uid() OR email = auth.email()
    )
  ); 