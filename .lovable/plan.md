

## Ativar pontuação do motorista

### Estado atual
A integração ativa tem `driver_points_enabled = false`. O webhook ignora completamente a lógica de pontuação do motorista quando essa flag está desligada.

### Correção
Executar um UPDATE direto na tabela `machine_integrations` para ativar a pontuação do motorista com a configuração padrão (50% dos pontos do passageiro):

```sql
UPDATE machine_integrations
SET driver_points_enabled = true,
    driver_points_mode = 'PERCENT',
    driver_points_percent = 50,
    driver_points_per_real = 1
WHERE id = '5e734e6f-4775-4f87-b51d-c17bce740d3a';
```

### O que muda
- Próximas corridas finalizadas vão pontuar o motorista com 50% dos pontos do passageiro
- O Telegram vai receber notificação "🚗 Motorista pontuado!" para cada corrida
- O painel "Motoristas Pontuados" ficará visível na página de integração

### Nenhum código alterado
Apenas configuração no banco de dados.

