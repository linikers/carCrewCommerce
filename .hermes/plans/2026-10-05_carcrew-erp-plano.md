# CarCrew — Transformação de E-commerce em ERP

> **Execução:** rollout por PRs (cada PR = 1 entregável). Execução via skill `subagent-driven-development`.
> **Fonte de verdade do código:** `github.com/linikers/carCrewCommerce` (⚠️ `origin/main` = `594675ee` está à frente do clone local em `/root/carCrewCommerce`, que está em `43a40066`).

**Goal:** evoluir o CarCrew Commerce (hoje um e-commerce de vitrine/checkout) para um ERP operacional que cubra cliente, estoque, compras, financeiro, ordem de serviço e emissão de NF-e/NFS-e.

**Arquitetura:** estender o schema Prisma e as rotas existentes — não reescrever. O app Next.js passa a ser o front do ERP; a emissão fiscal é delegada ao serviço `nfe-brasil` (consulta/validação/DANFE já prontos), que precisa ganhar a perna de geração+assinatura+transmissão.

**Tech Stack:** Next.js 16 (App Router) · Prisma 7 + PostgreSQL · MUI 9 · NextAuth v4 · `nfe-brasil` (Python/MCP, `/opt/nfe-brasil`) para fiscal.

---

## 1. Estado atual (o que existe de verdade)

| Área | Estado | Observação |
|---|---|---|
| Catálogo / SEO / landings | 🟢 funciona | 48 produtos em `src/data/produtos.json`, 12 categorias |
| Carrinho | 🟢 funciona | Context + localStorage |
| Checkout | 🟢 funciona | `POST /api/pedidos/criar` valida estoque e grava pedido |
| Pagamento | 🔴 estático | `qrcode-pix` gera QR de payload fixo; sem confirmar pagamento |
| Frete | 🔴 mock | rota devolve "Correios" com valor estimado; sem API real |
| Auth | 🟡 frágil | senha em texto puro; secret com default hardcoded |
| Admin | 🟢 CRUD | produtos/banners/categorias/pagamentos/frete/GA4 |
| Dashboard stats | 🔴 mock | `vendasPorMes` = `Math.random()` |
| Mercado Livre | 🔴 fora do app | só scripts Python soltos em `scripts/` |

**Limitações estruturais (`prisma/schema.prisma`):** `Pedido` só tem `items Json/status/total`, com `userId` gravado como `"guest"` hardcoded e **sem endereço**; `User` sem CPF/CNPJ/telefone/endereço; `Produto` sem custo/NCM/CFOP. Não existe nada de estoque (movimento), compras, financeiro, fiscal ou OS.

## 2. Arquitetura-alvo

```
CarCrew (Next.js)                         nfe-brasil (Python/MCP)
├── ERP core                              ├── [pronto] consultar_nfe
│   ├── Cliente + Endereço                ├── [pronto] validar_chave_nfe
│   ├── Pedido + PedidoItem               ├── [pronto] validar_assinatura (XMLDSig)
│   ├── Estoque (MovimentoEstoque)        ├── [pronto] parse XML / DANFE
│   ├── Compras + Fornecedor              ├── [pronto] status SEFAZ / distribuição mTLS
│   ├── Financeiro (pagar/receber)        ├── [FALTA] gerador de XML NF-e  (issue #3)
│   └── Ordem de Serviço                  ├── [FALTA] assinar + transmitir  (issue #1)
└── Módulo fiscal  ──HTTP/MCP────────────▶└── [FALTA] módulo tributário IBS/CBS (#5)
```

**Decisão:** a lógica fiscal (XML, tributos, SEFAZ) fica **no `nfe-brasil`**; o CarCrew só monta o payload da nota e recebe de volta XML autorizado + DANFE. Isso evita reimplementar regra fiscal dentro do Next e reaproveita o que já existe (validação, DANFE, mTLS, status).

---

## 3. Fases / PRs — classificação por prioridade

| Fase | PR | Tópico | Prioridade | Depende de |
|---|---|---|---|---|
| 1 | PR-1 | Cliente completo (CPF/CNPJ, endereços) | 🔴 P0 | — |
| 1 | PR-2 | Pedido relacional (PedidoItem, endereço, histórico) | 🔴 P0 | PR-1 |
| 1 | PR-3 | Estoque real (MovimentoEstoque + custo) | 🔴 P0 | — |
| 2 | PR-4 | Pagamento real (gateway + webhook) | 🟠 P1 | PR-2 |
| 2 | PR-5 | Frete real (Melhor Envio) | 🟠 P1 | PR-1, PR-2 |
| 3 | PR-6 | Compras + Fornecedores | 🟡 P2 | PR-3 |
| 3 | PR-7 | Financeiro (a pagar/receber, fluxo de caixa) | 🟡 P2 | PR-2, PR-6 |
| 4 | PR-8 | Cadastro fiscal + campos fiscais no Produto | 🟠 P1 | PR-1 |
| 4 | PR-9 | Emissão de NF-e via nfe-brasil | 🟠 P1 | PR-8, PR-2, PR-3 |
| 5 | PR-10 | Ordem de Serviço | 🟡 P2 | PR-1, PR-2, PR-3, PR-8 |

