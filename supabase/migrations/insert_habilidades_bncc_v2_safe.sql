-- Script seguro para inserir habilidades BNCC V2 (evita duplicatas)
-- Criado em: $(date)

-- Inserir habilidades BNCC V2 para 1º ano - 1º trimestre (com proteção contra duplicatas)
INSERT INTO habilidades_bncc_v2 (codigo, descricao, disciplina, ano_serie, serie_nome, pratica_linguagem, objetos_conhecimento, trimestre_sugerido) VALUES
('EF15LP01', 'Identificar a função social de textos que circulam em campos da vida social dos quais participa cotidianamente (a casa, a rua, a comunidade, a escola) e nas mídias impressa, de massa e digital, reconhecendo para que foram produzidos, onde circulam, quem os produziu e a quem se destinam.', 'Língua Portuguesa', 1, '1º ano', 'Leitura/escuta (compartilhada e autônoma)', ARRAY['Reconstrução das condições de produção e recepção de textos'], 1),

('EF15LP02', 'Estabelecer expectativas em relação ao texto que vai ler (pressuposições antecipadoras dos sentidos, da forma e da função social do texto), apoiando-se em seus conhecimentos prévios sobre as condições de produção e recepção desse texto, o gênero, o suporte e o universo temático, bem como sobre saliências textuais, recursos gráficos, imagens, dados da própria obra (índice, prefácio etc.), confirmando antecipações e inferências realizadas antes e durante a leitura de textos, checando a adequação das hipóteses realizadas.', 'Língua Portuguesa', 1, '1º ano', 'Leitura/escuta (compartilhada e autônoma)', ARRAY['Estratégias de leitura'], 1),

('EF15LP05', 'Planejar, com a ajuda do professor, o texto que será produzido, considerando a situação comunicativa, os interlocutores (quem escreve/para quem escreve); a finalidade ou o propósito (escrever para quê); a circulação (onde o texto vai circular); o suporte (qual é o portador do texto); a linguagem, organização e forma do texto e seu tema, pesquisando em meios impressos ou digitais, sempre que for preciso, informações necessárias à produção do texto, organizando em tópicos os dados e as fontes pesquisadas.', 'Língua Portuguesa', 1, '1º ano', 'Produção de textos (escrita compartilhada e autônoma)', ARRAY['Planejamento de texto'], 1),

('EF15LP09', 'Expressar-se em situações de intercâmbio oral com clareza, preocupando-se em ser compreendido pelo interlocutor e usando a palavra com tom de voz audível, boa articulação e ritmo adequado.', 'Língua Portuguesa', 1, '1º ano', 'Oralidade', ARRAY['Oralidade pública/Intercâmbio conversacional em sala de aula'], 1),

('EF01LP03', 'Observar escritas convencionais, comparando-as às suas produções escritas, percebendo semelhanças e diferenças.', 'Língua Portuguesa', 1, '1º ano', 'Análise linguística/semiótica (Alfabetização)', ARRAY['Construção do sistema alfabético'], 1),

('EF01LP04', 'Distinguir as letras do alfabeto de outros sinais gráficos.', 'Língua Portuguesa', 1, '1º ano', 'Análise linguística/semiótica (Alfabetização)', ARRAY['Construção do sistema alfabético'], 1),

-- Habilidades para 2º ano
('EF02LP01', 'Utilizar, ao produzir o texto, grafia correta de palavras conhecidas ou com estruturas silábicas já dominadas, letras maiúsculas em início de frases e em substantivos próprios, segmentação entre as palavras, ponto final, ponto de interrogação e ponto de exclamação.', 'Língua Portuguesa', 2, '2º ano', 'Produção de textos (escrita compartilhada e autônoma)', ARRAY['Construção do sistema alfabético'], 1),

('EF02LP02', 'Grafar corretamente palavras com correspondências regulares diretas entre letras e fonemas (f, v, t, d, p, b) e correspondências regulares contextuais (c e qu; e e o, em posição átona em final de palavra).', 'Língua Portuguesa', 2, '2º ano', 'Análise linguística/semiótica (Alfabetização)', ARRAY['Construção do sistema alfabético'], 1)
ON CONFLICT (codigo) DO NOTHING;

-- Verificar dados inseridos
SELECT 
    'Habilidades BNCC V2 inseridas:' as status,
    COUNT(*) as total_habilidades
FROM habilidades_bncc_v2;

-- Mostrar algumas habilidades inseridas
SELECT 
    codigo,
    LEFT(descricao, 100) || '...' as descricao_resumida,
    ano_serie,
    serie_nome,
    pratica_linguagem,
    trimestre_sugerido
FROM habilidades_bncc_v2 
WHERE ano_serie IN (1, 2)
ORDER BY ano_serie, codigo
LIMIT 10;