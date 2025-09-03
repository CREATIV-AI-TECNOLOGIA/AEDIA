# Guia Completo do Estilo de Design - App de Auxílio à Pregação

## 🎯 Filosofia de Design

### Princípios Fundamentais

1. **Legibilidade Máxima a Distância** - Tipografia 72px+ para leitura até 10 metros
2. **Operação Intuitiva Sob Pressão** - Controles grandes, gestos naturais, feedback imediato
3. **Zero Distrações na Projeção** - Interface limpa com foco no conteúdo
4. **Acessibilidade WCAG 2.2 AA** - Alto contraste, navegação por teclado, suporte a leitores de tela

---

## 🎨 Sistema de Cores

### Paleta Principal

```css
/* Light Mode */
--background: #ffffff;
--foreground: oklch(0.145 0 0); /* Quase preto */
--primary: #030213; /* Azul escuro profundo */
--accent: #4fb06d; /* Verde fresco */
--success: #3fbf8a; /* Verde sucesso */
--destructive: #e04545; /* Vermelho erro */

/* Neutros */
--muted: #ececf0; /* Cinza muito claro */
--muted-foreground: #717182; /* Cinza médio */
--border: rgba(0, 0, 0, 0.1); /* Bordas sutis */

/* Projeção (Dark Theme) */
--projection-bg: #0b0b0c; /* Preto para projeção */
--projection-surface: #141416; /* Cinza escuro */
--projection-text: #ffffff; /* Branco puro */
--projection-text-muted: #b5b7ba; /* Cinza claro */
```

### Características das Cores

- **Alto contraste** (minimum 4.5:1 ratio)
- **Cores saturadas mas profissionais**
- **Paleta limitada** para evitar confusão visual
- **Modo escuro específico** para projeção otimizada

---

## 📐 Sistema de Espaçamento

### Grid Base: 8pt System

```css
--space-1: 8px; /* 0.5rem */
--space-2: 16px; /* 1rem */
--space-3: 24px; /* 1.5rem */
--space-4: 32px; /* 2rem */
--space-5: 40px; /* 2.5rem */
--space-6: 48px; /* 3rem */
--space-8: 64px; /* 4rem */
--space-10: 80px; /* 5rem */
--space-12: 96px; /* 6rem */
--space-16: 128px; /* 8rem */
```

### Aplicação do Espaçamento

- **Múltiplos de 8px** sempre
- **Espaçamentos generosos** para toque mobile
- **Hierarquia clara** entre elementos
- **Breathing room** adequado para legibilidade

---

## ✏️ Sistema Tipográfico

### Escala de Tamanhos

```css
--text-xs: 0.75rem; /* 12px - Labels pequenos */
--text-sm: 0.875rem; /* 14px - Texto auxiliar */
--text-base: 1rem; /* 16px - Texto padrão */
--text-lg: 1.125rem; /* 18px - Subtítulos */
--text-xl: 1.25rem; /* 20px - Títulos menores */
--text-2xl: 1.5rem; /* 24px - Títulos médios */
--text-3xl: 1.875rem; /* 30px - Títulos grandes */
--text-4xl: 2.25rem; /* 36px - Headers */
--text-5xl: 3rem; /* 48px - Títulos principais */
--text-6xl: 3.75rem; /* 60px - Display texto */
--text-7xl: 4.5rem; /* 72px - Projeção mínima */
--text-8xl: 6rem; /* 96px - Projeção destaque */
```

### Pesos e Estilos

```css
--font-weight-normal: 400; /* Texto regular */
--font-weight-medium: 500; /* Títulos e botões */
```

### Características Tipográficas

- **Line-height: 1.5** para legibilidade
- **Tracking ajustado** para grandes tamanhos
- **Fonte system** para performance
- **Hierarquia visual clara**

---

## 🧩 Componentes e Padrões

### Botões

#### Variantes

```tsx
// Primário - Ação principal
<Button size="lg" className="h-16 text-lg">
  Ação Principal
</Button>

// Secundário - Ações secundárias
<Button variant="outline" size="lg" className="h-16">
  Ação Secundária
</Button>

// Ghost - Ações terciárias
<Button variant="ghost" size="sm">
  Configurações
</Button>
```

#### Características

- **Altura mínima: 44px** (mobile touch)
- **Altura padrão: 64px** para ações principais
- **Border radius: 10px** (suave mas definido)
- **Feedback tátil** em dispositivos móveis

### Cards

```tsx
<Card className="w-full">
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
  </CardHeader>
  <CardContent>Conteúdo do card</CardContent>
</Card>
```

#### Características

- **Background branco/cinza claro**
- **Sombra sutil**: `0 4px 16px rgba(0,0,0,0.28)`
- **Border radius: 16px**
- **Padding generoso**: 24px

### Indicadores de Status

```tsx
<Badge variant="outline">
  <Wifi className="w-4 h-4 mr-1" />
  Conectado
</Badge>
```

#### Estados Visuais

- **Verde**: Conectado/Sucesso
- **Vermelho**: Erro/Desconectado
- **Cinza**: Neutro/Inativo
- **Azul**: Informação

---

## 📱 Design Responsivo