> P0 destrava tudo. Sem cliente + pedido relacional + estoque, nem NF-e nem OS fecham.

---

## 4. Detalhamento por fase

### PR-1 — Cliente completo 🔴
**Modelos novos/alterados (`prisma/schema.prisma`):**
```prisma
model User {
  // ...existentes
  tipoPessoa   String   @default("PF") @map("tipo_pessoa") // PF | PJ
  cpfCnpj      String?  @unique @map("cpf_cnpj")
  inscricaoEst String?  @map("inscricao_estadual")
  telefone     String?
  enderecos    Endereco[]
}

model Endereco {
  id        Int     @id @default(autoincrement())
  userId    String  @map("user_id")
  apelido   String? // "Casa", "Oficina"
  cep       String
  logradouro String
  numero    String
  complemento String?
  bairro    String
  cidade    String
  uf        String
  principal Boolean @default(false)
  user      User @relation(fields: [userId], references: [id])
  @@map("enderecos")
}
```
**Arquivos:** `prisma/schema.prisma`, migration nova; `src/app/conta/page.tsx` (abrir aba "Meus dados"); `src/app/api/conta/perfil/route.ts` (novo); `src/app/api/conta/enderecos/route.ts` + `[id]/route.ts` (novos).
**Validação:** CPF/CNPJ com dígito verificador (lib `cpf-cnpj-validator`); CEP via ViaCEP (o `nfe-brasil` também expõe `cep`).
**Teste:** criar cliente PF e PJ, validar rejeição de documento inválido, CRUD de endereço.

### PR-2 — Pedido relacional 🔴
**Motivo:** hoje o pedido é uma foto JSON sem destinatário — NF-e e OS não têm como existir.
```prisma
model Pedido {
  // ...existentes
  clienteId   String?   @map("cliente_id")   // substitui userId: "guest"
  enderecoEntrega Json? @map("endereco_entrega")
  freteValor  Float?    @map("frete_valor")
  freteServico String?  @map("frete_servico")
  itens       PedidoItem[]
  historico   PedidoStatusHistorico[]
}

model PedidoItem {
  id         Int    @id @default(autoincrement())
  pedidoId   String @map("pedido_id")
  produtoId  Int    @map("produto_id")
  nome       String
  preco      Float
  quantidade Int
  pedido     Pedido @relation(fields: [pedidoId], references: [id], onDelete: Cascade)
  @@map("pedido_itens")
}

model PedidoStatusHistorico {
  id        Int      @id @default(autoincrement())
  pedidoId  String   @map("pedido_id")
  status    String   // pendente|pago|em_separacao|enviado|entregue|cancelado
  observacao String?
  autor     String?
  criadoEm  DateTime @default(now()) @map("criado_em")
  @@map("pedido_status_historico")
}
```
**Arquivos:** `prisma/schema.prisma`; `src/app/api/pedidos/criar/route.ts` (gravar itens relacionais + endereço, tirar `"guest"`); `src/app/api/admin/pedidos/[id]/route.ts` (remover o fallback mock e usar transição real de status).
**Teste:** criar pedido com 2 itens, transicionar status, ler histórico.

### PR-3 — Estoque real 🔴
```prisma
model MovimentoEstoque {
  id         Int      @id @default(autoincrement())
  produtoId  Int      @map("produto_id")
  tipo       String   // entrada|saida|ajuste|venda|devolucao
  quantidade Int
  custoUnit  Float?   @map("custo_unit") // para custo médio
  origem     String?  // "pedido:xxx", "compra:yyy", "ajuste manual"
  observacao String?
  criadoEm   DateTime @default(now()) @map("criado_em")
  @@map("movimentos_estoque")
}
```
`Produto` ganha `custo Float?` e `estoqueMinimo Int @default(0)`. O decremento em `pedidos/criar` passa a **criar um MovimentoEstoque** (transação) em vez de só `decrement`. Custo médio ponderado recalculado a cada entrada.
**Arquivos:** `prisma/schema.prisma`; `src/app/api/pedidos/criar/route.ts`; `src/app/api/admin/estoque/route.ts` (novo, movimentação manual); `src/app/admin/estoque/page.tsx` (novo); `src/lib/estoque.ts` (novo).
**Teste:** venda baixa estoque e cria movimento; entrada recalcula custo médio; alerta de estoque mínimo.

