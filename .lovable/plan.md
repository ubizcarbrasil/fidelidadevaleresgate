

## Plano: Habilitar módulo `earn_points_store` para todas as marcas

### Situação atual
- 3 marcas já têm o módulo ativo (Vini fideliza, Leo fideliza, Urbano Norte)
- 1 marca tem o módulo **desabilitado**: **Ubiz Resgata** (`id: db15bd21-9137-4965-a0fb-540d8e8b26f1`)

### Ação
Executar um UPDATE via insert tool para habilitar o módulo na marca Ubiz Resgata:

```sql
UPDATE brand_modules 
SET is_enabled = true 
WHERE id = '6ff08898-dd7c-422b-956e-b2811ab52efa';
```

Isso é tudo — apenas uma atualização de dado. Nenhuma alteração de código ou schema necessária.

### Resultado
Após a ativação, o menu **"Pontuação por Tier"** aparecerá no sidebar de todas as marcas sob o grupo "Programa de Fidelidade".

