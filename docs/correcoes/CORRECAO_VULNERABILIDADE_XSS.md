# Correção de Vulnerabilidade XSS em VisualizarAvaliacao.tsx

## Problema Identificado

O arquivo `src/pages/VisualizarAvaliacao.tsx` possuía uma vulnerabilidade de Cross-Site Scripting (XSS) onde conteúdo HTML estava sendo processado e renderizado sem sanitização adequada.

### Pontos Vulneráveis:

1. **Linha 156**: Conteúdo HTML inserido diretamente no editor sem sanitização
2. **Linha 271**: Conteúdo HTML salvo no banco de dados sem sanitização
3. **Linha 1374**: Conteúdo HTML renderizado com `dangerouslySetInnerHTML` sem sanitização

## Solução Implementada

### 1. Instalação e Configuração do DOMPurify

O DOMPurify já estava instalado como dependência. Foi adicionada uma configuração segura:

```typescript
import DOMPurify from 'dompurify';

// Configuração segura do DOMPurify para prevenir XSS
const configurarDOMPurify = () => {
  // Remover atributos perigosos que podem executar código
  DOMPurify.addHook('beforeSanitizeAttributes', function (node) {
    // Remover todos os atributos de evento
    if (node.tagName) {
      const attributes = node.attributes;
      for (let i = attributes.length - 1; i >= 0; i--) {
        const attrName = attributes[i].name;
        if (attrName.startsWith('on')) {
          node.removeAttribute(attrName);
        }
      }
    }
  });
};

// Função utilitária para sanitização segura
const sanitizarHTML = (html: string): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html);
};
```

### 2. Sanitização Antes de Salvar no Banco

```typescript
const salvarAlteracoes = useCallback(async () => {
  if (!avaliacao || !dadosEdicao) return;

  try {
    setSalvando(true);

    // Sanitizar o conteúdo HTML antes de salvar no banco
    const conteudoSanitizado = sanitizarHTML(dadosEdicao.conteudo_html || '');

    const { error } = await supabase
      .from('avaliacoes')
      .update({
        // ...outros campos
        conteudo_html: conteudoSanitizado,
        // ...outros campos
      })
```

### 3. Sanitização Antes de Inserir no Editor

```typescript
useEffect(() => {
  if (modoEdicao && editorRef.current && dadosEdicao.conteudo_html && !editorInicializado) {
    // Sanitizar o conteúdo antes de inserir no editor
    const conteudoSanitizado = sanitizarHTML(dadosEdicao.conteudo_html);
    editorRef.current.innerHTML = conteudoSanitizado;
    setEditorInicializado(true);
  }
}, [modoEdicao, dadosEdicao.conteudo_html, editorInicializado]);
```

### 4. Sanitização na Renderização

```typescript
<div 
  className="prose prose-indigo max-w-none..."
  dangerouslySetInnerHTML={{ 
    __html: sanitizarHTML(avaliacao.conteudo_html) || '<p class="text-gray-500 italic">Conteúdo não disponível</p>' 
  }}
/>
```

### 5. Sanitização em Operações de Manipulação

Também foi adicionada sanitização em:
- Renumeração de questões
- Inserção de novas questões
- Outras operações que manipulam HTML

## Benefícios da Correção

1. **Prevenção de XSS**: Todo conteúdo HTML é sanitizado antes de ser processado
2. **Múltiplas camadas de proteção**: Sanitização em vários pontos críticos
3. **Preservação da funcionalidade**: A sanitização mantém tags HTML válidas
4. **Performance**: DOMPurify é otimizado para performance

## Teste da Segurança

Para testar se a correção está funcionando, você pode tentar inserir scripts maliciosos como:

```html
<script>alert('XSS')</script>
<img src="x" onerror="alert('XSS')">
<div onclick="alert('XSS')">Clique aqui</div>
```

Após a correção, esses scripts serão sanitizados e não executarão código malicioso.

## Observações Importantes

- O DOMPurify foi configurado para remover todos os atributos que começam com "on" (onclick, onload, etc.)
- A sanitização é aplicada tanto na entrada quanto na saída de dados
- A correção mantém compatibilidade com HTML válido para formatação de texto
- Todos os pontos de entrada de dados HTML foram protegidos

Esta implementação garante que o aplicativo esteja protegido contra ataques XSS sem comprometer a funcionalidade do editor WYSIWYG. 