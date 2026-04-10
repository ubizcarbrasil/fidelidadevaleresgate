

# Domínios Próprios por Empresa (Brand Admin)

## Problema Atual
- A página de domínios (`/domains`) está protegida por `RootGuard` — apenas o Root Admin acessa
- Brand Admins não conseguem cadastrar ou gerenciar seus próprios domínios
- A tabela `brand_domains` já tem RLS permitindo que Brand Admins gerenciem domínios da própria marca

## Solução

### 1. Criar página de domínios para o Brand Admin
Criar uma nova página `src/pages/PaginaDominiosMarca.tsx` que:
- Lista apenas os domínios da marca do usuário logado (filtro via `useBrandGuard`)
- Permite adicionar, editar e excluir domínios
- Mostra instruções de configuração DNS (apontar para `185.158.133.1`)
- Exibe status visual (ativo/inativo)
- Inclui card explicativo com passo a passo para o empreendedor

### 2. Adicionar rota no App.tsx
- Nova rota `/brand-domains` protegida por `ModuleGuard` com moduleKey `domains` (ou sem guard, como configuração básica)
- Acessível pelo painel BRAND

### 3. Adicionar item no BrandSidebar
- Novo item no grupo "Configurações":
  ```
  { key: "sidebar.dominios_marca", defaultTitle: "Meus Domínios", url: "/brand-domains", icon: Globe }
  ```

### 4. Adaptar lógica de inserção
- Ao cadastrar um domínio, o `brand_id` será injetado automaticamente via `enforceBrandId` do `useBrandGuard`
- O Brand Admin não verá nem escolherá a marca — será a dele automaticamente
- Ao salvar um domínio `exemplo.com`, inserir automaticamente também `www.exemplo.com` para evitar problemas de resolução

### 5. Card de instruções DNS
A página incluirá um card explicativo com:
- IP de destino: `185.158.133.1`
- Tipo de registro: A Record
- Prazo de propagação: até 72h
- Dica sobre versão www

## Arquivos Envolvidos
| Arquivo | Ação |
|---------|------|
| `src/pages/PaginaDominiosMarca.tsx` | Criar — página de domínios do empreendedor |
| `src/App.tsx` | Editar — adicionar rota `/brand-domains` |
| `src/components/consoles/BrandSidebar.tsx` | Editar — adicionar item "Meus Domínios" |

Nenhuma mudança de banco de dados necessária — as RLS policies já permitem que Brand Admins gerenciem domínios da própria marca.

