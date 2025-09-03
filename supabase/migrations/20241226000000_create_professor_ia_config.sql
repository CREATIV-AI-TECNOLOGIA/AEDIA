-- Criar tabela para configurações da IA do professor
CREATE TABLE IF NOT EXISTS professor_ia_configuracoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id INTEGER NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  escola_id INTEGER NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  
  -- Configurações pedagógicas
  metodologia_preferida TEXT, -- Ex: "Construtivista", "Tradicional", "Montessori", etc.
  estilo_ensino TEXT, -- Ex: "Visual", "Auditivo", "Cinestésico", "Misto"
  nivel_detalhamento TEXT DEFAULT 'medio', -- "basico", "medio", "detalhado"
  
  -- Configurações de conteúdo
  incluir_atividades_praticas BOOLEAN DEFAULT true,
  incluir_recursos_digitais BOOLEAN DEFAULT true,
  incluir_avaliacao BOOLEAN DEFAULT true,
  incluir_materiais_necessarios BOOLEAN DEFAULT true,
  incluir_tempo_estimado BOOLEAN DEFAULT true,
  
  -- Configurações de adaptação
  considerar_inclusao BOOLEAN DEFAULT true,
  considerar_diversidade BOOLEAN DEFAULT true,
  adaptar_para_recursos_limitados BOOLEAN DEFAULT false,
  
  -- Configurações de formato
  formato_preferido TEXT DEFAULT 'estruturado', -- "estruturado", "narrativo", "topicos"
  linguagem_nivel TEXT DEFAULT 'formal', -- "formal", "informal", "academico"
  
  -- Observações personalizadas
  observacoes_especiais TEXT,
  contexto_escola TEXT, -- Contexto específico da escola/região
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_professor_ia_config_professor_id ON professor_ia_configuracoes(professor_id);
CREATE INDEX IF NOT EXISTS idx_professor_ia_config_escola_id ON professor_ia_configuracoes(escola_id);

-- Constraint para garantir uma configuração por professor por escola
CREATE UNIQUE INDEX IF NOT EXISTS idx_professor_ia_config_unique 
ON professor_ia_configuracoes(professor_id, escola_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_professor_ia_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_professor_ia_config_updated_at
  BEFORE UPDATE ON professor_ia_configuracoes
  FOR EACH ROW
  EXECUTE FUNCTION update_professor_ia_config_updated_at();

-- RLS (Row Level Security)
ALTER TABLE professor_ia_configuracoes ENABLE ROW LEVEL SECURITY;

-- Política para professores verem apenas suas próprias configurações
CREATE POLICY "Professores podem ver suas configurações" ON professor_ia_configuracoes
  FOR SELECT USING (
    professor_id IN (
      SELECT id FROM professores WHERE user_id = auth.uid() OR email = auth.email()
    )
  );

-- Política para professores criarem suas configurações
CREATE POLICY "Professores podem criar suas configurações" ON professor_ia_configuracoes
  FOR INSERT WITH CHECK (
    professor_id IN (
      SELECT id FROM professores WHERE user_id = auth.uid() OR email = auth.email()
    )
  );

-- Política para professores atualizarem suas configurações
CREATE POLICY "Professores podem atualizar suas configurações" ON professor_ia_configuracoes
  FOR UPDATE USING (
    professor_id IN (
      SELECT id FROM professores WHERE user_id = auth.uid() OR email = auth.email()
    )
  ); 