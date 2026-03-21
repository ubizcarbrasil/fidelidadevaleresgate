

## Plano: Limpar a Home — remover itens marcados com X

### O que remover (baseado nas imagens anotadas)

| Item | Localização | Ação |
|---|---|---|
| Seletor de cidade ("São João da B...") | Header (`CustomerLayout.tsx`) | Remover `BranchPickerSheet` |
| Sino de notificações | Header (`CustomerLayout.tsx`) | Remover botão do sino |
| Ícone da carteira | Header (`CustomerLayout.tsx`) | Remover botão da carteira |
| Saudação + nome ("Boa noite, Visitante") | Home (`CustomerHomePage.tsx`) | Remover bloco de greeting |
| Badge de saldo ("0 pts") | Home (`CustomerHomePage.tsx`) | Remover botão de saldo |

### O que permanece
- Logo + nome da marca no header
- Barra de busca
- Carrossel de banners
- Carrossel de categorias (Achadinhos)
- Seções For You, Emissoras, Achadinhos
- Seções CMS dinâmicas
- Bottom tab bar

### Arquivos envolvidos

**1. `src/components/customer/CustomerLayout.tsx`**
- Remover do header: `BranchPickerSheet`, botão do sino, botão da carteira
- Manter: logo, nome, barra de busca

**2. `src/pages/customer/CustomerHomePage.tsx`**
- Remover o bloco "Hero Section" inteiro (greeting + saldo, linhas 160-196)
- As seções nativas começam direto após o `<div className="pb-4">`

