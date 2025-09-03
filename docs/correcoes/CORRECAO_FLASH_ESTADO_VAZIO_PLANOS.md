# Correção: Flash do Estado Vazio na Tela de Planos de Aula

## Problema Identificado

O usuário relatou que ao entrar na tela de planos de aula, aparecia momentaneamente o card de "estado vazio" (quando não há planos) antes de carregar os dados reais. Isso criava uma experiência visual ruim, pois o usuário via brevemente a mensagem "Nenhum plano de aula criado ainda" mesmo tendo planos criados.

## Causa do Problema

O problema ocorria devido à sequência de carregamento dos dados:

1. **Componente monta**: `planosAula = []` (array vazio inicial)
2. **Condição avaliada**: `planosAula.length === 0` retorna `true`
3. **Estado vazio mostrado**: Card de "criar primeiro plano" aparece
4. **Dados carregam**: Planos são carregados do Supabase
5. **Estado atualizado**: Cards dos planos aparecem

Entre os passos 2-4 havia um "flash" visual indesejado.

## Solução Implementada

### **Arquivo**: `src/pages/PlanosAula.tsx`

#### **1. Adicionado Estado de Controle**
```typescript
// ✅ NOVO - Estado para controlar se dados foram carregados
const [dadosCarregados, setDadosCarregados] = useState(false);
```

#### **2. Atualizado Função de Carregamento**
```typescript
// ✅ CORRIGIDO - Marcar dados como carregados
const carregarPlanosOtimizado = useCallback(async () => {
  // ... código de carregamento ...
  
  try {
    // ... consulta ao Supabase ...
    setPlanosAula(planosEnriquecidos);
    setDadosCarregados(true); // ✅ Marcar como carregado
    
  } catch (error: any) {
    // ... tratamento de erro ...
    setDadosCarregados(true); // ✅ Marcar como carregado mesmo com erro
  } finally {
    setLoadingPlanos(false);
  }
}, [user, escolaAtiva, professor]);
```

#### **3. Corrigida Condição do Estado Vazio**
```typescript
// ❌ ANTES - Mostrava estado vazio durante carregamento
{!loadingPlanos && !error && planosAula.length === 0 && (

// ✅ DEPOIS - Só mostra após dados carregados
{!loadingPlanos && !loadingProfessor && !error && planosAula.length === 0 && professor && dadosCarregados && (
```

## Lógica da Correção

### **Estados Possíveis**:

1. **Carregando Professor**: `loadingProfessor = true`
   - Mostra loading ou nada

2. **Carregando Planos**: `loadingPlanos = true`
   - Mostra loading ou nada

3. **Dados Carregados com Planos**: `dadosCarregados = true && planosAula.length > 0`
   - Mostra cards dos planos

4. **Dados Carregados sem Planos**: `dadosCarregados = true && planosAula.length === 0`
   - Mostra estado vazio

5. **Erro**: `error !== null`
   - Mostra mensagem de erro

### **Condições de Exibição**:

```typescript
// Cards de métricas e filtros
{!loadingPlanos && !error && planosAula.length > 0 && (

// Estado de erro
{error && (

// Estado vazio (SÓ após dados carregados)
{!loadingPlanos && !loadingProfessor && !error && planosAula.length === 0 && professor && dadosCarregados && (

// Lista de planos
{!loadingPlanos && planosFiltrados.length > 0 && (

// Nenhum resultado na busca
{!loadingPlanos && currentSearchTerm.trim() !== '' && planosFiltrados.length === 0 && (
```

## Resultado Alcançado

### ✅ **Antes da Correção**
- Flash visual do estado vazio
- Experiência confusa para o usuário
- Impressão de que não há planos mesmo quando existem

### ✅ **Depois da Correção**
- Carregamento suave sem flashes
- Estado vazio só aparece quando realmente não há planos
- Experiência visual consistente e profissional

## Fluxo de Carregamento Corrigido

1. **Componente monta**: Estados iniciais
2. **Carrega professor**: `loadingProfessor = true`
3. **Professor carregado**: `loadingProfessor = false`
4. **Carrega planos**: `loadingPlanos = true`
5. **Planos carregados**: `loadingPlanos = false`, `dadosCarregados = true`
6. **Exibe resultado**: Cards dos planos OU estado vazio (se realmente não há planos)

## Benefícios

- **UX melhorada**: Sem flashes visuais indesejados
- **Feedback claro**: Estados de loading apropriados
- **Confiabilidade**: Estado vazio só quando realmente aplicável
- **Performance**: Não afeta velocidade de carregamento

## Arquivos Modificados

1. **`src/pages/PlanosAula.tsx`**
   - Adicionado estado `dadosCarregados`
   - Atualizada função `carregarPlanosOtimizado`
   - Corrigida condição do estado vazio

Esta correção garante que o usuário tenha uma experiência visual suave e consistente ao navegar para a tela de planos de aula. 