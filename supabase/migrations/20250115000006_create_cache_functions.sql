-- Função para incrementar uso do cache
CREATE OR REPLACE FUNCTION increment_cache_usage(cache_id TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE chat_response_cache 
  SET vezes_usado = vezes_usado + 1
  WHERE id = cache_id;
END;
$$;

-- Função para incrementar uso de respostas pré-computadas
CREATE OR REPLACE FUNCTION increment_precomputed_usage(answer_id TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE precomputed_answers 
  SET vezes_usada = vezes_usada + 1
  WHERE id = answer_id;
END;
$$; 