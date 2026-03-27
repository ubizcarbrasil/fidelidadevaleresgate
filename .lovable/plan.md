

## Plano: Melhorias no card de motorista e validação Telegram

### Mudanças solicitadas
1. Mostrar quantidade de corridas ao lado dos pontos no card
2. Mostrar cidade do motorista no card
3. Mudar cor amarela das badges de pontos para azul
4. Verificar que a notificação Telegram do motorista está correta

### Arquivo 1: `src/pages/DriverManagementPage.tsx`

**DriverRow type** — adicionar campos `total_rides` e `branch_name`:
```ts
total_rides: number;
branch_name: string | null;
```

**Query** — buscar `driver_monthly_ride_count` do customer e fazer join com `branches` para obter nome da cidade:
- Adicionar `driver_monthly_ride_count` ao select de customers
- Buscar branches para mapear `branch_id` -> `name`
- Contar corridas totais do `machine_rides` (já busca, só precisa contar além de somar pontos)

**Card do motorista** — ajustar layout:
- Adicionar cidade abaixo do nome (junto com CPF/telefone)
- Adicionar badge de corridas: `🚗 X corridas`
- Trocar cor amarela (`bg-yellow-...`) para azul (`bg-blue-500/10 text-blue-400 border-blue-400/30`) nos badges de pontos

### Arquivo 2: `src/components/driver-management/tabs/AbaPontuacaoMotorista.tsx`
- Adicionar linha mostrando total de corridas realizadas

### Telegram — Verificação
A notificação do motorista no webhook **está correta**: envia `is_driver_notification: true`, `driver_points`, `driver_monthly_rides` e `driver_volume_tier`. O template no edge function `send-telegram-ride-notification` renderiza corretamente com o template de motorista. Nenhuma alteração necessária.

### Detalhes técnicos

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/DriverManagementPage.tsx` | Adicionar `total_rides`, `branch_name` ao type e query; badges azuis; cidade e corridas no card |
| `src/components/driver-management/tabs/AbaPontuacaoMotorista.tsx` | Adicionar linha de corridas realizadas |