### PR-4 — Pagamento real 🟠
Trocar o PIX estático por gateway (recomendo **Asaas** — PIX + boleto + cartão num só, webhook simples). Criar `POST /api/webhooks/asaas` que confirma o pedido e dispara baixa de estoque. **Arquivos:** `src/app/api/pix/route.ts` (passa a cobrar no gateway), `src/app/api/webhooks/asaas/route.ts` (novo), `src/app/api/admin/pagamentos/route.ts` (chaves/credenciais criptografadas, não em JSON).

### PR-5 — Frete real 🟠
Integrar **Melhor Envio**. Substituir o mock de `src/app/api/frete/route.ts`. Já existem peso/dimensões no Produto (migração `20260701_add_produtos_medidas`).

### PR-6 — Compras + Fornecedores 🟡
```prisma
model Fornecedor { id / razaoSocial / cnpj @unique / contato / prazoMedio }
model Compra { id / fornecedorId / status / total / itens CompraItem[] / criadoEm }
model CompraItem { id / compraId / produtoId / quantidade / custoUnit }
```
Receber compra → gera `MovimentoEstoque` de entrada + `ContaPagar`.

### PR-7 — Financeiro 🟡
```prisma
model ContaPagar { id / descricao / valor / vencimento / pagoEm / origem }
model ContaReceber { id / pedidoId? / descricao / valor / vencimento / recebidoEm }
```
Telas `admin/financeiro/{a-pagar,a-receber,fluxo-caixa}`. Fluxo de caixa e DRE simples por período.

### PR-8 — Cadastro fiscal + campos no Produto 🟠
```prisma
model EmpresaFiscal {
  id / cnpj / razaoSocial / nomeFantasia / inscricaoEst / inscricaoMun
  crt Int  // 1=Simples, 2=Simples excesso, 3=Normal
  cnae String / endereco Json / certificadoPath String? / ambienteFiscal String @default("homologacao")
}
```
`Produto` ganha `ncm String?`, `cest String?`, `cfop String?`, `origem Int @default(0)`, `cstIcms String?`, `unidade String @default("UN")`, `codigoInterno String?`. Tela `admin/fiscal/empresa` + edição fiscal no produto. **Certificado A1 (.pfx) nunca no repo** — guardar caminho/segredo, não o arquivo.

### PR-9 — Emissão de NF-e via nfe-brasil 🟠
**Pré-requisito:** o `nfe-brasil` precisa das issues #1 e #3 dele (geração XML + assinatura + transmissão). Enquanto isso não existe, o CarCrew prepara tudo e emite em **homologação**.
```prisma
model NotaFiscal {
  id           Int    @id @default(autoincrement())
  pedidoId     String? @map("pedido_id")
  tipo         String  // nfe | nfse
  numero       Int?
  serie        String?
  chaveAcesso  String? @unique @map("chave_acesso")
  status       String  // rascunho|enviada|autorizada|rejeitada|cancelada
  ambiente     String  // homologacao|producao
  xmlUrl       String? @map("xml_url")
  danfeUrl     String? @map("danfe_url")
  motivoRejeicao String? @map("motivo_rejeicao")
  criadoEm     DateTime @default(now()) @map("criado_em")
  @@map("notas_fiscais")
}
```
**Fluxo:** pedido `pago` → botão "Emitir NF-e" no detalhe do pedido → CarCrew monta payload (emitente de `EmpresaFiscal`, destinatário do `Cliente`, itens com NCM/CFOP) → POST para o serviço `nfe-brasil` → recebe XML autorizado (cStat=100) → salva chave/XML/DANFE → anexa no pedido → notifica cliente.
**Arquivos:** `src/lib/fiscal/nfe-client.ts` (novo), `src/app/api/admin/pedidos/[id]/emitir-nfe/route.ts` (novo), `src/app/api/admin/fiscal/notas/route.ts` + `[id]/route.ts` (novos), `src/app/admin/fiscal/notas/page.tsx` (novo).
**Teste:** emitir em homologação, validar `tpAmb=2` e "HOMOLOGAÇÃO SEM VALOR FISCAL" no DANFE; tratar rejeição (2xx) exibindo `xMotivo`.

### PR-10 — Ordem de Serviço 🟡 (detalhado na seção 5)

---

## 5. Ordem de Serviço — o que precisa ser feito

