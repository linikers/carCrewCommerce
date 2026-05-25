---
version: alpha
name: CarCrew Suspensões
description: Loja de peças para suspensão automotiva. Visual profissional, mecânico, com personalidade laranja e preto.
colors:
  primary: "#E65100"
  secondary: "#1A1A1A"
  tertiary: "#333333"
  neutral: "#FAFAFA"
  surface: "#ffffff"
  text: "#1A1A1A"
  textSecondary: "#555555"
  error: "#d32f2f"
  success: "#2e7d32"
  whatsapp: "#25D366"
typography:
  h1:
    fontFamily: Geist
    fontSize: 2.5rem
    fontWeight: 700
    lineHeight: 1.1
  h2:
    fontFamily: Geist
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.15
  h3:
    fontFamily: Geist
    fontSize: 1.5rem
    fontWeight: 600
  body:
    fontFamily: Geist Sans
    fontSize: 1rem
    lineHeight: 1.5
  body-small:
    fontFamily: Geist Sans
    fontSize: 0.875rem
    lineHeight: 1.4
  price:
    fontFamily: Geist Mono
    fontSize: 1.25rem
    fontWeight: 700
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: 12px
    fontWeight: 600
  button-primary-hover:
    backgroundColor: "#BF360C"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: 12px
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: 12px
  button-whatsapp:
    backgroundColor: "{colors.whatsapp}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: 12px
  card-product:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    shadow: "0 2px 8px rgba(0,0,0,0.08)"
    padding: 16px
  header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    shadow: "0 1px 4px rgba(0,0,0,0.1)"
---

## Overview

### Brand & Style

**CarCrew Suspensões** é uma loja de peças para suspensão automotiva. O design deve transmitir **confiança, profissionalismo e solidez** — características essenciais para o público de oficinas mecânicas e entusiastas automotivos.

O visual é limpo e direto, com hierarquia clara de informações. Laranja (#E65100) como cor principal — remete a energia, velocidade e robustez mecânica. Preto (#1A1A1A) para contraste e sofisticação.

### Voice & Tone

- **Direto e profissional:** sem enrolação, o cliente quer saber preço e disponibilidade
- **Confiança:** passar segurança na qualidade das peças
- **Brasileiro:** linguagem natural, "frete grátis", "12x sem juros", "parcele no cartão"
- **Acessível:** sem jargão técnico desnecessário, mas preciso quando necessário

### Audience

- Mecânicos e donos de oficinas
- Entusiastas de suspensão automotiva (air lift, rebaixamento)
- Clientes finais que precisam de peças de reposição

## Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#E65100` | Headers, buttons, links, CTAs — a cor da marca |
| `secondary` | `#1A1A1A` | Texto principal, elementos escuros, footer |
| `tertiary` | `#333333` | Subtítulos, áreas secundárias |
| `neutral` | `#FAFAFA` | Fundo da página |
| `surface` | `#ffffff` | Cards, modais, formulários |
| `text` | `#1A1A1A` | Títulos e texto principal |
| `textSecondary` | `#555555` | Descrições, labels |
| `whatsapp` | `#25D366` | Botão de WhatsApp (verde característico) |

## Typography

- **Headings:** Geist (variável `--font-geist-sans`), pesos 600–700
- **Body:** Geist Sans, peso 400
- **Prices/Mono:** Geist Mono (variável `--font-geist-mono`), peso 700 para valores

### Scale

| Level | Size | Weight | Line Height |
|-------|------|--------|-------------|
| h1 | 2.5rem | 700 | 1.1 |
| h2 | 2rem | 700 | 1.15 |
| h3 | 1.5rem | 600 | 1.2 |
| h4 | 1.25rem | 600 | 1.25 |
| body | 1rem | 400 | 1.5 |
| body-small | 0.875rem | 400 | 1.4 |
| price | 1.25rem | 700 | 1.2 |

## Layout & Spacing

- **Max content width:** 1200px
- **Grid:** 12 colunas, gutter 24px (MUI Grid)
- **Section spacing:** 48px (xxl) entre seções, 24px (lg) entre componentes
- **Responsive breakpoints:** xs (0), sm (600px), md (900px), lg (1200px), xl (1536px)
- **Mobile:** padding lateral de 16px

## Shapes

| Token | Value | Usage |
|-------|-------|-------|
| `rounded.sm` | 4px | Badges, chips |
| `rounded.md` | 8px | Buttons, inputs |
| `rounded.lg` | 12px | Product cards, modals |
| `rounded.xl` | 16px | Special containers |

## Components

### Button Primary
- Fundo `#E65100` (laranja), texto branco, border-radius 8px
- Hover: fundo `#BF360C` (laranja escuro)
- Usado para: "Comprar", "Finalizar Compra", "Adicionar ao Carrinho"

### Button Secondary
- Fundo `#1A1A1A` (preto), texto branco
- Usado para: "Ver mais", "Continuar comprando", CTAs secundários

### Button WhatsApp
- Fundo `#25D366`, texto branco
- Usado para: "Dúvidas? Fale no WhatsApp" — presente em cada produto

### Product Card
- Card branco, border-radius 12px, sombra suave
- Imagem do produto no topo (aspect ratio 1:1 ou 4:3)
- Nome do produto (h3), descrição curta (body-small)
- Preço em destaque (price, Geist Mono)
- Parcelamento: "ou 12x de R$ XX,XX"
- Seletor de quantidade + botão Comprar + link WhatsApp

### Header
- Fundo branco, sombra sutil
- Logo à esquerda
- Busca no centro
- Ícone de conta + carrinho à direita
- Nav de categorias abaixo
- Detalhes laranja nos elementos interativos

### Footer
- Fundo `#1A1A1A` (preto), texto branco
- Informações da loja, links, redes sociais
- Selos de segurança e formas de pagamento

## Anti-References (what NOT to do)

- Gradientes chamativos ou neon
- Glassmorphism
- Animações pesadas que atrapalham a navegação
- Tipografia decorativa para preços
- Cores vibrantes demais para CTAs principais
