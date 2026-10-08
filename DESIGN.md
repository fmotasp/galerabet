# Design System — RioSãoPaulo

Guia visual do sistema interno de demandas. Substitui, na prática, o `galera-bet-design-system.md`
(que descreve outro produto: azul/verde/amarelo, sem relação com a agência).
Tema único: escuro. Idioma: pt-BR.

## Princípios
- Ferramenta de trabalho diário: velocidade e clareza antes de decoração.
- A identidade rosa → laranja aparece em detalhes (botão primário, item ativo, logo), não em tudo.
- Cor de estado (verde/vermelho/âmbar) só para significar estado, nunca para decorar.

## Tokens de cor
Definidos em `src/index.css` dentro de `@theme`. **Use sempre a classe do token, nunca o hex.**

| Token | Hex | Classe (exemplos) | Uso |
|---|---|---|---|
| `brand` | `#E4007E` | `bg-brand` `text-brand` `border-brand` `ring-brand` | Rosa Pantone 213C: ação principal, item ativo, foco |
| `brand-alt` | `#E94E18` | `to-brand-alt` | Laranja Pantone 1655C: fim do degradê da marca |
| `canvas` | `#101010` | `bg-canvas` | Fundo da página |
| `surface` | `#141414` | `bg-surface` | Cards e painéis |
| `popover` | `#181818` | `bg-popover` | Menus, dropdowns, popovers |
| `field` | `#1A1A1A` | `bg-field` | Inputs e campos |
| `raised` | `#1C1C1C` | `bg-raised` | Hover de linhas/itens, elementos elevados |
| `line` | `#262626` | `border-line` | Borda padrão |
| `line-strong` | `#2E2E2E` | `border-line-strong` | Borda de popover/modal |
| `line-hover` | `#383838` | `hover:border-line-hover` | Borda em hover |
| `fg-muted` | `#A0A0A0` | `text-fg-muted` | Texto secundário |
| `gold` | `#FFB903` | `text-gold` | Destaque/atenção (prêmio, aviso leve) |
| `chip` | `#2A2A2A` | `bg-chip` | Chips, botões secundários, hover de itens |
| `positive` | `#00A723` | `bg-positive` `border-positive` | Confirmação/sucesso forte (verde da marca de cliente) |
| `fg-subtle` | `#808080` | `text-fg-subtle` | Ícones e texto terciário |
| `brand-dark` | `#C2006B` | `hover:bg-brand-dark` | Hover do rosa sólido |

Texto principal: `#F1F2F2` (já definido no `body`). Opacidade funciona normalmente: `bg-brand/20`.

### Degradê da marca
`bg-gradient-to-r from-brand to-brand-alt`. Reservado a: botão primário, aba/filtro ativo, logo e avatar de destaque.
Não aplicar em texto (`bg-clip-text`), em bordas decorativas nem em vários elementos lado a lado.

### Cores de estado
Verde (`emerald`) = no prazo / ok. Vermelho (`rose`) = atrasado / erro. Âmbar = atenção.
Em gráficos: série principal em rosa → laranja; contexto em cinzas; evitar azul/ciano fora da marca.

## Tipografia
- Corpo: **Barlow**. Títulos/rótulos condensados: **Barlow Condensed**.
- Tamanho mínimo: 12 px (`text-xs`) para texto de leitura; 11 px é o piso absoluto, só para selos curtos em caixa alta.
- Números de KPI e tabelas: `tabular-nums`.

## Forma e espaço
- Raios: `rounded-xl` (controles), `rounded-2xl` (cards), `rounded-full` (avatares, chips).
- Cards: `bg-surface border border-line rounded-2xl p-4`; evitar caixa dentro de caixa.

## Interação e acessibilidade (mínimo exigido)
- Todo elemento clicável é `<button>`/`<a>` (ou tem `role` + teclado) e tem foco visível:
  `focus-visible:outline-2 focus-visible:outline-brand`.
- Botão só com ícone leva `aria-label`.
- Ações destrutivas pedem confirmação ou oferecem "Desfazer".
- Animações respeitam `prefers-reduced-motion`.

## Componentes base
- `ui/Button`, `ui/Modal` (com foco preso), `ui/EmptyState`, `ui/ErrorState`, `ui/Skeleton`.
- Diálogos do sistema: `confirmDialog`, `alertDialog`, `promptDialog` (`lib/dialogs.ts`, renderizados por `DialogHost`).
  **Nunca** usar `window.confirm/alert/prompt`.
- Hooks: `useFocusTrap` (modais/gavetas), `useDropdownA11y` (menus), `useCountUp` (números dos KPIs), `useGlobalShortcuts`.

## Atalhos de teclado
`C` nova tarefa · `G` depois `T/D/R/P` vai para Tarefas/Dashboard/Relatórios/Projetos · `Cmd/Ctrl+K` paleta ·
na tarefa: `Esc` fecha, `Cmd/Ctrl+Enter` salva · no card do kanban: `Enter` abre, `Alt+←/→` move de coluna.

## Camada de compatibilidade do `index.css` (a remover com revisão visual)
Regras globais com `!important` herdadas do tema claro ainda sobrescrevem classes dos componentes:
`.border`/`.border-t|b|l|r` (força borda branca a 15%), `[class*="bg-white"]`, `[class*="bg-slate-50|100"]`,
`[class*="border-slate-*"]`, `.text-slate-400..900`, `header`, `aside > div` e o estilo global de `input/select/textarea`.
Removê-las muda o visual de todas as telas (bordas ficam mais discretas, `bg-white/5` deixa de ganhar fundo fixo).
Fazer tela por tela, conferindo no navegador.

## Pendências conhecidas
- Cores hex ainda soltas no código (tons de uso único, cores de gráfico e `style={{}}`); migrar conforme as telas forem revisadas.
- Os tokens legados do `:root` em `src/index.css` (`--color-info`, `--bg-*`) ainda herdam nomes do projeto anterior e devem ser removidos quando nada mais os usar.
