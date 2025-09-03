# Capitalização Automática

Este projeto implementa capitalização automática da primeira letra em todos os campos de entrada de texto, exceto campos de email.

## Como Usar

### 1. Componentes de UI com Capitalização Automática

Use os componentes `AutoCapitalizeInput` e `AutoCapitalizeTextarea` em vez dos elementos HTML padrão:

```tsx
import { AutoCapitalizeInput, AutoCapitalizeTextarea } from '../components/ui';

// Input com capitalização automática
<AutoCapitalizeInput
  placeholder="Digite seu nome"
  value={nome}
  onChange={(e) => setNome(e.target.value)}
/>

// Textarea com capitalização automática  
<AutoCapitalizeTextarea
  placeholder="Digite uma descrição"
  value={descricao}
  onChange={(e) => setDescricao(e.target.value)}
/>

// Para desabilitar capitalização em casos especiais
<AutoCapitalizeInput
  disableAutoCapitalize={true}
  value={codigoEspecial}
  onChange={(e) => setCodigoEspecial(e.target.value)}
/>
```

### 2. Função Utilitária para Casos Customizados

Para casos onde você tem controle direto sobre o valor:

```tsx
import { applyAutoCapitalize } from '../utils/textUtils';

const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  const capitalizedValue = applyAutoCapitalize(value, false, {
    placeholder: e.target.placeholder,
    name: e.target.name,
    id: e.target.id,
    type: e.target.type
  });
  setValue(capitalizedValue);
};
```

### 3. Hook para Componentes Existentes

Para aplicar em componentes que já existem:

```tsx
import { useAutoCapitalize } from '../utils/textUtils';

const MyComponent = () => {
  const [value, setValue] = useState('');
  
  const handleChange = useAutoCapitalize(
    (e) => setValue(e.target.value),
    { placeholder: 'Digite seu nome' } // Info do campo para detectar se é email
  );
  
  return (
    <input
      value={value}
      onChange={handleChange}
      placeholder="Digite seu nome"
    />
  );
};
```

## Detecção Automática de Campos de Email

O sistema detecta automaticamente campos de email baseado em:

- `type="email"`
- `name`, `id` ou `placeholder` contendo: "email", "e-mail", "mail"

Campos detectados como email **NÃO** terão capitalização automática aplicada.

## Implementação Atual

- ✅ `SeletorHabilidades.tsx` - Campo de busca
- ✅ Componentes `AutoCapitalizeInput` e `AutoCapitalizeTextarea` criados
- ✅ Funções utilitárias em `src/utils/textUtils.ts`

## Próximos Passos

Para aplicar em todo o aplicativo, substitua gradualmente:

1. `<input>` → `<AutoCapitalizeInput>`
2. `<textarea>` → `<AutoCapitalizeTextarea>`
3. Use as funções utilitárias para casos customizados

## Exemplo de Antes/Depois

### Antes
```tsx
<input
  type="text"
  placeholder="Digite seu nome"
  value={nome}
  onChange={(e) => setNome(e.target.value)}
/>
```

### Depois
```tsx
<AutoCapitalizeInput
  placeholder="Digite seu nome"
  value={nome}
  onChange={(e) => setNome(e.target.value)}
/>
```

O usuário digitando "joão silva" automaticamente se tornará "João silva" (apenas a primeira letra é capitalizada). 