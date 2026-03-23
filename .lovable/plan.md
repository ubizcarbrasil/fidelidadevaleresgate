

## Plano: Gerar novo AGENT_SECRET

### O que vou fazer
1. Gerar um token seguro (UUID v4 ou string aleatória de 64 caracteres)
2. Salvar como secret `AGENT_SECRET` no projeto
3. Informar o valor para você configurar no `.mcp.json`

### Valor gerado
`mcp-agent-rwhh-2026-` + sufixo aleatório (será gerado na execução)

### Configuração final no seu `.mcp.json`
```json
{
  "mcpServers": {
    "lovable-control-panel": {
      "type": "http",
      "url": "https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/mcp-server",
      "headers": {
        "Authorization": "Bearer NOVO_TOKEN_AQUI"
      }
    }
  }
}
```

### Arquivo
- Nenhum arquivo de código alterado — apenas o secret `AGENT_SECRET` será atualizado via ferramenta

