# CarCrew Commerce — Roadmap de Funcionalidades Futuras

> Funcionalidades planejadas mas ainda não implementadas.

---

## 🛠 Melhorias no Admin

### Admin #2 — Dashboard Aprimorado
- [ ] Stats com números reais (contar produtos do JSON, pedidos, etc.)
- [ ] Gráficos de vendas do mês (chart.js ou recharts)
- [ ] Nav lateral do admin ✅ (já feito neste PR)
- [ ] Lista de pedidos recentes no dashboard

### Admin #5 — Pedidos
- [ ] Página `/admin/pedidos` — listar pedidos com status
- [ ] Detalhe do pedido `/admin/pedidos/[id]`
- [ ] Atualizar status (pendente → pago → enviado → entregue)
- [ ] Notificar cliente via WhatsApp ao mudar status

---

## 🌐 Mercado Livre

### PR #7 — Integração Mercado Livre
- [ ] OAuth callback `/api/ml/callback`
- [ ] Sincronizar produtos do ML pro site
- [ ] Webhooks de pedido do ML
- [ ] Atualizar estoque automaticamente
- [ ] Preços sync

---

## 🚀 Deploy

### PR #8 — Deploy + Finalização
- [ ] Deploy na Vercel
- [ ] Domínio próprio
- [ ] SEO completo (sitemap.xml, meta tags, Open Graph)
- [ ] PWA completo (service worker com Serwist)
- [ ] Analytics (Google Analytics ou similar)

---

## ✨ Funcionalidades Extras

### Checkout
- [ ] Cálculo de frete por CEP (API dos Correios)
- [ ] Upload de imagem nos produtos (admin)
- [ ] Página de "Produto não encontrado" customizada

### Geral
- [ ] Páginas institucionais (Sobre, Política, Trocas)
- [ ] Notificações push (PWA)
- [ ] Modo escuro (dark mode)
- [ ] Testes (Jest + Cypress/Playwright)

---

> 🗓 Última atualização: 25/05/2026
