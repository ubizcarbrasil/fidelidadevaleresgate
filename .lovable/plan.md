

# Fases 3-6: Resgate na Cidade, CSV Criar Motoristas, Linhas Resgate, Vídeos

## Fase 3 — Seção "Resgate na Cidade" (Item 4)

Nova seção no `DriverMarketplace.tsx` abaixo de "Resgatar com Pontos" que exibe ofertas de lojistas parceiros com `offer_purpose IN ('REDEEM', 'BOTH')`.

### Arquivos
- **Novo**: `src/components/driver/SecaoResgateCidade.tsx` — Componente da seção com cards de ofertas de lojistas (logo da loja, título, valor do crédito em pontos)
- **Editar**: `src/components/driver/DriverMarketplace.tsx` — Adicionar query de `offers` filtrada por `offer_purpose`, renderizar `SecaoResgateCidade` abaixo da seção resgate com pontos

### Lógica
- Query: `offers.select('*, stores(name, logo_url)').eq('brand_id', X).eq('is_active', true).eq('status', 'ACTIVE').in('offer_purpose', ['REDEEM', 'BOTH'])`
- Cards exibem: logo da loja, título da oferta, valor do crédito, badge de pontos necessários
- Ao clicar, abre detalhes da oferta (reutiliza fluxo existente de redemptions)

---

## Fase 4 — CSV Criar Novos Motoristas (Item 5)

O `ImportarCsvMotoristas.tsx` já atualiza motoristas existentes. Expandir para **criar** novos quando não encontra match.

### Arquivos
- **Editar**: `src/components/driver-management/ImportarCsvMotoristas.tsx`

### Mudanças
- Quando `matched === null`, criar novo `customer` com: `name: "[MOTORISTA] nome"`, `cpf`, `phone`, `email`, `brand_id`, `points_balance: 0`
- Adicionar status `"criado"` no `ResultadoImport`
- Badge azul "X criados" no resumo de resultados
- Precisa do `branch_id` — usar o primeiro branch da marca ou adicionar seleção

---

## Fase 5 — Linhas Configuráveis na Seção "Resgatar com Pontos" (Item 6)

A seção redeemable hoje renderiza 1 único carrossel horizontal. Permitir configurar múltiplas linhas.

### Arquivos
- **Editar**: `src/pages/DriverPanelConfigPage.tsx` — Adicionar controle de linhas para a seção "Resgatar com Pontos" (campo `driver_redeem_rows` no `brand_settings_json`)
- **Editar**: `src/components/driver/DriverMarketplace.tsx` — Ler `settings.driver_redeem_rows` e renderizar múltiplas linhas com distribuição round-robin (mesmo padrão das categorias)

---

## Fase 6 — Vídeos no "Como Funciona" (Item 7)

Adicionar seção de vídeos com descrição no `DriverProgramInfo`.

### Arquivos
- **Novo**: `src/components/driver/SecaoVideosInfo.tsx` — Componente que renderiza cards de vídeo (YouTube/Vimeo embed ou `<video>`) com título e descrição
- **Editar**: `src/components/driver/DriverProgramInfo.tsx` — Renderizar `SecaoVideosInfo` após o passo-a-passo, consumindo `brand_settings_json.driver_info_videos`
- **Editar**: `src/pages/DriverPanelConfigPage.tsx` — Adicionar seção para gerenciar vídeos (adicionar/remover/editar título, descrição, URL do vídeo)

### Dados
- Persistido em `brand_settings_json` como: `driver_info_videos: [{ id, title, description, video_url }]`
- Suporte a YouTube (embed via iframe), Vimeo e URLs diretas de vídeo

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/driver/SecaoResgateCidade.tsx` | Novo |
| `src/components/driver/SecaoVideosInfo.tsx` | Novo |
| `src/components/driver/DriverMarketplace.tsx` | Editar (seção Resgate na Cidade + linhas resgate) |
| `src/components/driver/DriverProgramInfo.tsx` | Editar (vídeos) |
| `src/components/driver-management/ImportarCsvMotoristas.tsx` | Editar (criar novos motoristas) |
| `src/pages/DriverPanelConfigPage.tsx` | Editar (config linhas resgate + gerenciar vídeos) |

Total: 2 arquivos novos + 4 editados. Sem migrações de banco necessárias.

