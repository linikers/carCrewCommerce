# CarCrew Commerce — Roadmap de Funcionalidades Futuras

> Última atualização: 25/05/2026

---

## ✅ Crítica de Design (Impeccable) — Achados

### PR Fix #1 — Nav de categorias funcional
**Problema:** Botões de categoria no header não filtram nem navegam (só decoração).
- [ ] Fazer os botões de categoria no Header filtrar os produtos na home
- [ ] Ou navegar para uma rota `/categoria/[slug]`
- [ ] Destacar categoria ativa na nav

### PR Fix #2 — Feedback ao adicionar ao carrinho
**Problema:** Sem snackbar/toast quando clica "Adicionar ao Carrinho".
- [ ] Adicionar Snackbar do MUI com confirmação
- [ ] Mostrar nome do produto + link "Ver Carrinho"
- [ ] Animação sutil no ícone do carrinho

### PR Fix #3 — Busca por veículo / filtro avançado
**Problema:** Busca só por nome, sem filtro de veículo ou código de peça.
- [ ] Campo de busca por modelo de veículo
- [ ] Filtro por aplicação (marca/modelo/ano)
- [ ] Tags de compatibilidade nos produtos

---

## 🛠 Melhorias no Admin

### Admin #5 — Pedidos
- [ ] Página `/admin/pedidos` — listar pedidos com status
- [ ] Detalhe do pedido `/admin/pedidos/[id]`
- [ ] Atualizar status (pendente → pago → enviado → entregue)
- [ ] Notificar cliente via WhatsApp ao mudar status

---

## 🌐 Mercado Livre

### PR — Integração Mercado Livre
- [ ] OAuth callback `/api/ml/callback`
- [ ] Sincronizar produtos do ML pro site
- [ ] Webhooks de pedido do ML
- [ ] Atualizar estoque automaticamente
- [ ] Preços sync

---

## 🚀 Deploy

### PR — Deploy + Finalização
- [ ] Deploy na Vercel
- [ ] Domínio próprio
- [ ] SEO completo (sitemap.xml, meta tags, Open Graph)
- [ ] PWA completo (service worker com Serwist)
- [ ] Analytics

---

## ✨ Extras

- [ ] Cálculo de frete por CEP (API dos Correios)
- [ ] Páginas institucionais (Sobre, Política, Trocas)
- [ ] Modo escuro (dark mode)
- [ ] Testes (Jest + Cypress/Playwright)
- [ ] Migrar JSON pra PostgreSQL (Vercel Postgres + Prisma)
