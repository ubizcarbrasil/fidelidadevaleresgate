

## Plano: Reorganizar sidebar com módulos colapsáveis

### Resumo
Reestruturar o `BrandSidebar` para usar `Collapsible` em cada grupo de módulos, com seta para expandir/recolher. Reorganizar os itens conforme solicitado e remover "Enviar Notificação".

### Nova estrutura do sidebar

```text
─── Painel Principal (fixo, fora dos módulos)
─── ▸ Configure
│     Cidade, Aparência da Marca, Ícones, LP de Parceiros,
│     Tour de Boas-Vindas, Links do Perfil
─── ▸ Páginas do App
│     Construtor de Páginas, Achadinhos, Cat. Achadinhos,
│     Central de Propagandas
─── ▸ Validação
│     Solicitações de Emissor, Aprovar Parceiros,
│     Aprovar Regras, Catálogo
─── ▸ Operação
│     Operador PDV, Ofertas, Resgates, Cupons,
│     Parceiros, Clientes
─── ▸ Jornada
│     Jornada Empreendedor, Jornada Emissor,
│     Jornada do Cliente
─── ▸ Pontos
│     Pontuar, Regras de Pontos, Extrato de Pontos
─── ▸ Usuários e Permissões
│     Usuários, Funcionalidades, Permissões Parceiros,
│     Central de Acessos, Auditoria
─── ▸ Relatórios
│     Relatórios, Configurações da Marca
─── ▸ Ganha-Ganha (como está)
─── ▸ CRM Estratégico (como está + Importar Planilha)
─── ▸ Técnico
│     Integrações API, Documentação API, Domínios, Taxonomia
```

### Alterações técnicas

**`src/components/consoles/BrandSidebar.tsx`**:
- Importar `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` e `ChevronRight`
- Reordenar o array `groups` conforme nova estrutura acima
- Dashboard fica como item fixo antes dos grupos
- Cada grupo usa `Collapsible` com seta rotativa (chevron) no label
- Auto-expandir o grupo que contém a rota ativa
- Remover item "Enviar Notificação" (`sidebar.enviar_notificacao`)
- Renomear "Configurações" para "Configurações da Marca"
- Mover "Importar Planilha" para dentro do CRM Estratégico

**`src/hooks/useMenuLabels.ts`**:
- Atualizar default label de `sidebar.configuracoes` para "Configurações da Marca"

### Removidos
- Enviar Notificação (push) — removido do sidebar

### Nenhuma alteração de banco necessária

