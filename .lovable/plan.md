

## Página de Links Centralizada — Central de Acessos Rápidos

### O que será feito
Criar uma nova página `/links` com cards visuais organizados por categoria, dando acesso direto a todos os painéis do sistema. A página será pública (sem autenticação), servindo como um "hub de links" para facilitar o acesso.

### Estrutura visual

```text
┌──────────────────────────────────────────┐
│  🏢  Fidelidade Vale Resgate             │
│  Central de Acessos                      │
├──────────────────────────────────────────┤
│                                          │
│  ── Painéis Administrativos ──           │
│  ┌─────────┐  ┌─────────┐               │
│  │ Painel  │  │ Painel  │               │
│  │  Raiz   │  │Empreend.│               │
│  └─────────┘  └─────────┘               │
│                                          │
│  ── Painéis Operacionais ──              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ Painel  │  │ Painel  │  │ Painel  │  │
│  │ Cidade  │  │Parceiro │  │Motorista│  │
│  └─────────┘  └─────────┘  └─────────┘  │
│                                          │
│  ── Aplicativos ──                       │
│  ┌─────────┐                             │
│  │  App    │                             │
│  │ Cliente │                             │
│  └─────────┘                             │
│                                          │
│  ── Autenticação ──                      │
│  ┌─────────┐                             │
│  │  Login  │                             │
│  └─────────┘                             │
└──────────────────────────────────────────┘
```

### Cards incluídos

| Card | Rota | Descrição |
|---|---|---|
| Painel Raiz | `/` | Acesso administrativo root |
| Painel Empreendedor | `/` | Dashboard do brand_admin |
| Painel Cidade | `/?branchId=...` | Requer ID da cidade |
| Painel Parceiro | `/store-panel?storeId=...` | Requer ID da loja |
| Painel Motorista | `/driver?brandId=...` | Painel do motorista |
| App do Cliente | `/customer-preview?brandId=...` | Visualização do app |
| Login | `/auth` | Tela de autenticação |

Cards que requerem IDs terão nota explicativa informando que o ID deve ser passado via URL.

### Arquivos

**Novo: `src/pages/PaginaLinksPage.tsx`**
- Página com grid de cards estilizados
- Cada card com ícone, título, descrição e link
- Agrupados por categoria (Administrativos, Operacionais, Apps, Auth)
- Responsivo: 1 coluna mobile, 2-3 colunas desktop
- Sem autenticação necessária
- Visual seguindo o design system (dark mode, bordas arredondadas, sombras sutis)

**Modificado: `src/App.tsx`**
- Adicionar rota pública `/links` apontando para `PaginaLinksPage`

### Detalhes técnicos
- Página estática sem chamadas ao banco
- Usa componentes existentes: Card, Button
- Links absolutos usando a URL publicada (`https://fidelidadevaleresgate.lovable.app`)
- Ícones do Lucide para cada card

