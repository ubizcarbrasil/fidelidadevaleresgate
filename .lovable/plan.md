

## Plano: Perfil de Empreendedor Padrão (Starter Kit v2)

### Resumo
Criar um template de provisionamento padrão com 8 seções pré-definidas para o plano "basic", um popup de onboarding sobre API Key, e restrições de edição por plano.

### Escopo — 3 grandes blocos

---

### Bloco 1: Template padrão com 8 seções na `home_template_library`

Criar um novo template `"empreendedor-basico"` na tabela `home_template_library` com as 8 seções abaixo, e marcá-lo como `is_default = true` (desmarcando o atual "ofertas-classico"):

| # | Título | Template Type | Display | Rows | Filtro Segmento |
|---|--------|---------------|---------|------|-----------------|
| 1 | Melhores Ofertas | OFFERS_CAROUSEL | carousel (logo da loja) | 2 | Todos |
| 2 | Deu fome? Pague com pontos | STORES_GRID | carousel (logo da loja) | 2 | Alimentação* |
| 3 | Food Pontos | OFFERS_CAROUSEL | carousel (imagem produto) | 2 | Alimentação* |
| 4 | Beleza e Saúde | STORES_GRID | carousel (logo da loja) | 1 | Beleza e Estética + Saúde |
| 5 | Serviços na Cidade | OFFERS_GRID | carousel (imagem produto) | 1 | Serviços Profissionais |
| 6 | Achadinhos | ACHADINHOS (seção nativa) | grid | 3 | — |
| 7 | Lojas da Cidade | STORES_GRID | grid (logo) | 3 | Todos |
| 8 | Resgate na Cidade | STORES_GRID | grid (logo) | 3 | Todos |

*Alimentação = todos os segmentos de comida (Restaurante, Hamburgueria, Pizzaria, Padaria, Cafeteria, etc.)

**Ação**: Inserir via migration/insert na `home_template_library` com `template_payload_json` contendo as 8 seções, usando os IDs reais dos `section_templates` e `taxonomy_segments` já existentes.

---

### Bloco 2: Atualizar Edge Function `provision-brand` 

Alterar `supabase/functions/provision-brand/index.ts`:

1. **Seção 9 (Apply home template)**: Usar o novo template `"empreendedor-basico"` como padrão. Inserir as 8 seções na tabela `brand_sections` com os `segment_filter_ids` corretos, `rows_count`, e `display_mode`.

2. **Aceitar novos campos no body**:
   - `enable_demo_stores` (boolean, default true) — toggle para ativar/desativar lojas demo
   - `enable_test_credits` (boolean, default true) — toggle para ativar/desativar crédito no cliente teste
   - `selected_sections` (array de indices 0-7, default todos) — quais seções ativar

3. **Condicionar** criação de lojas demo e créditos ao toggle.

4. **Atualizar `ProvisionBrandWizard.tsx`**: Adicionar na UI:
   - Step "company": campo e-mail/senha do empreendedor (ao invés de gerar automaticamente)
   - Step "branding": checkboxes das 8 seções com preview
   - Toggles para lojas demo e crédito teste

---

### Bloco 3: Restrição de edição por plano + Popup API Key

#### 3a. Restrição de seções no plano basic

Adicionar campo `subscription_plan` na lógica do `BrandSectionsManager.tsx`:
- Plano `"basic"` (ou null/free): pode apenas **reordenar** e **ativar/desativar** seções existentes. Ocultar botões "Adicionar seção", "Editar seção" e "Excluir seção".
- Plano pago: acesso completo.

Usar o campo `brands.subscription_plan` já existente para determinar o plano.

#### 3b. Popup de onboarding — API Key

Criar componente `ApiKeyOnboardingDialog.tsx`:
- Dialog que aparece no primeiro login do `brand_admin`
- Explica o fluxo: "Para ativar a pontuação de clientes, configure sua API Key"
- 3 steps visuais: 1) Login/Senha da API, 2) Chave API, 3) Integração
- Salvar flag `api_key_onboarding_seen` no `brand_settings_json` para não mostrar novamente
- Exibido no `AppLayout.tsx` quando scope é BRAND e flag não está setada

---

### Arquivos alterados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/provision-brand/index.ts` | Atualizar lógica de seções, aceitar novos campos |
| `src/pages/ProvisionBrandWizard.tsx` | Adicionar campos de seções, toggles, e-mail/senha |
| `src/components/BrandSectionsManager.tsx` | Restrição por plano (hide add/edit/delete no basic) |
| `src/components/ApiKeyOnboardingDialog.tsx` | **Novo** — popup de onboarding API Key |
| `src/components/AppLayout.tsx` | Integrar popup de onboarding |

### Banco de dados
- INSERT do novo template na `home_template_library`
- Nenhuma alteração de schema necessária (campos existentes cobrem tudo)