### Breakpoints

```css
/* Mobile First Approach */
sm: 640px; /* Smartphones */
md: 768px; /* Tablets */
lg: 1024px; /* Desktop */
xl: 1280px; /* Large Desktop */
```

### Estratégias por Dispositivo

#### Mobile (Controle)

- **Touch targets: 44px+**
- **Gestos de swipe** naturais
- **Navegação thumb-friendly**
- **Safe areas** consideradas

#### Desktop (Projeção)

- **Tipografia gigante** (72px+)
- **Atalhos de teclado**
- **Conteúdo centralizado**
- **Máximo contraste**

---

## 🌐 Acessibilidade

### Conformidade WCAG 2.2 AA

#### Contraste

- **Texto normal**: Minimum 4.5:1
- **Texto grande**: Minimum 3:1
- **Interface elementos**: 3:1

#### Navegação

- **Focus indicators** visíveis
- **Keyboard navigation** completa
- **Screen reader** support
- **Skip links** disponíveis

#### Motion & Animation

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🎭 Estados de Interface

### Loading States

- **Skeleton screens** para carregamento
- **Progress indicators** para processos longos
- **Spinners mínimos** para ações rápidas

### Error States

- **Mensagens claras** e acionáveis
- **Cores de erro** consistentes
- **Recovery paths** óbvios

### Empty States

- **Ilustrações simples** ou ícones
- **Mensagens encorajadoras**
- **Call-to-actions** claros

---

## 📐 Layout e Grid

### Grid System

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

/* Mobile */
@media (max-width: 768px) {
  .grid-mobile {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

/* Desktop */
@media (min-width: 769px) {
  .grid-desktop {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 24px;
  }
}
```

### Princípios de Layout

- **Content-first** approach
- **Flexbox** para componentes
- **CSS Grid** para layouts complexos
- **Aspect ratios** preservados

---

## 🚀 Performance

### Otimizações de Design

- **Minimal animations** para performance
- **System fonts** para velocidade
- **Lazy loading** de imagens
- **Critical CSS** inline

### Bundle Size

- **Tree-shaking** de componentes
- **Dynamic imports** para rotas
- **Minimal dependencies**

---

## 🎨 Implementação em Código

### CSS Custom Properties

```css
:root {
  /* Use sempre as variáveis CSS */
  color: var(--foreground);
  background: var(--background);
  border-radius: var(--radius-m);
  padding: var(--space-4);
}
```

### Tailwind Classes Recomendadas

```tsx
// Tipografia
className = "text-7xl font-medium leading-tight";

// Spacing
className = "p-6 mb-4 gap-3";

// Layout
className = "flex items-center justify-between";

// States
className = "hover:bg-accent focus:ring-2 focus:ring-ring";
```

### Componente Pattern

```tsx
interface ComponentProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Component: React.FC<ComponentProps> = ({
  children,
  variant = "default",
  size = "md",
  ...props
}) => {
  return (
    <div
      className={cn(
        "base-styles",
        variants[variant],
        sizes[size],
      )}
      {...props}
    >
      {children}
    </div>
  );
};
```

---

## 🎯 Aplicação em Outros Projetos

### Adaptação do Design System

1. **Extraia os tokens CSS** (`globals.css`)
2. **Copie a paleta de cores** ajustando para sua marca
3. **Mantenha o sistema de espaçamento** (8pt grid)
4. **Adapte a tipografia** para seu contexto
5. **Use os padrões de componentes** como base

### Princípios Transferíveis

- **Alto contraste** sempre
- **Touch targets grandes** (44px+)
- **Feedback imediato** em interações
- **Hierarquia visual clara**
- **Acessibilidade como prioridade**
- **Mobile-first** approach
- **Performance** como requisito

### Customização por Contexto

```css
/* Para Apps Médicos */
--primary: #2563eb; /* Azul confiável */
--accent: #059669; /* Verde saúde */

/* Para Apps Financeiros */
--primary: #1e40af; /* Azul escuro */
--accent: #dc2626; /* Vermelho alerta */

/* Para Apps Educacionais */
--primary: #7c3aed; /* Roxo criativo */
--accent: #f59e0b; /* Laranja energético */
```

---

## 📋 Checklist de Implementação

### Setup Inicial

- [ ] Configurar CSS custom properties
- [ ] Implementar sistema de cores
- [ ] Definir escala tipográfica
- [ ] Estabelecer espaçamento (8pt grid)

### Componentes Base

- [ ] Botões com variantes
- [ ] Cards com estados
- [ ] Formulários acessíveis
- [ ] Navegação responsiva

### Acessibilidade

- [ ] Testes de contraste
- [ ] Navegação por teclado
- [ ] Screen reader testing
- [ ] Motion preferences

### Performance

- [ ] Critical CSS inline
- [ ] Lazy loading implementado
- [ ] Bundle size otimizado
- [ ] Core Web Vitals atendidos

---

**Este design system foi projetado especificamente para ambientes de apresentação ao vivo com requisitos rigorosos de legibilidade e acessibilidade. Os princípios aqui documentados podem ser adaptados para qualquer projeto que priorize clareza visual, operação intuitiva e inclusão universal.**