O CarCrew é oficina/suspensão: além de vender peça, executa serviço. Isso exige um módulo que **não existe hoje em lugar nenhum**. Ponto central: a OS amarra cliente → veículo → peças (baixa estoque) → mão de obra (NFS-e) → financeiro.

### 5.1 Modelos de dados

```prisma
model Veiculo {
  id          Int     @id @default(autoincrement())
  clienteId   String  @map("cliente_id")
  marca       String
  modelo      String
  ano         Int
  placa       String? @unique
  chassi      String?
  observacoes String?
  os          OrdemServico[]
  @@map("veiculos")
}

model OrdemServico {
  id             Int      @id @default(autoincrement())
  numero         Int      @unique @default(autoincrement())
  clienteId      String   @map("cliente_id")
  veiculoId      Int      @map("veiculo_id")
  status         String   @default("aberta")
  // aberta|diagnostico|orcamento|aprovada|em_execucao|finalizada|faturada|entregue|cancelada
  descricaoProblema String? @map("descricao_problema")
  diagnostico    String?
  kmEntrada      Int?     @map("km_entrada")
  previsaoEntrega DateTime? @map("previsao_entrega")
  valorPecas     Float    @default(0) @map("valor_pecas")
  valorServicos  Float    @default(0) @map("valor_servicos")
  desconto       Float    @default(0)
  total          Float    @default(0)
  pedidoId       String?  @map("pedido_id")   // vínculo com venda de peças
  notaFiscalId   Int?     @map("nota_fiscal_id")
  pecas          OSItem[]
  servicos       OSServico[]
  historico      OSStatusHistorico[]
  criadoEm       DateTime @default(now()) @map("criado_em")
  @@map("ordens_servico")
}

model OSItem {              // peças aplicadas (baixam estoque)
  id        Int     @id @default(autoincrement())
  osId      Int     @map("os_id")
  produtoId Int     @map("produto_id")
  quantidade Int
  precoUnit Float   @map("preco_unit")
  @@map("os_itens")
}

model OSServico {            // mão de obra (não tem estoque; gera NFS-e)
  id        Int     @id @default(autoincrement())
  osId      Int     @map("os_id")
  descricao String
  horas     Float?  @default(0)
  valorHora Float?  @map("valor_hora")
  valor     Float
  @@map("os_servicos")
}

model OSStatusHistorico {
  id        Int      @id @default(autoincrement())
  osId      Int      @map("os_id")
  status    String
  observacao String?
  autor     String?
  criadoEm  DateTime @default(now()) @map("criado_em")
  @@map("os_status_historico")
}
```

### 5.2 Fluxo da OS (máquina de estados)

```
aberta → diagnostico → orcamento → (aprovada | reprovada→cancelada)
       → em_execucao → finalizada → faturada → entregue
```
- **Aprovação do orçamento:** gerar link/PDF do orçamento (peças + serviços + total) e registrar aprovação (assinatura simples ou aceite no WhatsApp).
- **Ao entrar em `em_execucao`:** ainda **não** baixa estoque (peça pode não ser aplicada). Baixa em `finalizada` ou `faturada`, gerando `MovimentoEstoque` tipo `saida` origem `os:{id}`.
- **Ao `faturar`:** gera **NF-e das peças** (reusa PR-9) + **NFS-e da mão de obra** (município). Aqui entra a decisão fiscal: emitir uma nota mista ou duas (peça = NF-e estadual, serviço = NFS-e municipal).
- **Ao `entregue`:** fecha no financeiro (`ContaReceber` liquidada).

### 5.3 Telas necessárias
| Tela | Rota | Entrega |
|---|---|---|
| Lista de OS | `src/app/admin/os/page.tsx` | tabela com nº, cliente, veículo, status, total |
| Kanban de OS | `src/app/admin/os/kanban/page.tsx` | colunas por status, arrastar para mudar estado |
| Detalhe da OS | `src/app/admin/os/[id]/page.tsx` | diagnóstico, peças, serviços, histórico, botões de ação |
| Orçamento (cliente) | `src/app/orcamento/[token]/page.tsx` | visão pública do orçamento para aprovar |
| Agenda | `src/app/admin/os/agenda/page.tsx` | previsão de entrega por dia |
| Meus veículos (cliente) | `src/app/conta/veiculos/page.tsx` | cadastro/consulta de veículos |

### 5.4 APIs
`GET/POST /api/admin/os`, `GET/PATCH /api/admin/os/[id]`, `POST /api/admin/os/[id]/status`, `POST /api/admin/os/[id]/faturar`, `GET/POST /api/admin/veiculos`, `POST /api/orcamento/[token]/aprovar`.

