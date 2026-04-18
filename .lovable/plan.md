

## Como o Root controla o que aparece no painel do empreendedor

Já existe um sistema completo para isso no projeto. Vou mapear onde fica e como funciona, para você saber exatamente onde clicar.

## Onde fica (já implementado)

**Tela:** `/admin/central-modulos` (visível só para Root Admin no menu lateral)

Essa página tem 4 abas. As duas que controlam o empreendedor são:

### Aba 1 — "Catálogo"
Cadastro mestre de todas as funcionalidades existentes na plataforma (`module_definitions`). Aqui você define:
- Nome e chave técnica do módulo (ex: `achadinhos`, `redemption_qr`, `duels`)
- Categoria (Loyalty, Mobility, Marketing, etc.)
- Se é **essencial** (`is_core = true` → não pode ser desligado por ninguém)
- Se é **customer-facing** (aparece pro cliente final) ou administrativo

Use isso quando criar uma nova funcionalidade na plataforma.

### Aba 2 — "Empreendedores" ⭐ (essa é a que você está perguntando)
Lista todas as marcas (empreendedores) cadastradas. Para cada marca você:
1. Seleciona a marca (ex: "Ubiz Resgata", "Meu Mototaxi")
2. Vê todos os módulos do catálogo
3. Liga/desliga cada módulo para aquela marca específica (escreve em `brand_modules`)

**O que acontece quando você desliga:**
- O item some na hora do menu lateral do empreendedor (Realtime via `useResolvedModules`)
- A rota correspondente fica bloqueada por `ModuleGuard`
- Cidades daquela marca também perdem acesso (cascata)
- Funcionalidades marcadas `is_core = true` ficam travadas (não permite desligar)

### Aba 3 — "Cidades"
Após escolher uma marca, lista as cidades dela. Permite **override por cidade** (caso queira desligar algo só em uma cidade, mantendo nas outras). Funciona em cascata: cidade > marca > is_core.

### Aba 4 — "Planos"
Templates de plano (Free, Starter, Profissional, Enterprise). Aplicar um template numa marca seta múltiplos módulos de uma vez.

## Fluxo completo de governança (3 níveis)

```text
ROOT (você)                BRAND ADMIN (empreendedor)        BRANCH ADMIN (franqueado)
/admin/central-modulos  →  /configuracao-modulos-cidade  →  (sem controle, recebe o que vier)
   ↓                            ↓
brand_modules              city_module_overrides
(marca toda)               (cidade específica)
```

- **Você (Root)** decide o que cada marca pode acessar
- **Empreendedor** decide, dentro do que você liberou, o que cada cidade dele usa
- **Franqueado** opera com o que o empreendedor configurou

## Resposta direta à sua pergunta

Você **já tem** a tela. Caminho: menu lateral do painel raiz → "Central de Módulos" → aba "Empreendedores" → escolher marca → toggle nos módulos.

Toda mudança é instantânea (Realtime), não precisa o empreendedor fazer logout. Funcionalidades essenciais (`is_core`) ficam protegidas para não quebrar a plataforma.

## Perguntas antes de qualquer ação

Antes de eu fazer qualquer coisa, preciso saber qual é a sua intenção real:

1. **Só queria entender onde fica** → não preciso codar nada, é só usar `/admin/central-modulos` aba "Empreendedores"
2. **A tela existe mas tem algo confuso/quebrado nela** → me diga o que não funciona como esperado e eu investigo
3. **Quer uma melhoria específica** (ex: aplicar para várias marcas de uma vez, busca, filtro, preview de impacto antes de salvar) → me diga qual

