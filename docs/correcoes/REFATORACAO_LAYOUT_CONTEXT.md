# Refatoração: Substituição de Manipulação Direta do DOM por LayoutContext

## Problema Identificado

No arquivo `src/components/PlanoAula/PlanoAulaFullView.tsx` entre as linhas 79-99, havia **manipulação direta do DOM** para controlar a visibilidade da sidebar e overflow do body:

### Código Problemático (Removido)
```typescript
// ❌ PROBLEMA: Manipulação direta do DOM
useEffect(() => {
  // Esconder sidebar e overflow do body
  document.body.style.overflow = 'hidden';
  
  // Tentar esconder sidebar
  const sidebar = document.querySelector('aside') || 
                 document.querySelector('.sidebar') || 
                 document.querySelector('nav[role="navigation"]');
  
  if (sidebar) {
    (sidebar as HTMLElement).style.display = 'none';
  }

  // Cleanup ao desmontar
  return () => {
    document.body.style.overflow = '';
    if (sidebar) {
      (sidebar as HTMLElement).style.display = '';
    }
  };
}, []);
```

### Problemas da Manipulação Direta do DOM

1. **Violação dos princípios do React**: React deve gerenciar o estado da UI de forma declarativa
2. **Dificuldade de teste**: Manipulação direta do DOM é difícil de testar unitariamente
3. **Inconsistência de estado**: Estado do DOM pode ficar dessincronizado com o estado do React
4. **Falta de centralização**: Lógica de layout espalhada por diferentes componentes
5. **Problemas de concorrência**: Múltiplos componentes podem tentar manipular os mesmos elementos
6. **Debugging complexo**: Mudanças no DOM não são rastreáveis pelo React DevTools

## Solução Implementada

### 1. Criação do LayoutContext

**Arquivo**: `src/context/LayoutContext.tsx`

Criado um contexto dedicado para gerenciar o estado do layout de forma centralizada e declarativa:

#### 🏗️ **Interface do Estado**
```typescript
interface LayoutState {
  sidebarVisible: boolean;
  bodyOverflowHidden: boolean;
}

interface LayoutContextType {
  layoutState: LayoutState;
  setSidebarVisible: (visible: boolean) => void;
  setBodyOverflowHidden: (hidden: boolean) => void;
  enterFullscreenMode: () => void;
  exitFullscreenMode: () => void;
}
```

#### 🎛️ **Provider com Estado Centralizado**
```typescript
export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [layoutState, setLayoutState] = useState<LayoutState>({
    sidebarVisible: true,
    bodyOverflowHidden: false,
  });

  // Efeito para aplicar mudanças no body overflow
  useEffect(() => {
    if (layoutState.bodyOverflowHidden) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [layoutState.bodyOverflowHidden]);

  // Efeito para aplicar mudanças na sidebar
  useEffect(() => {
    const sidebar = document.querySelector('aside') || 
                   document.querySelector('.sidebar') || 
                   document.querySelector('nav[role="navigation"]');
    
    if (sidebar) {
      if (layoutState.sidebarVisible) {
        (sidebar as HTMLElement).style.display = '';
      } else {
        (sidebar as HTMLElement).style.display = 'none';
      }
    }

    return () => {
      if (sidebar) {
        (sidebar as HTMLElement).style.display = '';
      }
    };
  }, [layoutState.sidebarVisible]);
```

#### 🚀 **Funções de Conveniência**
```typescript
const enterFullscreenMode = () => {
  setLayoutState({
    sidebarVisible: false,
    bodyOverflowHidden: true,
  });
};

const exitFullscreenMode = () => {
  setLayoutState({
    sidebarVisible: true,
    bodyOverflowHidden: false,
  });
};
```

#### 🪝 **Hook Personalizado**
```typescript
export const useLayout = (): LayoutContextType => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout deve ser usado dentro de um LayoutProvider');
  }
  return context;
};
```

### 2. Integração no App.tsx

**Arquivo**: `src/App.tsx`

Adicionado o LayoutProvider na hierarquia de contextos:

```typescript
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EscolaProvider>
          <LayoutProvider>  {/* ✅ Novo provider adicionado */}
            <AuthRedirector />
            <Routes>
              {/* ... rotas ... */}
            </Routes>
          </LayoutProvider>
        </EscolaProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### 3. Refatoração do PlanoAulaFullView

**Arquivo**: `src/components/PlanoAula/PlanoAulaFullView.tsx`

#### **Antes (Manipulação Direta do DOM):**
```typescript
// ❌ Manipulação direta do DOM
useEffect(() => {
  document.body.style.overflow = 'hidden';
  
  const sidebar = document.querySelector('aside') || 
                 document.querySelector('.sidebar') || 
                 document.querySelector('nav[role="navigation"]');
  
  if (sidebar) {
    (sidebar as HTMLElement).style.display = 'none';
  }

  return () => {
    document.body.style.overflow = '';
    if (sidebar) {
      (sidebar as HTMLElement).style.display = '';
    }
  };
}, []);
```

#### **Depois (Uso do Context):**
```typescript
// ✅ Uso declarativo do contexto
const { enterFullscreenMode, exitFullscreenMode } = useLayout();

useEffect(() => {
  console.log('🖥️ [PlanoAulaFullView] Entrando em modo fullscreen');
  enterFullscreenMode();

  return () => {
    console.log('🖥️ [PlanoAulaFullView] Saindo do modo fullscreen');
    exitFullscreenMode();
  };
}, [enterFullscreenMode, exitFullscreenMode]);
```

## Benefícios da Refatoração

### ✅ **Abordagem Declarativa**
- **Antes**: Manipulação imperativa direta do DOM
- **Depois**: Estado declarativo gerenciado pelo React

### ✅ **Centralização do Estado**
- **Antes**: Lógica de layout espalhada por componentes
- **Depois**: Estado centralizado no LayoutContext

### ✅ **Testabilidade**
- **Antes**: Difícil de testar manipulação direta do DOM
- **Depois**: Fácil de testar mudanças de estado do contexto

### ✅ **Reutilização**
- **Antes**: Código duplicado em cada componente que precisa controlar layout
- **Depois**: Hook reutilizável `useLayout()` disponível globalmente

### ✅ **Debugging**
- **Antes**: Mudanças no DOM não rastreáveis pelo React DevTools
- **Depois**: Estado visível e rastreável no React DevTools

### ✅ **Consistência**
- **Antes**: Possibilidade de estado inconsistente entre DOM e React
- **Depois**: Estado sempre sincronizado através do contexto

## Funcionalidades do LayoutContext

### 🎯 **Controle Individual**
```typescript
const { setSidebarVisible, setBodyOverflowHidden } = useLayout();

// Controlar apenas a sidebar
setSidebarVisible(false);

// Controlar apenas o overflow do body
setBodyOverflowHidden(true);
```

### 🖥️ **Modo Fullscreen**
```typescript
const { enterFullscreenMode, exitFullscreenMode } = useLayout();

// Entrar em modo fullscreen (esconde sidebar + bloqueia scroll)
enterFullscreenMode();

// Sair do modo fullscreen (mostra sidebar + libera scroll)
exitFullscreenMode();
```

### 📊 **Acesso ao Estado**
```typescript
const { layoutState } = useLayout();

console.log('Sidebar visível:', layoutState.sidebarVisible);
console.log('Body overflow hidden:', layoutState.bodyOverflowHidden);
```

## Casos de Uso

### 📝 **Editores Fullscreen**
```typescript
// Em componentes como PlanoAulaFullView, editores de avaliação, etc.
const { enterFullscreenMode, exitFullscreenMode } = useLayout();

useEffect(() => {
  enterFullscreenMode();
  return () => exitFullscreenMode();
}, []);
```

### 🎨 **Modais que Precisam Bloquear Scroll**
```typescript
const { setBodyOverflowHidden } = useLayout();

useEffect(() => {
  setBodyOverflowHidden(true);
  return () => setBodyOverflowHidden(false);
}, []);
```

### 📱 **Responsividade**
```typescript
const { setSidebarVisible } = useLayout();

