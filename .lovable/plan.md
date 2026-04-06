

## Ajuste Estratégico — Ativação Opcional do Módulo de Duelos

### Resumo
Tornar o módulo de Duelos totalmente opcional em dois níveis: cidade (branch) e motorista individual. A cidade controla quais sub-funcionalidades ativar via `branch_settings_json`, e o motorista decide se participa via toggle existente.

---

### 1. Banco de dados
Nenhuma migração necessária. O campo `branch_settings_json` (JSONB) já existe na tabela `branches` e está vazio. Será utilizado para armazenar as flags:

```json
{
  "enable_driver_duels": true,
  "enable_city_ranking": true,
  "enable_city_belt": false,
  "allow_public_duel_viewing": true
}
```

---

### 2. Painel administrativo da cidade

**Arquivo modificado: `src/pages/BrandBranchForm.tsx`**

Adicionar nova seção "Gamificação de Motoristas" no formulário de edição da cidade, com 4 toggles (Switch):
- Ativar módulo de Duelos (`enable_driver_duels`)
- Ativar Ranking da Cidade (`enable_city_ranking`)
- Ativar Cinturão da Cidade (`enable_city_belt`)
- Permitir visualização pública dos duelos (`allow_public_duel_viewing`)

Carregar valores do `branch_settings_json` ao editar; salvar de volta no JSON ao submeter. Seguir o mesmo padrão visual das demais seções do formulário.

---

### 3. Hook de configuração da cidade

**Novo arquivo: `src/components/driver/duels/hook_config_duelos.ts`**

Hook `useConfigDuelos(branch)` que extrai as flags do `branch_settings_json` e retorna:
```ts
{
  duelosAtivos: boolean,
  rankingAtivo: boolean,
  cinturaoAtivo: boolean,
  visualizacaoPublica: boolean
}
```
Valores padrão: todos `false` (módulo desligado se não configurado).

---

### 4. Condicionais no DriverMarketplace

**Arquivo modificado: `src/components/driver/DriverMarketplace.tsx`**

- Importar `useConfigDuelos` e extrair flags do `branch`
- Botão de Duelos no header: visível somente se `duelosAtivos === true`
- `SecaoDuelosCidade`: visível somente se `visualizacaoPublica === true`
- Quando `duelosAtivos` é false e motorista não tem acesso, esconder completamente

---

### 5. Condicionais no DuelsHub

**Arquivo modificado: `src/components/driver/duels/DuelsHub.tsx`**

- Receber prop `config` com as flags da cidade (ou usar o hook)
- Botão "Ranking da Cidade": visível somente se `rankingAtivo === true`
- Seções de duelo (criar, desafiar, aceitar): visíveis somente se `duelosAtivos === true`
- Se motorista acessa DuelsHub mas não ativou participação: mostrar convite "Ative os Duelos e participe das competições da sua cidade"

---

### 6. Condicionais no RankingCidadeSheet

**Arquivo modificado: `src/components/driver/duels/RankingCidadeSheet.tsx`**

- Verificar `rankingAtivo` antes de renderizar; se false, não exibir

---

### 7. Condicionais na SecaoDuelosCidade

**Arquivo modificado: `src/components/driver/duels/SecaoDuelosCidade.tsx`**

- Receber e verificar `visualizacaoPublica`; se false, retornar null

---

### Arquivos envolvidos
- `src/components/driver/duels/hook_config_duelos.ts` (novo)
- `src/pages/BrandBranchForm.tsx` (modificado — seção de gamificação)
- `src/components/driver/DriverMarketplace.tsx` (modificado — condicionais)
- `src/components/driver/duels/DuelsHub.tsx` (modificado — condicionais por feature flag)
- `src/components/driver/duels/SecaoDuelosCidade.tsx` (modificado — condicional)
- `src/components/driver/duels/RankingCidadeSheet.tsx` (modificado — condicional)

### UX
- Cidade sem módulo ativado: motorista nunca vê nada relacionado a duelos
- Cidade com módulo ativado mas motorista sem participação: vê convite amigável
- Cada sub-funcionalidade (ranking, cinturão, visualização pública) controlada independentemente

