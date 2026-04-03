

# Adicionar módulo `achadinhos_motorista` aos planos Starter, Profissional e Enterprise

## Situação atual
O módulo já está cadastrado no template do plano **free**. Faltam os planos **starter**, **profissional** e **enterprise**.

## Ação
Inserir 3 registros em `plan_module_templates`:

```sql
INSERT INTO plan_module_templates (plan_key, module_definition_id, is_enabled) VALUES
  ('starter',       '8587af40-69b3-4021-a4fc-497202d87391', true),
  ('profissional',  '8587af40-69b3-4021-a4fc-497202d87391', true),
  ('enterprise',    '8587af40-69b3-4021-a4fc-497202d87391', true);
```

## Resultado
Todas as novas marcas provisionadas em qualquer plano terão o módulo **Achadinhos Motorista** ativado automaticamente.

Nenhuma alteração de código necessária — apenas inserção de dados.

