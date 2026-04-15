

## Central de Configuração por Cidade

### O que será criado

Uma nova página dedicada (`/configuracao-cidade`) no painel do empreendedor, onde ele seleciona uma cidade e controla com toggles simples (Sim/Não) exatamente quais funcionalidades o motorista terá naquela cidade.

### Toggles disponíveis

| Funcionalidade | Chave em `branch_settings_json` |
|---|---|
| Motorista duela? | `enable_duels_module` |
| Motorista aposta? | `enable_duel_guesses` |
| Motorista compra no Mercado Livre? | `enable_marketplace_module` |
| Motorista tem acesso ao WhatsApp? | `enable_whatsapp_access` (nova) |
| Motorista pontua por viagem? | `enable_race_earn_module` |
| Motorista resgata com estabelecimentos da cidade? | `is_city_redemption_enabled` (campo existente na tabela `branches`) |
| Motorista compra com pontos? | `enable_achadinhos_module` |
| Motorista acessa os Achadinhos? | `enable_achadinhos_module` (mesmo toggle — achadinhos = compra com pontos via marketplace) |

**Nota:** "Compra com pontos" e "Acessa os Achadinhos" são a mesma funcionalidade internamente. Se o usuário quiser separar, posso criar uma chave adicional. Vou tratar como dois toggles visuais distintos com chaves separadas: `enable_achadinhos_module` para Achadinhos e `enable_points_purchase` (nova) para compra com pontos.

### Estrutura de arquivos

```
src/features/configuracao_cidade/
├── pagina_configuracao_cidade.tsx      — Página principal
├── components/
│   ├── seletor_cidade_config.tsx       — Dropdown de cidades
│   └── painel_toggles_cidade.tsx       — Grid de toggles com ícones
├── hooks/
│   └── hook_configuracao_cidade.ts     — Fetch + save do branch_settings_json
└── constants/
    └── constantes_toggles.ts           — Definição dos toggles (label, chave, ícone, descrição)
```

### Como funciona

1. Empreendedor seleciona a cidade no dropdown
2. O sistema carrega o `branch_settings_json` + `is_city_redemption_enabled` da cidade
3. Mostra uma lista de cards com switch (Sim/Não) para cada funcionalidade
4. Ao alterar qualquer toggle, salva automaticamente (ou botão "Salvar")
5. O `DriverPanelPage` e demais componentes já consomem essas chaves — as funcionalidades serão aplicadas imediatamente

### Integração no sidebar

Adicionar o item no `MENU_REGISTRY` e no grupo "Cidades" do `BrandSidebar`, acessível para o empreendedor.

### Arquivos modificados

- `src/compartilhados/constants/constantes_menu_sidebar.ts` — novo registro
- `src/components