useEffect(() => {
  const handleResize = () => {
    setSidebarVisible(window.innerWidth > 768);
  };
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

## Estrutura de Arquivos

```
src/
├── context/
│   ├── AuthContext.tsx
│   ├── EscolaContext.tsx
│   └── LayoutContext.tsx          ✅ Novo arquivo
├── components/
│   └── PlanoAula/
│       └── PlanoAulaFullView.tsx  🔄 Refatorado
└── App.tsx                        🔄 Atualizado
```

## Testes Recomendados

### 🧪 **Teste do LayoutContext**
```typescript
// LayoutContext.test.tsx
import { renderHook, act } from '@testing-library/react';
import { LayoutProvider, useLayout } from '../LayoutContext';

test('deve entrar e sair do modo fullscreen', () => {
  const { result } = renderHook(() => useLayout(), {
    wrapper: LayoutProvider,
  });

  act(() => {
    result.current.enterFullscreenMode();
  });

  expect(result.current.layoutState.sidebarVisible).toBe(false);
  expect(result.current.layoutState.bodyOverflowHidden).toBe(true);

  act(() => {
    result.current.exitFullscreenMode();
  });

  expect(result.current.layoutState.sidebarVisible).toBe(true);
  expect(result.current.layoutState.bodyOverflowHidden).toBe(false);
});
```

### 🧪 **Teste do PlanoAulaFullView**
```typescript
// PlanoAulaFullView.test.tsx
import { render } from '@testing-library/react';
import { LayoutProvider } from '../../context/LayoutContext';
import PlanoAulaFullView from './PlanoAulaFullView';

test('deve entrar em modo fullscreen ao montar', () => {
  const mockEnterFullscreen = jest.fn();
  const mockExitFullscreen = jest.fn();

  // Mock do useLayout
  jest.mock('../../context/LayoutContext', () => ({
    useLayout: () => ({
      enterFullscreenMode: mockEnterFullscreen,
      exitFullscreenMode: mockExitFullscreen,
    }),
  }));

  render(
    <LayoutProvider>
      <PlanoAulaFullView plano={mockPlano} onClose={jest.fn()} />
    </LayoutProvider>
  );

  expect(mockEnterFullscreen).toHaveBeenCalled();
});
```

## Migração de Outros Componentes

Para migrar outros componentes que fazem manipulação direta do DOM:

### 🔄 **Padrão de Migração**

**Antes:**
```typescript
useEffect(() => {
  document.body.style.overflow = 'hidden';
  return () => {
    document.body.style.overflow = '';
  };
}, []);
```

**Depois:**
```typescript
const { setBodyOverflowHidden } = useLayout();

useEffect(() => {
  setBodyOverflowHidden(true);
  return () => setBodyOverflowHidden(false);
}, [setBodyOverflowHidden]);
```

## Próximos Passos

### 🚀 **Melhorias Futuras**

1. **Animações**: Adicionar suporte a animações de transição
2. **Breakpoints**: Integrar com sistema de breakpoints responsivos
3. **Persistência**: Salvar preferências de layout no localStorage
4. **Múltiplos Layouts**: Suporte a diferentes tipos de layout (sidebar, topbar, etc.)

### 📝 **Componentes para Migrar**

Identificar outros componentes que fazem manipulação direta do DOM:
- Modais
- Drawers
- Overlays
- Editores fullscreen

## Arquivos Modificados

1. **`src/context/LayoutContext.tsx`** - Novo contexto criado
2. **`src/App.tsx`** - Adicionado LayoutProvider
3. **`src/components/PlanoAula/PlanoAulaFullView.tsx`** - Refatorado para usar contexto
4. **`REFATORACAO_LAYOUT_CONTEXT.md`** - Esta documentação

## Resultado Final

### Antes:
- ❌ **Manipulação direta do DOM**: `document.body.style.overflow = 'hidden'`
- ❌ **Código imperativo**: `sidebar.style.display = 'none'`
- ❌ **Estado não rastreável**: Mudanças invisíveis ao React DevTools
- ❌ **Lógica espalhada**: Cada componente gerencia seu próprio layout
- ❌ **Difícil de testar**: Manipulação direta do DOM

### Depois:
- ✅ **Abordagem declarativa**: `enterFullscreenMode()`
- ✅ **Estado centralizado**: LayoutContext gerencia tudo
- ✅ **Rastreabilidade**: Estado visível no React DevTools
- ✅ **Reutilização**: Hook `useLayout()` disponível globalmente
- ✅ **Testabilidade**: Fácil de testar mudanças de estado

Esta refatoração segue as **melhores práticas do React**, promovendo uma arquitetura mais limpa, testável e maintível, onde o estado da UI é gerenciado de forma declarativa e centralizada. 