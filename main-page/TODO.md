# TODO - Refatoração Mobile-First Main Page

## ✅ Planejamento

- [x] Análise do código atual
- [x] Identificação de problemas
- [x] Criação do plano de refatoração
- [x] Aprovação do usuário

## 🔄 Implementação

### Fase 1: Limpeza e Organização (Base Mobile-First)

- [ ] Reorganizar estrutura do CSS por seções
- [ ] Remover código duplicado (unificar nav-links/nav-links2)
- [ ] Consolidar variáveis CSS
- [ ] Remover !important desnecessários

### Fase 2: Variáveis CSS Responsivas

- [ ] Criar variáveis com clamp() para tipografia
- [ ] Variáveis para espaçamentos responsivos
- [ ] Variáveis para tamanhos de componentes
- [ ] Variáveis para cores e efeitos

### Fase 3: Hero Section Mobile-First

- [ ] Remover offsets absolutos (top/bottom hardcoded)
- [ ] Implementar layout com flexbox/gap
- [ ] Eye container responsivo
- [ ] Wordmark responsivo
- [ ] Slogan responsivo

### Fase 4: Menus Responsivos

- [ ] Base mobile: stack vertical
- [ ] Unificar estilos nav-panel/nav-panel2
- [ ] Tablet (768px+): grid adaptativo
- [ ] Desktop (1280px+): menus laterais fixos

### Fase 5: CTA e Botões

- [ ] Botões touch-friendly (min 44px)
- [ ] Stack vertical em mobile
- [ ] Layout horizontal em tablet+
- [ ] Tipografia responsiva com clamp()

### Fase 6: Grid de Produtos e Princípios

- [ ] Base: 1 coluna (mobile)
- [ ] Tablet: 2 colunas
- [ ] Desktop: 3 colunas
- [ ] Cards com altura automática

### Fase 7: Otimização de Performance

- [ ] Reduzir filtros em mobile
- [ ] Simplificar backgrounds complexos
- [ ] Otimizar animações
- [ ] Remover código morto

### Fase 8: Media Queries Consolidadas

- [ ] Mobile: 320px - 767px (base mobile-first)
- [ ] Tablet: 768px - 1023px
- [ ] Desktop: 1024px - 1279px
- [ ] Large Desktop: 1280px+

### Fase 9: Testes

- [ ] Testar 320px (iPhone SE)
- [ ] Testar 375px (iPhone 12/13)
- [ ] Testar 768px (iPad)
- [ ] Testar 1024px (Desktop)
- [ ] Testar 1920px+ (4K)
- [ ] Verificar todas funcionalidades
- [ ] Confirmar identidade visual preservada

## 📝 Notas

- Manter TODA a identidade visual (cores, gradientes, efeitos, animações)
- Reduzir de ~1500 para ~800-900 linhas
- Eliminar duplicações e conflitos
- Garantir performance em mobile
- Preservar acessibilidade (WCAG 2.1)

## 🎯 Objetivo

Código limpo, organizado e mobile-first, mantendo 100% da aparência visual atual.
