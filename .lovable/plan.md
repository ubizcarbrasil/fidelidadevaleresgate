

# Reorganizar menu lateral — Criar grupo "Achadinhos" e mover itens

## Resumo das mudanças

Criar um novo grupo de menu chamado **"Achadinhos"** no `BrandSidebar.tsx` e reorganizar os itens conforme solicitado.

## Alterações no arquivo `src/components/consoles/BrandSidebar.tsx`

### 1. Remover do grupo "Personalização & Vitrine":
- `sidebar.achadinhos` (Achadinhos)
- `sidebar.categorias_achadinhos` (Categorias de Achadinhos)
- `sidebar.espelhamento` (renomear para **"Espelhamento Achadinho"**)
- `sidebar.governanca_ofertas` (renomear para **"Governança Achadinho"**)

### 2. Remover do grupo "Equipe & Acessos":
- `sidebar.painel_motorista` (Painel do Motorista) — mover para o novo grupo Achadinhos

### 3. Remover do grupo "Gestão Comercial":
- `sidebar.motoristas` — renomear de "Motoristas" para **"Motorista"**

### 4. Remover do grupo "Integrações & API":
- `sidebar.driver_points_rules` — renomear de "Pontuação Motoristas" para **"Regras de Pontuação Motorista"** e mover para **"Programa de Fidelidade"**

### 5. Criar novo grupo "Achadinhos" (após "Personalização & Vitrine"):
```
Achadinhos
├── Achadinhos              (/affiliate-deals)
├── Categorias de Achadinhos (/affiliate-categories)
├── Espelhamento Achadinho   (/mirror-sync)
├── Governança Achadinho     (/offer-governance)
└── Painel do Motorista      (/driver-config)
```

### 6. Adicionar ao grupo "Programa de Fidelidade":
```
+ Regras de Pontuação Motorista (/driver-points-rules)
```

## Arquivos afetados
- `src/components/consoles/BrandSidebar.tsx` — única alteração necessária

