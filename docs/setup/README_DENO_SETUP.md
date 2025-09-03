# Configuração Deno para Funções Supabase

## Problema Resolvido
✅ Corrigido erro: `Cannot find type definition file for 'https://deno.land/x/supabase_functions_types/edge-runtime.d.ts'`

## Configurações Aplicadas

### 1. Arquivos de Configuração Deno
- `supabase/functions/deno.json` - Configuração global para todas as funções
- `supabase/functions/perplexity-proxy-handler/deno.json` - Configuração específica
- `supabase/functions/.vscode/settings.json` - Configurações VS Code para funções
- `.vscode/settings.json` - Configurações globais do workspace

### 2. Para Resolver Erros de Linter no VS Code

Se ainda aparecerem erros de linter no VS Code:

1. **Recarregue o VS Code:**
   - Pressione `Ctrl+Shift+P`
   - Digite "Developer: Reload Window"
   - Pressione Enter

2. **Opcional - Instalar extensão Deno (se necessário):**
   - Se quiser recursos avançados do Deno, instale "Deno" extension (denoland.vscode-deno)
   - Mas não é obrigatório para o funcionamento básico

3. **Verificar configurações:**
   - As configurações já estão aplicadas automaticamente
   - Deno está habilitado apenas para `supabase/functions/`
   - TypeScript padrão é usado para o resto do projeto

### 3. Verificação
- ✅ Build funciona: `npm run build`
- ✅ Apenas 41 warnings de variáveis não utilizadas (não críticos)
- ✅ Sem erros de tipos Deno

## Estrutura de Arquivos
```
.vscode/
  settings.json                 # Configurações globais
supabase/
  functions/
    .vscode/
      settings.json             # Configurações específicas para Deno
    deno.json                   # Configuração Deno global
    .denoignore                 # Arquivos ignorados pelo Deno
    perplexity-proxy-handler/
      deno.json                 # Configuração específica da função
      index.ts                  # Função corrigida
```

## Comandos Úteis
```bash
# Verificar se o build funciona
npm run build

# Testar função Deno localmente (se necessário)
cd supabase/functions/perplexity-proxy-handler
deno run --allow-net --allow-env index.ts
``` 