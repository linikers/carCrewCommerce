# CarCrewCommerce — Plano de Desenvolvimento

> **Loja de peças para suspensão automotiva** (Next.js 16 + Tailwind v4 + MUI + PWA)
> Referência visual: a10parts.com.br

---

## 📁 Estrutura do Projeto

**Problema atual:** O Next.js está em `carcrewloja/` (npm) e os deps MUI/Serwist estão na raiz (yarn).

**Solução proposta:** Mover tudo pra raiz, padronizar yarn:

```
/carCrewCommerce
├── DESIGN.md              ← Design tokens (Impeccable style)
├── .env.example           ← Variáveis de ambiente
├── .gitignore
├── package.json           ← Unificado (next + mui + serwist)
├── yarn.lock
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── tailwind.config.ts
├── public/
│   ├── images/
│   │   ├── logo.png
│   │   └── produtos/
│   └── icons/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           ← Home
│   │   ├── globals.css
│   │   ├── produtos/
│   │   │   └── [id]/
│   │   │       └── page.tsx   ← Detalhe do produto
│   │   ├── carrinho/
│   │   │   └── page.tsx       ← Checkout
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── ml/            ← Mercado Livre
│   │   │   └── pagamento/
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── Cart.tsx
│   │   └── CartDrawer.tsx
│   ├── lib/
│   │   ├── produtos.ts        ← Dados dos produtos
│   │   ├── api.ts             ← Helpers de API
│   │   ├── utils.ts
│   │   └── ml.ts              ← Integração Mercado Livre
│   ├── hooks/
│   │   ├── useCart.ts
│   │   └── useProdutos.ts
│   └── types/
│       └── index.ts
└── .vercel/
```

---

## 🧱 FASES / PRs

### PR #1 — Setup + DESIGN.md ✅ (primeiro a ser criado)
- Restruturar: mover Next.js pra raiz, unificar package.json
- Instalar dependências (yarn)
- Criar `DESIGN.md` com tokens de design
- Criar `.env.example`
- Configurar `next.config.ts`, PWA (Serwist)
- Configurar ESLint, TypeScript paths

### PR #2 — Layout Base (Header + Footer + PWA)
- Header: logo, busca, categorias, carrinho, conta
- Footer: informações, redes sociais, WhatsApp
- PWA manifest + service worker
- Responsivo mobile
- Tema MUI + Tailwind integrados

### PR #3 — Catálogo de Produtos
- Dados dos produtos (JSON estático inicial)
- Grid de produtos com imagens
- Página de detalhe do produto `/[id]`
- Busca por nome
- Filtro por categoria
- Paginação

### PR #4 — Carrinho
- Carrinho com localStorage
- Sidebar/carrinho lateral (slide-out)
- Adicionar/remover/quantidade
- Cálculo de total + parcelamento
- Carrinho vazio

### PR #5 — Checkout + Pagamento
- Formulário de dados do cliente
- Integração PIX (qrcode-pix)
- Modal de QR Code
- Tela de confirmação/sucesso
- Cálculo de frete (CEP)

### PR #6 — Autenticação
- Login/cadastro
- NextAuth com Google
- Proteção de rotas
- Perfil do usuário

### PR #7 — Mercado Livre
- OAuth callback
- Sincronizar produtos do ML
- Webhooks de pedido
- Atualizar estoque

### PR #8 — Deploy + Ajustes Finais
- Deploy Vercel
- Domínio customizado
- SEO (meta tags, sitemap)
- Analytics
- Testes finais

---

## 🎨 DESIGN.md (Impeccable Style)

Vou criar com base no **popular-web-designs** + referência a10parts:

| Propriedade | Sugestão |
|-------------|----------|
| **Marca** | CarCrew Suspensões |
| **Cores** | Azul escuro `#164773` (primary), Cinza `#e8e8e8` (bg), Verde/limão pra CTAs |
| **Tipografia** | Inter (headings), Geist Sans (body), monospace pra preços |
| **Tom** | Mecânico, profissional, direto — público de oficinas |
| **Componentes** | Card de produto, botão "Comprar", badge de desconto, seletor de qtd |

---

## ⚠️ Questões pra decidir

1. **Estrutura:** movo `carcrewloja/` pra raiz ou mantém subdiretório?
2. **UI Framework:** MUI + Tailwind juntos ou só Tailwind?
3. **Produtos:** dados estáticos primeiro ou já puxar da API do ML?
4. **Carrinho:** sidebar (como a10parts) ou página separada?
5. **Parcelamento:** calcular com juros fixo ou API de gateway?