### 5.5 Regras e integrações
1. Peças da OS **saem do mesmo estoque** do e-commerce (não é estoque paralelo).
2. Mão de obra **não movimenta estoque**; vira item de NFS-e.
3. `total` da OS = `valorPecas + valorServicos - desconto`, recalculado a cada alteração.
4. Cancelar OS `em_execucao` devolve peças ao estoque (movimento tipo `devolucao`).
5. Notificação WhatsApp por mudança de status reusando o `zap-hub`.
6. Toda OS precisa de **veículo** vinculado a um **cliente** — sem isso não emite nota.

### 5.6 Ordem de implementação (bite-sized)
1. `Veiculo` + CRUD (`/api/admin/veiculos`) — cliente cadastra veículo.
2. `OrdemServico` + `aberta` (criar OS com cliente+veículo).
3. `OSStatusHistorico` + endpoint de transição de status.
4. `OSItem` (peças) + recálculo de `valorPecas`.
5. `OSServico` (mão de obra) + recálculo de `valorServicos`.
6. Tela lista + detalhe da OS.
7. Kanban com drag-and-drop.
8. Orçamento público + aprovação.
9. Baixa de estoque na finalização (`MovimentoEstoque` tipo `saida`).
10. Faturamento: NF-e das peças + NFS-e da mão de obra.
11. `ContaReceber` na entrega.
12. Agenda e notificações WhatsApp.

---

## 6. Emissor — o que já existe de issue

**No `carCrewCommerce`: nenhuma issue sobre emissor/fiscal/estoque/OS.** Todo o assunto é novo aqui.

**No `nfe-brasil` (issues abertas — a base do emissor):**
| # | Título | Estado |
|---|---|---|
| 1 | feat: Emissão de NF-e do zero via WhatsApp | OPEN (bloqueante p/ PR-9) |
| 2 | [TESTE] Geração de XML NF-e com IBS/CBS/IS (NT 2025.002) | OPEN  🔴 crítica |
| 3 | [IMPLEMENT] Gerador de XML NF-e com IBS/CBS/IS | OPEN  🔴 crítica |
| 4 | [TESTE] Cálculo de IBS e CBS por operação | OPEN  🔴 crítica |
| 5 | [IMPLEMENT] Módulo de Cálculo Tributário IBS/CBS/IS | OPEN  🔴 crítica |
| 6 | [TESTE] Exportar chave NF-e + tributos para Split Payment | OPEN  🟠 alta |
| 7 | [IMPLEMENT] API de consulta de tributos para Split Payment | OPEN  🟠 alta |
| 8 | [FUTURO] Integração Plataforma Pública de Split Payment | OPEN |
| 9 | [FUTURO] Tela do cliente p/ acompanhar status das notas emitidas | OPEN |

**Já pronto no `nfe-brasil`:** `nfe/assinatura.py` (valida XMLDSig), `nfe/danfe.py`, `nfe/distribuicao.py` (mTLS A1), `nfe/xml_parser.py`, `consultar_nfe`/`validar_chave_nfe`/`consultar_status_sefaz`, +18 módulos (CNPJ, CPF, CEP, NCM, CFOP, CNAE, SPED, eSocial).

**Conclusão:** `nfe-brasil` vira o **microsserviço fiscal** do CarCrew. O que falta para emitir são as issues #1/#3/#5 dele. Alternativa de contingência: emissor externo (eNotas/Focus/PlugNotas) no lugar das issues #1/#3, mantendo o `nfe-brasil` só para consulta/DANFE.

---

## 7. Riscos e decisões abertas

| # | Risco / decisão | Impacto |
|---|---|---|
| 1 | `nfe-brasil` sem emissão (issues #1/#3 abertas) | bloqueia PR-9 → decidir: construir no nfe-brasil **ou** contratar emissor externo |
| 2 | Senhas em texto puro e secret hardcoded no auth | 🔴 segurança — corrigir antes de qualquer go-live |
| 3 | Clone local atrás do `origin/main` | rebase antes de começar |
| 4 | Nota mista (peça + serviço) em OS: uma NF-e ou NF-e + NFS-e separadas? | definir com contador |
| 5 | Precisa de certificado A1 + CNPJ + IE para homologação | depende de dados do Alcides/contador |
| 6 | Migração de estoque: estoque atual (int) é confiável? | precisa carga inicial de contagem |
| 7 | Gateway de pagamento: Asaas vs Mercado Pago | definir taxa e conciliação |
| 8 | Split Payment / Reforma Tributária (2026) | o `nfe-brasil` já tem issues; acompanhar obrigatoriedade |
