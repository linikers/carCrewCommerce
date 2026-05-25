# Plano — Área Administrativa (Admin)

> Sistema de admin para gerenciar produtos, pedidos e usuários do CarCrew Commerce.

---

## Por que separar admin do site principal?

O admin será acessado via `/admin/*` com proteção de rota (middleware).
Usuário comum → `/conta` (dados pessoais, pedidos)
Admin → `/admin` (gerenciar produtos, categorias, pedidos, usuários)

---

## 📋 PRs do Admin

### PR Admin #1 — Login + Cadastro real + Admin setup ✅ (próximo)
- API `/api/auth/register` — salva usuário em `data/usuarios.json`
- API `/api/auth/login` — valida credenciais contra o JSON
- JSON storage em `src/data/usuarios.json`
- Cadastro (`/register`) agora salva de verdade
- Login (`/login`) valida contra o JSON
- Primeiro usuário cadastrado vira admin automático
- Página `/admin/login` — login administrativo
- Rota `/admin` — dashboard básico protegido
- Middleware de proteção de rota admin

### PR Admin #2 — Admin Dashboard
- Cards de estatísticas (total produtos, pedidos, clientes)
- Lista de pedidos recentes
- Gráficos simples (vendas do mês)
- Nav lateral do admin

### PR Admin #3 — CRUD de Produtos
- Listar produtos (tabela com busca)
- Criar produto (formulário)
- Editar produto
- Excluir produto (com confirmação)
- Upload de imagem (placeholder)

### PR Admin #4 — Categorias + Estoque
- CRUD de categorias
- Controle de estoque por produto
- Histórico de alterações

### PR Admin #5 — Pedidos
- Lista de pedidos com status
- Detalhe do pedido
- Atualizar status (pendente, pago, enviado, entregue)
- Notificar cliente via WhatsApp

---

## Estrutura Admin

```
src/
├── app/
│   ├── admin/
│   │   ├── login/page.tsx        ← Login admin
│   │   ├── page.tsx              ← Dashboard
│   │   ├── produtos/
│   │   │   ├── page.tsx          ← Lista produtos
│   │   │   ├── novo/page.tsx     ← Criar produto
│   │   │   └── [id]/edit/page.tsx ← Editar produto
│   │   ├── categorias/page.tsx   ← Gerenciar categorias
│   │   └── pedidos/
│   │       ├── page.tsx          ← Lista pedidos
│   │       └── [id]/page.tsx     ← Detalhe pedido
│   └── api/
│       ├── auth/register/route.ts  ← Registrar
│       └── admin/...
├── components/
│   └── admin/
│       ├── AdminLayout.tsx       ← Layout com sidebar
│       ├── Sidebar.tsx           ← Nav lateral
│       └── StatsCard.tsx         ← Card de estatística
├── data/
│   └── usuarios.json             ← Banco JSON de usuários
└── middleware.ts                 ← Proteção de rotas admin
```
