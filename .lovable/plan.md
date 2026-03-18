

## Plano: Padronizar módulos de todos os empreendedores pela Ubiz Resgata

### Situação atual

- **Ubiz Resgata** tem 46 módulos com uma curadoria específica (26 habilitados, 20 desabilitados).
- **Outras marcas** (DomStore, Leo, Vini) têm 51-52 módulos, todos habilitados — porque não existe template para o plano `free`, e o fallback ativa tudo.
- **Novas marcas** futuras também cairão no fallback e terão tudo habilitado.

### O que será feito

#### 1. Criar o template `free` baseado na Ubiz Resgata
Inserir registros em `plan_module_templates` com `plan_key = 'free'` para **todos** os `module_definitions`, usando exatamente o padrão da Ubiz Resgata como referência:

**Habilitados (26):** affiliate_deals, api_keys, approvals, banners, brand_settings, brand_theme, categories, coupons, crm, csv_import, custom_pages, customers, earn_points_store, home_sections, machine_integration, offers, page_builder, partner_landing, profile_links, redemption_qr, reports, stores, taxonomy, theme_images, theme_texts, users_management, wallet

**Desabilitados (restantes):** app_icons, audit, branches, catalog, domains, ganha_ganha, giftcards, icon_library, missions, notifications, points, points_rules, subscription, theme_colors, theme_layout, theme_offer_cards, theme_typography, vouchers, welcome_tour + módulos novos (access_hub, guide_brand, guide_emitter, multi_emitter, offer_card_config, sponsored, store_permissions)

#### 2. Sincronizar marcas existentes
Para cada marca ativa que não seja a Ubiz Resgata:
- Atualizar `brand_modules` para espelhar o estado da Ubiz Resgata (is_enabled = true/false)
- Inserir módulos faltantes que a Ubiz Resgata tem mas a outra marca não
- Desabilitar módulos extras que estão habilitados mas deveriam estar desabilitados

#### 3. Garantir que futuras marcas sigam o template
O `provision-trial` já consulta `plan_module_templates` com `plan_key = 'free'` — como hoje não encontra registros, cai no fallback. Com o template criado, novas marcas já virão com os módulos corretos.

### Execução técnica

| Ação | Método |
|---|---|
| Criar template `free` em `plan_module_templates` | Insert via ferramenta de dados |
| Sincronizar `brand_modules` das 3 marcas ativas | Update/Insert via ferramenta de dados |
| Nenhuma alteração de código necessária | `provision-trial` já suporta o template |

### Resultado

Todas as marcas (atuais e futuras) no plano free terão exatamente os mesmos módulos habilitados/desabilitados que a Ubiz Resgata.

