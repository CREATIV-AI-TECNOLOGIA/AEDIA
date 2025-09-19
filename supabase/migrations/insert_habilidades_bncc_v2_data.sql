-- Inserir dados de exemplo para habilidades BNCC V2
-- Baseado na estrutura das tabelas analisadas

-- Inserir práticas de linguagem
INSERT INTO praticas_linguagem_v2 (codigo, nome, descricao, anos_aplicaveis, ordem_apresentacao) VALUES
('LEIT', 'Leitura/escuta (compartilhada e autônoma)', 'Compreensão e interpretação de textos orais e escritos', ARRAY[1,2,3,4,5], 1),
('PROD', 'Produção de textos (escrita compartilhada e autônoma)', 'Elaboração de textos escritos com diferentes propósitos', ARRAY[1,2,3,4,5], 2),
('ORAL', 'Oralidade', 'Participação em situações de comunicação oral', ARRAY[1,2,3,4,5], 3),
('ANAL', 'Análise linguística/semiótica (Alfabetização)', 'Reflexão sobre o sistema de escrita e aspectos linguísticos', ARRAY[1,2,3,4,5], 4);

-- Inserir objetos de conhecimento para 1º ano
INSERT INTO objetos_conhecimento_v2 (codigo, nome, descricao, anos_aplicaveis, pratica_linguagem_id, ordem_apresentacao) VALUES
('LEIT_RECON', 'Reconstrução das condições de produção e recepção de textos', 'Identificação de elementos contextuais dos textos', ARRAY[1], 
 (SELECT id FROM praticas_linguagem_v2 WHERE codigo = 'LEIT' LIMIT 1), 1),
('LEIT_ESTRAT', 'Estratégias de leitura', 'Desenvolvimento de habilidades para compreensão textual', ARRAY[1],
 (SELECT id FROM praticas_linguagem_v2 WHERE codigo = 'LEIT' LIMIT 1), 2),
('PROD_PLAN', 'Planejamento de texto', 'Organização de ideias antes da escrita', ARRAY[1],
 (SELECT id FROM praticas_linguagem_v2 WHERE codigo = 'PROD' LIMIT 1), 1),
('PROD_REV', 'Revisão de textos', 'Aprimoramento de textos produzidos', ARRAY[1],
 (SELECT id FROM praticas_linguagem_v2 WHERE codigo = 'PROD' LIMIT 1), 2),
('ORAL_INTER', 'Oralidade pública/Intercâmbio conversacional em sala de aula', 'Participação em conversas e apresentações', ARRAY[1],
 (SELECT id FROM praticas_linguagem_v2 WHERE codigo = 'ORAL' LIMIT 1), 1),
('ANAL_FONE', 'Correspondência fonema-grafema', 'Relação entre sons e letras', ARRAY[1],
 (SELECT id FROM praticas_linguagem_v2 WHERE codigo = 'ANAL' LIMIT 1), 1),
('ANAL_SIST', 'Construção do sistema alfabético', 'Compreensão do princípio alfabético', ARRAY[1],
 (SELECT id FROM praticas_linguagem_v2 WHERE codigo = 'ANAL' LIMIT 1), 2)
;

-- Inserir habilidades BNCC V2 para 1º ano - 1º trimestre
INSERT INTO habilidades_bncc_v2 (codigo, descricao, disciplina, ano_serie, serie_nome, pratica_linguagem, objetos_conhecimento, trimestre_sugerido) VALUES
('EF15LP01', 'Identificar a função social de textos que circulam em campos da vida social dos quais participa cotidianamente (a casa, a rua, a comunidade, a escola) e nas mídias impressa, de massa e digital, reconhecendo para que foram produzidos, onde circulam, quem os produziu e a quem se destinam.', 'Língua Portuguesa', 1, '1º ano', 'Leitura/escuta (compartilhada e autônoma)', ARRAY['Reconstrução das condições de produção e recepção de textos'], 1),

('EF15LP02', 'Estabelecer expectativas em relação ao texto que vai ler (pressuposições antecipadoras dos sentidos, da forma e da função social do texto), apoiando-se em seus conhecimentos prévios sobre as condições de produção e recepção desse texto, o gênero, o suporte e o universo temático, bem como sobre saliências textuais, recursos gráficos, imagens, dados da própria obra (índice, prefácio etc.), confirmando antecipações e inferências realizadas antes e durante a leitura de textos, checando a adequação das hipóteses realizadas.', 'Língua Portuguesa', 1, '1º ano', 'Leitura/escuta (compartilhada e autônoma)', ARRAY['Estratégias de leitura'], 1),

('EF15LP05', 'Planejar, com a ajuda do professor, o texto que será produzido, considerando a situação comunicativa, os interlocutores (quem escreve/para quem escreve); a finalidade ou o propósito (escrever para quê); a circulação (onde o texto vai circular); o suporte (qual é o portador do texto); a linguagem, organização e forma do texto e seu tema, pesquisando em meios impressos ou digitais, sempre que for preciso, informações necessárias à produção do texto, organizando em tópicos os dados e as fontes pesquisadas.', 'Língua Portuguesa', 1, '1º ano', 'Produção de textos (escrita compartilhada e autônoma)', ARRAY['Planejamento de texto'], 1),

('EF15LP09', 'Expressar-se em situações de intercâmbio oral com clareza, preocupando-se em ser compreendido pelo interlocutor e usando a palavra com tom de voz audível, boa articulação e ritmo adequado.', 'Língua Portuguesa', 1, '1º ano', 'Oralidade', ARRAY['Oralidade pública/Intercâmbio conversacional em sala de aula'], 1),

('EF01LP02', 'Escrever, espontaneamente ou por ditado, palavras e frases de forma alfabética – usando letras/grafemas que representem fonemas.', 'Língua Portuguesa', 1, '1º ano', 'Análise linguística/semiótica (Alfabetização)', ARRAY['Correspondência fonema-grafema'], 1),

('EF01LP04', 'Distinguir as letras do alfabeto de outros sinais gráficos.', 'Língua Portuguesa', 1, '1º ano', 'Análise linguística/semiótica (Alfabetização)', ARRAY['Construção do sistema alfabético'], 1)
;

-- Verificar dados inseridos
SELECT 'Práticas de Linguagem' as tabela, COUNT(*) as total FROM praticas_linguagem_v2
UNION ALL
SELECT 'Objetos de Conhecimento' as tabela, COUNT(*) as total FROM objetos_conhecimento_v2
UNION ALL
SELECT 'Habilidades BNCC V2' as tabela, COUNT(*) as total FROM habilidades_bncc_v2;

-- Mostrar exemplo de habilidades inseridas
SELECT h.codigo, h.descricao, h.ano, h.trimestre, p.nome as pratica_linguagem, o.nome as objeto_conhecimento
FROM habilidades_bncc_v2 h
JOIN praticas_linguagem_v2 p ON h.pratica_linguagem_id = p.id
JOIN objetos_conhecimento_v2 o ON h.objeto_conhecimento_id = o.id
WHERE h.ano = '1º ano' AND h.trimestre = 1
ORDER BY h.codigo
LIMIT 5;