

# Criar Menu "Cidades" no Sidebar do Empreendedor

## Problema
Atualmente, as funcionalidades relacionadas a cidades estão espalhadas em diferentes grupos do menu:
- **Cidades** → em "Personalização & Vitrine"
- **Regras de Resgate** (com modelo de negócio por cidade) → em "Resgate com Pontos"
- **Guia de Cidades** → em "Guias Inteligentes"
- **Regras de Pontuação Motorista** → em "Programa de Fidelidade"

Isso dificulta a gestão centralizada das cidades.

## Solução
Criar um novo grupo **"Cidades"** no sidebar que centralize toda a gestão de cidades.

### Estrutura do novo menu "Cidades"

```text
📍 Cidades
  ├── Minhas Cidades         (/brand-branches)        — listar e ativar/desativar
  ├── Nova Cidade             (/brand-branches/new)    — criar cidade
  ├── Regras da Cidade        (/regras-resgate)        — modelo de negócio + regras de resgate por cidade
  └── Guia de Cidades         (/brand-cidades-journey) — tutorial passo a passo
```

### Alterações

#### 1. `src/components/consoles/BrandSidebar.tsx`
- Criar novo grupo `"Cidades"` com os itens acima
- Remover "Cidades" do grupo "Personalização & Vitrine"
- Remover "Guia de Cidades" do grupo "Guias Inteligentes"
- Mover "Regras de Resgate" para o novo grupo (manter também em "Resgate com Pontos" ou só no novo grupo — ver abaixo)
- Posicionar o grupo logo após "Guias Inteligentes" e "Manuais", antes de "Personalização & Vitrine"

#### 2. Decisão sobre "Regras de Resgate"
A página `RegrasResgatePage` contém tanto regras globais de resgate (taxa de conversão, mínimo de pontos) quanto o modelo de negócio por cidade. Duas opções:

- **Opção A**: Mover integralmente para o grupo "Cidades" e remover de "Resgate com Pontos"
- **Opção B**: Manter em "Resgate com Pontos" e adicionar apenas um link "Modelo de Negócio" no grupo "Cidades" (requer separar a página em duas)

**Recomendação**: Opção A — manter simples, sem duplicar links.

### Detalhes técnicos
- Editar apenas o array `groups` em `BrandSidebar.tsx` para reorganizar os itens
- Nenhuma rota, página ou lógica de negócio precisa mudar
- O grupo "Cidades" ficará sempre visível (sem `moduleKey` nos itens essenciais)

