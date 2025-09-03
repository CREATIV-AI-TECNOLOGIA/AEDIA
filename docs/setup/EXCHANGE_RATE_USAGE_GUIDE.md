# 💱 Sistema de Taxa de Câmbio Dinâmica

## 📋 Visão Geral

Agora você pode configurar a taxa de câmbio USD/BRL dinamicamente sempre que quiser! O sistema salva sua configuração e atualiza automaticamente todos os valores em reais em tempo real.

## 🎯 Como Usar

### 1. **Acessar as Configurações**
- Abra o chat
- Clique no ícone de gráfico (📊) no canto superior direito
- No painel que abrir, você verá a seção "Configuração de Taxa de Câmbio"

### 2. **Alterar a Taxa de Câmbio**
- Clique no botão "Editar" na seção de taxa de câmbio
- Digite o novo valor (ex: 5.85, 6.20, etc.)
- Clique em "Salvar"
- Todos os valores em reais serão atualizados automaticamente!

### 3. **Resetar para Padrão**
- Se quiser voltar ao valor padrão (5.50), clique em "Reset"
- Confirme a ação

## 🔄 Atualizações Automáticas

Quando você altera a taxa de câmbio, o sistema atualiza automaticamente:

- ✅ **Indicadores no chat** - mostra o custo da sessão em USD e BRL
- ✅ **Painel de monitoramento** - todos os relatórios e gráficos
- ✅ **Histórico de custos** - recalcula valores antigos com a nova taxa
- ✅ **Informações contextuais** - sempre mostra a taxa atual

## 📱 Interface Visual

### No Chat Principal
```
Sessão: $0.0025 (R$ 0,0138)
Câmbio: 1 USD = 5.50 BRL
```

### No Painel de Monitoramento
- Card dedicado para configuração da taxa
- Mostra quando foi atualizada pela última vez
- Exemplo de conversão em tempo real
- Fonte da taxa (Manual/Padrão)

## 💾 Persistência

- **Salvo automaticamente** no navegador (localStorage)
- **Mantém entre sessões** - não perde quando fecha o navegador
- **Por usuário** - cada professor tem sua própria configuração
- **Backup automático** - sempre tem um valor padrão como fallback

## 🔧 Funcionalidades Técnicas

### Métodos Disponíveis
```typescript
// Obter taxa atual
const rate = tokenService.getExchangeRate();

// Definir nova taxa
tokenService.setExchangeRate(5.85, 'manual');

// Resetar para padrão
tokenService.resetExchangeRate();

// Formatação automática
const brlValue = tokenService.formatCostBRL(0.01); // R$ 0,0550
```

### Hook Personalizado
```typescript
// Para componentes que precisam reagir a mudanças
const { exchangeRate, updateExchangeRate } = useExchangeRate();
```

## 📊 Exemplos Práticos

### Cenário 1: Dólar Alto (R$ 6,20)
```
Entrada: 1000 tokens = $0.00015
Saída: 500 tokens = $0.0003
Total: $0.00045 → R$ 0,0028
```

### Cenário 2: Dólar Baixo (R$ 5,00)
```
Entrada: 1000 tokens = $0.00015
Saída: 500 tokens = $0.0003
Total: $0.00045 → R$ 0,0023
```

### Cenário 3: Sessão Longa (10 mensagens)
```
Total: $0.0061
- Com câmbio 5.50: R$ 0,0336
- Com câmbio 6.00: R$ 0,0366
- Diferença: R$ 0,0030
```

## 🎨 Interface Amigável

### Estados Visuais
- **Modo Visualização**: Mostra taxa atual com botão "Editar"
- **Modo Edição**: Campo de input com botões Salvar/Cancelar/Reset
- **Feedback Visual**: Animação de salvamento e confirmações
- **Validação**: Impede valores inválidos (≤ 0)

### Informações Contextuais
- **Última Atualização**: "Atualizado 2 horas atrás"
- **Fonte**: Manual ou Padrão
- **Exemplo**: Mostra conversão de $0.01 em tempo real
- **Histórico**: Mantém registro de quando foi alterado

## 🚀 Benefícios

### Para o Professor
- ✅ **Controle Total**: Você define a taxa que faz sentido
- ✅ **Sempre Atualizado**: Valores em reais sempre precisos
- ✅ **Fácil de Usar**: Interface simples e intuitiva
- ✅ **Transparente**: Sempre mostra qual taxa está sendo usada

### Para o Sistema
- ✅ **Flexível**: Adapta-se a qualquer variação cambial
- ✅ **Confiável**: Sempre tem um valor padrão como backup
- ✅ **Eficiente**: Atualiza apenas quando necessário
- ✅ **Escalável**: Fácil de adicionar novas funcionalidades

## 🔮 Próximas Melhorias

### Planejadas
- 🔄 **Integração com API** de cotação em tempo real
- 📅 **Histórico de taxas** utilizadas
- 📊 **Gráfico de variação** cambial
- ⚡ **Atualização automática** diária
- 📱 **Notificações** de grandes variações

### Possíveis
- 🌍 **Múltiplas moedas** (EUR, GBP, etc.)
- 📈 **Previsão de gastos** baseada em tendências
- 💰 **Alertas de orçamento** personalizados
- 📊 **Relatórios financeiros** detalhados

---

## 🆘 Suporte

### Problemas Comuns
- **Taxa não atualiza**: Recarregue a página
- **Valores estranhos**: Verifique se a taxa está correta
- **Perdeu configuração**: Use o botão Reset e configure novamente

### Dicas
- 💡 **Atualize regularmente** para manter valores precisos
- 💡 **Use fontes confiáveis** para a cotação (Banco Central, etc.)
- 💡 **Monitore tendências** para otimizar custos
- 💡 **Configure alertas** mentais para grandes variações

**Agora você tem controle total sobre os custos em reais! 🎉** 