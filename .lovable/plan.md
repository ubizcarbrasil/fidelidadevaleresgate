

## Plano: Importar contatos do CRM externo via CSV

A infraestrutura já está pronta. Não é necessário nenhuma alteração de código.

### Passo a passo operacional

1. **No CRM externo** (`valeresgatacrm.lovable.app`): exporte os 3.648 contatos como arquivo CSV. O CSV deve conter colunas como `Nome`, `Telefone`, `CPF`, `Email`, `Qtd. Corridas`, etc.

2. **Neste sistema**, acesse a página **Importação CSV** (menu lateral → Importação CSV)

3. Selecione o tipo de importação: **"Contatos CRM"** — os campos disponíveis para mapeamento são:
   - Nome (obrigatório), Telefone, E-mail, CPF, Gênero, Sistema Operacional, Qtd. Corridas, Ativo Desde, Última Corrida, Origem, Tags, Ativo

4. Faça o upload do CSV, mapeie as colunas do arquivo para os campos do sistema, e execute a importação

5. Após a importação, vá à página **Clientes** e clique **"Sincronizar CRM"** — isso vai criar os registros de clientes a partir dos contatos CRM importados (lógica reversa já implementada)

### Resultado

- Os 3.648 contatos entram na tabela `crm_contacts` local
- O botão "Sincronizar CRM" cria os `customers` correspondentes com tier calculado automaticamente
- Ambas as tabelas ficam vinculadas via `customer_id` / `crm_contact_id`

### Código necessário

**Nenhum.** O motor de importação CSV já suporta o tipo "Contatos CRM" com todos os campos necessários, e a sincronização reversa CRM → Clientes já está implementada no botão "Sincronizar CRM".

