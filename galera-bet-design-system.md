# Galera.bet — Design System

> Especificação completa do design system extraído de [galera.bet.br](https://www.galera.bet.br/).
> Use este documento como referência para replicar a identidade visual em qualquer projeto.

---

## Sumário

1. [Cores](#cores)
2. [Tipografia](#tipografia)
3. [Espaçamento](#espacamento)
4. [Border Radius](#border-radius)
5. [Sombras](#sombras)
6. [Botões](#botoes)
7. [Inputs e Formulários](#inputs-e-formularios)
8. [Componentes](#componentes)
9. [Animações](#animacoes)
10. [Breakpoints](#breakpoints)
11. [CSS Variables (Copiar e Colar)](#css-variables)
12. [Design Tokens (JSON)](#design-tokens-json)

---

## Cores

### Backgrounds (do mais escuro ao mais claro)

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| `bg-darkest` | `#000A17` | `rgb(0, 10, 23)` | Header, preloader, fundo mais profundo |
| `bg-canvas` | `#011C39` | `rgb(1, 28, 57)` | Background principal do body |
| `bg-elevated` | `#012C50` | `rgb(1, 44, 80)` | Hover de accordions, elevação sutil |
| `bg-input` | `#06295D` | `rgb(6, 41, 93)` | Campos de input, selects |
| `bg-form` | `#061729` | `rgb(6, 23, 41)` | Formulários alternativos |
| `bg-popup` | `#083476` | `rgb(8, 52, 118)` | Modais e popups |
| `bg-overlay` | `#111C39` | `rgb(17, 28, 57)` | Overlay de modais |
| `bg-table` | `#14344F` | `rgb(20, 52, 79)` | Corpo de tabelas |
| `bg-surface` | `#192B41` | `rgb(25, 43, 65)` | Progress bars, surfaces |
| `bg-cookie` | `#1A3977` | `rgb(26, 57, 119)` | Banners informativos |
| `bg-interactive` | `#204792` | `rgb(32, 71, 146)` | Borders, hovers, tabelas |
| `bg-brand` | `#002266` | `rgb(0, 34, 102)` | Tabs, botões secundários |

### Cores de Ação

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| `success` | `#00A723` | `rgb(0, 167, 35)` | CTA principal, botão "ENTRAR", play |
| `success-alt` | `#00A635` | `rgb(0, 166, 53)` | Botão success alternativo |
| `success-hover` | `#2BB007` | `rgb(43, 176, 7)` | Hover do botão success |
| `success-light` | `#5CBD43` | `rgb(92, 189, 67)` | Bordas de accordions ativos |

### Cores de Destaque (Amarelos)

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| `warning` | `#FFBA00` | `rgb(255, 186, 0)` | Tabs ativas, badge "DESTAQUE" |
| `warning-bright` | `#FFE71E` | `rgb(255, 231, 30)` | Cashier, links de destaque |
| `highlight` | `#EEFF00` | `rgb(238, 255, 0)` | Match de busca |
| `notification` | `#F2FF12` | `rgb(242, 255, 18)` | Banner de login |
| `nav-active` | `#FFCC00` | `rgb(255, 204, 0)` | Menu ativo (desktop) |

### Cores de Informação (Azuis claros)

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| `info` | `#68A6FF` | `rgb(104, 166, 255)` | Links padrão |
| `info-hover` | `#1A8BFF` | `rgb(26, 139, 255)` | Hover de links, "ver tudo" |
| `info-light` | `#469FDE` | `rgb(70, 159, 222)` | Azul constante |
| `info-accent` | `#00A1E4` | `rgb(0, 161, 228)` | Destaque leaderboard |
| `popup-title` | `#0E95CF` | `rgb(14, 149, 207)` | Título de popup |

### Texto

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| `text-primary` | `#FFFFFF` | `rgb(255, 255, 255)` | Todo texto principal |
| `text-muted` | `#AAAAAA` | `rgb(170, 170, 170)` | Placeholders de inputs |
| `text-subtle` | `#B3B3B3` | `rgb(179, 179, 179)` | Placeholder de busca |
| `text-disabled` | `#686868` | `rgb(104, 104, 104)` | Timers, texto inativo |
| `text-dark` | `#000A17` | `rgb(0, 10, 23)` | Texto sobre fundo amarelo |

---

## Tipografia

### Fontes

```css
/* Fonte primária (body, texto geral) */
font-family: "Barlow", sans-serif;

/* Fonte condensada (headings, CTAs, labels, botões) */
font-family: "Barlow Condensed", "Asap", "Helvetica Neue", Helvetica, Arial, sans-serif;
```

**Google Fonts import:**

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@400;500;600;700&display=swap');
```

### Escala de Tamanhos

| Token | Valor | Pixels (base 16px) | Uso |
|-------|-------|---------------------|-----|
| `text-display` | `1.5rem` | 24px | Títulos de seção (EM DESTAQUE, TOP 10) |
| `text-h3` | `1.4rem` | 22.4px | Subtítulos internos |
| `text-label` | `1.2rem` | 19.2px | Labels de formulário |
| `text-input` | `1.1rem` | 17.6px | Texto de inputs |
| `text-body` | `1rem` | 16px | Texto padrão |
| `text-small` | `0.85rem` | 13.6px | Metadados, timestamps |
| `text-caption` | `0.7rem` | 11.2px | Legendas, badges |
| `text-micro` | `0.65rem` | 10.4px | Badge "NOVO" |

### Pesos

| Token | Valor | Uso |
|-------|-------|-----|
| `font-normal` | `400` | Texto corrido |
| `font-medium` | `500` | Inputs, stories labels |
| `font-semibold` | `600` | Nav links (desktop) |
| `font-bold` | `700` | Headings, botões, labels |

### Estilos de Texto Comuns

```css
/* Título de seção */
.heading-section {
  font-family: "Barlow Condensed", sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #FFFFFF;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* Texto de navegação */
.nav-text {
  font-family: "Barlow Condensed", sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #FFFFFF;
  text-transform: uppercase;
}

/* Texto de body */
.body-text {
  font-family: "Barlow", sans-serif;
  font-size: 1rem;
  font-weight: 400;
  color: #FFFFFF;
  line-height: 1.5;
}

/* Label de formulário */
.form-label {
  font-family: "Barlow", sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: #FFFFFF;
}

/* Valor monetário */
.money-value {
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 700;
  color: #00A723;
}
```

---

## Espaçamento

| Token | Valor | Pixels | Uso |
|-------|-------|--------|-----|
| `space-2xs` | `0.25rem` | 4px | Micro gaps |
| `space-xs` | `0.5rem` | 8px | Gap interno mínimo |
| `space-sm` | `0.75rem` | 12px | Padding de linhas de tabela |
| `space-md` | `1rem` | 16px | Padding padrão, gap entre items |
| `space-lg` | `1.25rem` | 20px | Gap de grid de jogos |
| `space-xl` | `1.5rem` | 24px | Margin entre seções |
| `space-2xl` | `2rem` | 32px | Padding lateral de containers |
| `space-3xl` | `3rem` | 48px | Margem grande entre seções |
| `space-4xl` | `4rem` | 64px | Margem de categorias |
| `space-5xl` | `5rem` | 80px | Margem de categorias (desktop) |

### Layout

| Propriedade | Valor |
|-------------|-------|
| Container max-width | `1400px` |
| Grid gap (cards) | `1.25rem` (20px) |
| Header height | `56px` (aprox.) |

---

## Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `radius-xs` | `4px` | Badges |
| `radius-sm` | `5px` | Botões, inputs legados |
| `radius-md` | `8px` (`0.5rem`) | Cards de jogos, inputs |
| `radius-lg` | `10px` | Tabs de categoria, pills |
| `radius-xl` | `12px` | Dropdowns |
| `radius-2xl` | `18px` | Modais, banners |
| `radius-3xl` | `25px` | Painéis de registro |
| `radius-full` | `50%` | Botões circulares, avatares |

---

## Sombras

O design segue uma abordagem **flat/dark** — não utiliza box-shadows para separação de elementos.
A hierarquia visual é criada exclusivamente por **diferença de cores de fundo** e **borders sutis**.

```css
/* Única sombra usada: botão de help flutuante */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

/* Focus states: sombra explicitamente removida */
box-shadow: none;
```

---

## Botões

### Primário (Success / CTA)

```css
.btn-primary {
  background-color: #00A723;
  color: #FFFFFF;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1.5rem;
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 700;
  font-size: 1rem;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}
.btn-primary:hover {
  background-color: #2BB007;
  transform: translateY(-1px);
}
.btn-primary:active {
  background-color: #008A1D;
  transform: translateY(0);
}
```

### Secundário (Outline / Ghost)

```css
.btn-secondary {
  background-color: transparent;
  color: #FFFFFF;
  border: 1px solid #FFFFFF;
  border-radius: 5px;
  padding: 0.5rem 1.5rem;
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 700;
  font-size: 1rem;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.15);
}
.btn-secondary:active {
  background-color: rgba(255, 255, 255, 0.25);
}
```

### Tab / Pill

```css
.btn-tab {
  background: transparent;
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 0.4em 1em;
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  transition: background-color 0.15s ease;
}
.btn-tab:hover {
  background: rgba(255, 255, 255, 0.1);
}
.btn-tab--active {
  background: #002266;
  border-color: #002266;
}
.btn-tab--highlight {
  background: #FFBA00;
  color: #000A17;
  border-color: #FFBA00;
}
```

### Carousel Arrow

```css
.btn-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: transparent;
  color: #FFFFFF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-arrow:hover {
  border-color: #FFFFFF;
  background: rgba(255, 255, 255, 0.1);
}
.btn-arrow--filled {
  background: #1A8BFF;
  border-color: #1A8BFF;
}
```

---

## Inputs e Formulários

### Campo de Texto

```css
.input-field {
  background: #06295D;
  border: none;
  border-radius: 0.5em;
  padding: 1em;
  height: 3.4em;
  font-family: "Barlow", sans-serif;
  font-weight: 500;
  font-size: 1.1rem;
  color: #FFFFFF;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s ease;
}
.input-field::placeholder {
  color: #AAAAAA;
}
.input-field:focus {
  outline: none;
  box-shadow: none;
}
```

### Campo de Busca

```css
.search-field {
  background: #000A17;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  padding: 0.6rem 1rem 0.6rem 2.5rem;
  font-family: "Barlow", sans-serif;
  font-size: 1rem;
  color: #FFFFFF;
  width: 100%;
}
.search-field::placeholder {
  color: #B3B3B3;
}
.search-field:hover {
  border-color: rgba(255, 255, 255, 0.4);
}
.search-field:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
}
```

### Select / Dropdown

```css
.select-field {
  background: #06295D;
  border: none;
  border-radius: 0.5em;
  height: 3.4em;
  padding: 0 1rem;
  font-family: "Barlow", sans-serif;
  font-size: 1.1rem;
  font-weight: 500;
  color: #FFFFFF;
  appearance: none;
  cursor: pointer;
}
```

---

## Componentes

### Header

```css
.header {
  background: #000A17;
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 56px;
}
.header__nav-link {
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: #FFFFFF;
  text-transform: uppercase;
  text-decoration: none;
  padding: 0 0.75rem;
  transition: color 0.15s ease;
}
.header__nav-link:hover {
  color: #1A8BFF;
}
.header__nav-link--active {
  color: #FFCC00;
}
```

### Story Bubble (Destaques Circulares)

```css
.story-bubble {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.story-bubble:hover {
  transform: scale(1.08);
}
.story-bubble__image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid transparent;
  background-image: linear-gradient(#011C39, #011C39),
                    linear-gradient(135deg, #5CBD43, #469FDE);
  background-origin: border-box;
  background-clip: content-box, border-box;
  overflow: hidden;
}
.story-bubble__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.story-bubble__label {
  font-family: "Barlow", sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: #FFFFFF;
  text-align: center;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### Game Card

```css
.game-card {
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.game-card:hover {
  transform: scale(1.05);
}
.game-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.game-card__badge {
  position: absolute;
  top: -2px;
  right: -2px;
  z-index: 2;
}
.game-card__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.game-card:hover .game-card__overlay {
  opacity: 1;
}
.game-card__play-btn {
  background: #00A723;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.5rem;
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.9rem;
  cursor: pointer;
}
.game-card__play-btn:hover {
  background: #2BB007;
}
```

### Section Header

```css
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0;
}
.section-header__title {
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: #FFFFFF;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}
.section-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.section-header__view-all {
  font-family: "Barlow", sans-serif;
  font-size: 0.85rem;
  color: #FFFFFF;
  text-decoration: none;
  transition: color 0.15s ease;
}
.section-header__view-all:hover {
  color: #1A8BFF;
}
```

### Winners Table Row

```css
.winners-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #204792;
  color: #FFFFFF;
  transition: background-color 0.15s ease;
}
.winners-row:hover {
  background: #204792;
}
.winners-row__game-image {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
}
.winners-row__player {
  font-family: "Barlow", sans-serif;
  font-size: 0.85rem;
  color: #FFFFFF;
}
.winners-row__game-name {
  font-family: "Barlow", sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: #FFFFFF;
}
.winners-row__amount {
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 700;
  color: #00A723;
  font-size: 1rem;
}
.winners-row__time {
  font-family: "Barlow", sans-serif;
  font-size: 0.75rem;
  color: #B3B3B3;
}
```

### Floating Help Button

```css
.help-fab {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #1A8BFF;
  color: #FFFFFF;
  font-size: 1.5rem;
  font-weight: 700;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background-color 0.15s ease;
}
.help-fab:hover {
  transform: scale(1.1);
  background: #1478E0;
}
```

### Links

```css
a {
  color: #68A6FF;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.15s ease;
}
a:hover {
  color: #00A723;
}
.active a, a:active {
  color: #00A723;
}
```

---

## Animações

### Keyframes disponíveis

```css
/* Bounce de entrada */
@keyframes bounceIn {
  0%   { opacity: 0; transform: scale3d(0.3, 0.3, 0.3); }
  20%  { transform: scale3d(1.4, 1.4, 1.4); }
  40%  { transform: scale3d(0.7, 0.7, 0.7); }
  60%  { opacity: 1; transform: scale3d(1.1, 1.1, 1.1); }
  80%  { transform: scale3d(0.95, 0.95, 0.95); }
  100% { opacity: 1; transform: scale3d(1, 1, 1); }
}

/* Slide de cima para baixo */
@keyframes slideInDown {
  0%   { opacity: 0; transform: translate3d(0, -12px, 0); }
  100% { opacity: 1; transform: none; }
}

/* Barras de progresso listradas */
@keyframes progressStripes {
  0%   { background-position: 3em 0; }
  100% { background-position: 0 0; }
}

/* Loading dots (stretch) */
@keyframes stretchDelay {
  0%, 40%, 100% { transform: scaleY(0.4); }
  20%           { transform: scaleY(1); }
}

/* Loading bar indeterminado */
@keyframes indeterminate {
  0%        { left: -35%; right: 100%; }
  60%, 100% { left: 100%; right: -90%; }
}
```

### Transições padrão

```css
/* Card hover (scale) */
transition: transform 0.2s ease;
transform: scale(1.05);

/* Botão hover (lift) */
transition: background-color 0.2s ease, transform 0.1s ease;
transform: translateY(-1px);

/* Cor de links/botões */
transition: color 0.15s ease;
transition: background-color 0.15s ease;

/* Opacidade (overlays) */
transition: opacity 0.2s ease;
```

---

## Breakpoints

| Dispositivo | Classe | Largura |
|-------------|--------|---------|
| Mobile | `.mobile` | < 768px |
| Tablet | `.tablet` | 768px — 1023px |
| Desktop | `.desktop` | ≥ 1024px |

> **Nota:** O site original usa detecção por User Agent, não media queries.
> Para replicar, recomenda-se usar media queries:

```css
/* Mobile */
@media (max-width: 767px) { }

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) { }

/* Desktop */
@media (min-width: 1024px) { }
```

---

## CSS Variables

> Copie e cole este bloco no `:root` do seu projeto:

```css
:root {
  /* ═══════════════════════════════════════════
     GALERA.BET DESIGN TOKENS
     ═══════════════════════════════════════════ */

  /* ── Fonts ── */
  --font-primary: "Barlow", sans-serif;
  --font-condensed: "Barlow Condensed", "Asap", "Helvetica Neue", Helvetica, Arial, sans-serif;

  /* ── Font Sizes ── */
  --text-display: 1.5rem;
  --text-h3: 1.4rem;
  --text-label: 1.2rem;
  --text-input: 1.1rem;
  --text-body: 1rem;
  --text-small: 0.85rem;
  --text-caption: 0.7rem;
  --text-micro: 0.65rem;

  /* ── Font Weights ── */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* ── Colors: Backgrounds ── */
  --bg-darkest: #000A17;
  --bg-canvas: #011C39;
  --bg-elevated: #012C50;
  --bg-input: #06295D;
  --bg-form: #061729;
  --bg-popup: #083476;
  --bg-overlay: #111C39;
  --bg-table: #14344F;
  --bg-surface: #192B41;
  --bg-cookie: #1A3977;
  --bg-interactive: #204792;
  --bg-brand: #002266;

  /* ── Colors: Actions ── */
  --color-success: #00A723;
  --color-success-alt: #00A635;
  --color-success-hover: #2BB007;
  --color-success-light: #5CBD43;

  /* ── Colors: Warning / Highlight ── */
  --color-warning: #FFBA00;
  --color-warning-bright: #FFE71E;
  --color-highlight: #EEFF00;
  --color-notification: #F2FF12;
  --color-nav-active: #FFCC00;

  /* ── Colors: Info ── */
  --color-info: #68A6FF;
  --color-info-hover: #1A8BFF;
  --color-info-light: #469FDE;
  --color-info-accent: #00A1E4;
  --color-popup-title: #0E95CF;

  /* ── Colors: Text ── */
  --text-primary: #FFFFFF;
  --text-muted: #AAAAAA;
  --text-subtle: #B3B3B3;
  --text-disabled: #686868;
  --text-dark: #000A17;

  /* ── Spacing ── */
  --space-2xs: 0.25rem;
  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.25rem;
  --space-xl: 1.5rem;
  --space-2xl: 2rem;
  --space-3xl: 3rem;
  --space-4xl: 4rem;
  --space-5xl: 5rem;

  /* ── Border Radius ── */
  --radius-xs: 4px;
  --radius-sm: 5px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 12px;
  --radius-2xl: 18px;
  --radius-3xl: 25px;
  --radius-full: 50%;

  /* ── Layout ── */
  --container-max-width: 1400px;
  --header-height: 56px;
  --grid-gap: 1.25rem;

  /* ── Shadows ── */
  --shadow-fab: 0 2px 8px rgba(0, 0, 0, 0.3);

  /* ── Transitions ── */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.2s ease;
  --transition-slow: 0.3s ease;
}
```

---

## Design Tokens (JSON)

> Para uso em ferramentas de design (Figma Tokens, Style Dictionary, etc.):

```json
{
  "galera-bet": {
    "color": {
      "bg": {
        "darkest":     { "value": "#000A17" },
        "canvas":      { "value": "#011C39" },
        "elevated":    { "value": "#012C50" },
        "input":       { "value": "#06295D" },
        "form":        { "value": "#061729" },
        "popup":       { "value": "#083476" },
        "overlay":     { "value": "#111C39" },
        "table":       { "value": "#14344F" },
        "surface":     { "value": "#192B41" },
        "cookie":      { "value": "#1A3977" },
        "interactive": { "value": "#204792" },
        "brand":       { "value": "#002266" }
      },
      "action": {
        "success":       { "value": "#00A723" },
        "success-alt":   { "value": "#00A635" },
        "success-hover": { "value": "#2BB007" },
        "success-light": { "value": "#5CBD43" }
      },
      "warning": {
        "default":  { "value": "#FFBA00" },
        "bright":   { "value": "#FFE71E" },
        "highlight":{ "value": "#EEFF00" },
        "notify":   { "value": "#F2FF12" },
        "nav":      { "value": "#FFCC00" }
      },
      "info": {
        "default": { "value": "#68A6FF" },
        "hover":   { "value": "#1A8BFF" },
        "light":   { "value": "#469FDE" },
        "accent":  { "value": "#00A1E4" }
      },
      "text": {
        "primary":  { "value": "#FFFFFF" },
        "muted":    { "value": "#AAAAAA" },
        "subtle":   { "value": "#B3B3B3" },
        "disabled": { "value": "#686868" },
        "dark":     { "value": "#000A17" }
      }
    },
    "font": {
      "family": {
        "primary":   { "value": "Barlow, sans-serif" },
        "condensed": { "value": "Barlow Condensed, Asap, Helvetica Neue, Helvetica, Arial, sans-serif" }
      },
      "size": {
        "display": { "value": "1.5rem" },
        "h3":      { "value": "1.4rem" },
        "label":   { "value": "1.2rem" },
        "input":   { "value": "1.1rem" },
        "body":    { "value": "1rem" },
        "small":   { "value": "0.85rem" },
        "caption": { "value": "0.7rem" },
        "micro":   { "value": "0.65rem" }
      },
      "weight": {
        "normal":   { "value": "400" },
        "medium":   { "value": "500" },
        "semibold": { "value": "600" },
        "bold":     { "value": "700" }
      }
    },
    "spacing": {
      "2xs": { "value": "0.25rem" },
      "xs":  { "value": "0.5rem" },
      "sm":  { "value": "0.75rem" },
      "md":  { "value": "1rem" },
      "lg":  { "value": "1.25rem" },
      "xl":  { "value": "1.5rem" },
      "2xl": { "value": "2rem" },
      "3xl": { "value": "3rem" },
      "4xl": { "value": "4rem" },
      "5xl": { "value": "5rem" }
    },
    "radius": {
      "xs":   { "value": "4px" },
      "sm":   { "value": "5px" },
      "md":   { "value": "8px" },
      "lg":   { "value": "10px" },
      "xl":   { "value": "12px" },
      "2xl":  { "value": "18px" },
      "3xl":  { "value": "25px" },
      "full": { "value": "50%" }
    },
    "breakpoint": {
      "mobile":  { "value": "767px" },
      "tablet":  { "value": "1023px" },
      "desktop": { "value": "1024px" }
    },
    "layout": {
      "container-max":  { "value": "1400px" },
      "header-height":  { "value": "56px" },
      "grid-gap":       { "value": "1.25rem" }
    }
  }
}
```

---

## Quick Start

Para usar este design system em um novo projeto, siga estes passos:

### 1. Importar as fontes

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 2. Copiar as CSS Variables

Copie o bloco `:root` da seção [CSS Variables](#css-variables) para o seu `styles.css` ou `index.css`.

### 3. Aplicar o reset base

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-primary);
  font-size: var(--text-body);
  font-weight: var(--font-normal);
  color: var(--text-primary);
  background-color: var(--bg-canvas);
  line-height: 1.5;
  min-height: 100vh;
}
```

### 4. Usar os componentes

Copie os CSS dos componentes da seção [Componentes](#componentes) conforme necessidade.

---

> **Gerado em:** 21/08/2026
> **Fonte:** https://www.galera.bet.br/
> **Versão:** 1.0
