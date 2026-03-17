

## Plano: Estruturação de 3 Planos de Assinatura por Módulos

### Situação Atual — Ubiz Resgata (plano `free`)

**24 módulos ativos**, **23 módulos inativos ou sem vínculo**. A tabela `plan_module_templates` está vazia — não há templates configurados ainda.

### Proposta de 3 Planos

Baseado na análise dos módulos e no valor comercial de cada um, proponho:

---

#### PLANO 1 — **Starter** (R$ 97/mês)
*Foco: Vitrine digital + Resgates básicos*

Inclui tudo do Core (Lojas, Clientes, Ofertas, Carteira, Home, Resgate QR) **+**:

| Categoria | Módulos |
|-----------|---------|
| Comercial | Achadinhos, Cupons |
| Visual | Aparência da Marca, Banners, LP de Parceiros, Links do Perfil |
| Visual Tema | Imagens da Marca, Textos da Marca |
| Dados | Relatórios, Taxonomia |
| Governança | Aprovações, Gestão de Usuários |
| Geral | Categorias, Integrações API |

**Total: ~20 módulos** — Essencialmente o que Ubiz Resgata tem hoje ativo.

---

#### PLANO 2 — **Profissional** (R$ 197/mês)
*Foco: Fidelidade completa + Personalização avançada + CRM*

Tudo do Starter **+**:

| Categoria | Módulos adicionados |
|-----------|-------------------|
| **Fidelidade** | **Pontos, Regras de Pontos, Pontuar Cliente** |
| **Comercial** | **Catálogo, Vouchers** |
| **Visual** | **Construtor de Páginas, Páginas Custom, Galeria de Ícones, Ícones do App, Layout de Ofertas** |
| **Visual Tema** | **Cores do Tema, Tipografia, Layout & Dimensões, Etiquetas de Ofertas** |
| **Engajamento** | **CRM Estratégico, Notificações, Tour de Boas-Vindas, Guias** |
| **Governança** | **Auditoria, Gestão de Acessos, Permissão de Parceiros** |
| **Geral** | **Cidades (Branches), Importação de Dados, Configurações, Meu Plano** |

**Total: ~46 módulos** — Desbloqueia Pontuação + Catálogo + Customização completa do app.

---

#### PLANO 3 — **Enterprise** (R$ 397/mês ou sob consulta)
*Foco: Ecossistema compartilhado + Integrações + Monetização*

Tudo do Profissional **+**:

| Categoria | Módulos adicionados |
|-----------|-------------------|
| **Fidelidade** | **Ganha-Ganha** (ecossistema compartilhado de pontos) |
| **Comercial** | **Patrocinados** (placements pagos) |
| **Engajamento** | **Missões** (gamificação) |
| **Visual** | **Domínios** (domínio próprio) |
| **Integrações** | **TaxiMachine** (mobilidade) |

**Total: todos os módulos** — Acesso irrestrito com monetização avançada via Ganha-Ganha.

---

### Destaques Comerciais por Plano

| Recurso-chave | Starter | Profissional | Enterprise |
|---|:---:|:---:|:---:|
| Vitrine de Ofertas & Resgates | ✅ | ✅ | ✅ |
| **Programa de Pontos + Catálogo** | ❌ | ✅ | ✅ |
| **Personalização completa (cores, ícones, páginas)** | ❌ | ✅ | ✅ |
| **CRM + Notificações** | ❌ | ✅ | ✅ |
| **Ganha-Ganha (ecossistema compartilhado)** | ❌ | ❌ | ✅ |
| **Domínio próprio + Patrocinados** | ❌ | ❌ | ✅ |
| **Missões (gamificação)** | ❌ | ❌ | ✅ |

---

### Implementação Técnica

1. **Adicionar `enterprise` ao enum/check** de `subscription_plan` na tabela `brands`
2. **Popular `plan_module_templates`** com ~130 linhas (cada módulo × cada plano com `is_enabled` correto)
3. **Atualizar a página de Planos** (`SubscriptionPage.tsx`) para exibir os 3 planos com a comparação acima
4. **Atualizar `PlanModuleTemplatesPage.tsx`** para incluir a coluna Enterprise na matriz de configuração
5. **Atualizar `apply-plan-template`** para aceitar `enterprise` como `plan_key` válido

### Arquivos a editar
- Migration SQL: adicionar `enterprise` ao check constraint + popular `plan_module_templates`
- `src/pages/SubscriptionPage.tsx` — card do plano Enterprise
- `src/pages/PlanModuleTemplatesPage.tsx` — coluna Enterprise
- `supabase/functions/apply-plan-template/index.ts` — aceitar `enterprise`

