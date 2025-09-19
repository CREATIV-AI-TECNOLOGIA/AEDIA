-- Migração para popular a tabela habilidades_bncc_v2 com dados iniciais
-- Baseado nos dados do mock existente, adaptados para a nova estrutura

-- Inserir habilidades de Língua Portuguesa para o 1º ano
INSERT INTO habilidades_bncc_v2 (
    codigo,
    descricao,
    disciplina,
    ano_serie,
    serie_nome,
    pratica_linguagem,
    objetos_conhecimento,
    trimestre_sugerido,
    nivel_complexidade,
    ativo
) VALUES 
    ('EF01LP01', 'Reconhecer que textos são lidos e escritos da esquerda para a direita e de cima para baixo da página.', 'Língua Portuguesa', 1, '1º ano', 'Leitura/escuta', ARRAY['Sistema de escrita alfabética'], 1, 'facil', true),
    ('EF01LP02', 'Escrever, espontaneamente ou por ditado, palavras e frases de forma alfabética – usando letras/grafemas que representem fonemas.', 'Língua Portuguesa', 1, '1º ano', 'Escrita', ARRAY['Escrita alfabética'], 1, 'medio', true),
    ('EF01LP03', 'Observar escritas convencionais, comparando-as às suas produções escritas, percebendo semelhanças e diferenças.', 'Língua Portuguesa', 1, '1º ano', 'Escrita', ARRAY['Escrita alfabética'], 1, 'medio', true),
    ('EF01LP04', 'Distinguir as letras do alfabeto de outros sinais gráficos.', 'Língua Portuguesa', 1, '1º ano', 'Leitura/escuta', ARRAY['Sistema de escrita alfabética'], 1, 'facil', true),
    ('EF01LP05', 'Reconhecer o sistema de escrita alfabética como representação dos sons da fala.', 'Língua Portuguesa', 1, '1º ano', 'Leitura/escuta', ARRAY['Sistema de escrita alfabética'], 1, 'medio', true),
    ('EF01LP06', 'Segmentar oralmente palavras em sílabas.', 'Língua Portuguesa', 1, '1º ano', 'Oralidade', ARRAY['Consciência fonológica'], 1, 'medio', true),
    ('EF01LP07', 'Identificar fonemas e sua representação por letras.', 'Língua Portuguesa', 1, '1º ano', 'Leitura/escuta', ARRAY['Consciência fonológica'], 2, 'medio', true),
    ('EF01LP08', 'Relacionar elementos sonoros (sílabas, fonemas, partes de palavras) com sua representação escrita.', 'Língua Portuguesa', 1, '1º ano', 'Leitura/escuta', ARRAY['Consciência fonológica'], 2, 'medio', true),
    ('EF01LP09', 'Comparar palavras, identificando semelhanças e diferenças entre sons de sílabas iniciais, mediais e finais.', 'Língua Portuguesa', 1, '1º ano', 'Oralidade', ARRAY['Consciência fonológica'], 2, 'medio', true),
    ('EF01LP10', 'Nomear as letras do alfabeto e recitá-lo na ordem das letras.', 'Língua Portuguesa', 1, '1º ano', 'Oralidade', ARRAY['Sistema de escrita alfabética'], 1, 'facil', true),
    ('EF01LP11', 'Conhecer, diferenciar e relacionar letras em formato imprensa e cursiva, maiúsculas e minúsculas.', 'Língua Portuguesa', 1, '1º ano', 'Escrita', ARRAY['Sistema de escrita alfabética'], 2, 'medio', true),
    ('EF01LP12', 'Reconhecer a separação das palavras, na escrita, por espaços em branco.', 'Língua Portuguesa', 1, '1º ano', 'Escrita', ARRAY['Sistema de escrita alfabética'], 1, 'facil', true);

-- Inserir algumas habilidades de Matemática para o 1º ano
INSERT INTO habilidades_bncc_v2 (
    codigo,
    descricao,
    disciplina,
    ano_serie,
    serie_nome,
    objetos_conhecimento,
    trimestre_sugerido,
    nivel_complexidade,
    ativo
) VALUES 
    ('EF01MA01', 'Utilizar números naturais como indicador de quantidade ou de ordem em diferentes situações cotidianas e reconhecer situações em que os números não indicam contagem nem ordem, mas sim código ou identificação.', 'Matemática', 1, '1º ano', ARRAY['Contagem de rotina', 'Reconhecimento de números no contexto diário'], 1, 'medio', true),
    ('EF01MA02', 'Contar de maneira exata ou aproximada, utilizando diferentes estratégias como o pareamento e outros agrupamentos.', 'Matemática', 1, '1º ano', ARRAY['Contagem de rotina', 'Reconhecimento de números no contexto diário'], 1, 'medio', true),
    ('EF01MA03', 'Estimar e comparar quantidades de objetos de dois conjuntos (em torno de 20 elementos), por estimativa e/ou por correspondência (um a um, dois a dois) para indicar "tem mais", "tem menos" ou "tem a mesma quantidade".', 'Matemática', 1, '1º ano', ARRAY['Quantificação de elementos'], 2, 'medio', true),
    ('EF01MA04', 'Contar a quantidade de objetos de coleções até 100 unidades e apresentar o resultado por registros verbais e simbólicos, em situações de seu interesse, como jogos, brincadeiras, materiais da sala de aula, entre outros.', 'Matemática', 1, '1º ano', ARRAY['Registros de quantidade'], 2, 'medio', true),
    ('EF01MA05', 'Comparar números naturais de até duas ordens em situações cotidianas, com e sem suporte da reta numérica.', 'Matemática', 1, '1º ano', ARRAY['Leitura, escrita e comparação de números naturais'], 3, 'medio', true);

-- Inserir algumas habilidades de Ciências para o 1º ano
INSERT INTO habilidades_bncc_v2 (
    codigo,
    descricao,
    disciplina,
    ano_serie,
    serie_nome,
    objetos_conhecimento,
    trimestre_sugerido,
    nivel_complexidade,
    ativo
) VALUES 
    ('EF01CI01', 'Comparar características de diferentes materiais presentes em objetos de uso cotidiano, discutindo sua origem, os modos como são descartados e como podem ser usados de forma mais consciente.', 'Ciências', 1, '1º ano', ARRAY['Características dos materiais'], 1, 'medio', true),
    ('EF01CI02', 'Localizar, nomear e representar graficamente (por meio de desenhos) partes do corpo humano e explicar suas funções.', 'Ciências', 1, '1º ano', ARRAY['Corpo humano', 'Respeito à diversidade'], 2, 'facil', true),
    ('EF01CI03', 'Discutir as razões pelas quais os hábitos de higiene do corpo (lavar as mãos antes de comer, escovar os dentes, limpar os olhos, o nariz e as orelhas etc.) são necessários para a manutenção da saúde.', 'Ciências', 1, '1º ano', ARRAY['Corpo humano', 'Respeito à diversidade'], 2, 'medio', true),
    ('EF01CI04', 'Comparar características físicas entre os colegas, reconhecendo a diversidade e a importância da valorização, do acolhimento e do respeito às diferenças.', 'Ciências', 1, '1º ano', ARRAY['Corpo humano', 'Respeito à diversidade'], 3, 'medio', true),
    ('EF01CI05', 'Identificar e nomear diferentes escalas de tempo: os períodos diários (manhã, tarde, noite) e a sucessão de dias, semanas, meses e anos.', 'Ciências', 1, '1º ano', ARRAY['Escalas de tempo'], 3, 'medio', true);

COMMIT;