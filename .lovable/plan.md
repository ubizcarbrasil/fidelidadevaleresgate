

## Problema Identificado

Os campos de mapeamento do CSV para "Contatos CRM" (`CRM_CONTACT_FIELDS`) são derivados das colunas da tabela `crm_contacts` no banco de dados. Atualmente os campos incluem: Nome, Telefone, E-mail, CPF, Gênero, Plataforma, Origem, Tags, Ativo.

Porém, a tabela **não possui** colunas para os dados que você precisa:
- **Quantidade de corridas** (ride_count)
- **Ativo desde** (active_since / first_ride_at)
- **Data da última corrida** (last_ride_at)

O campo "Sistema Operacional" (`os_platform`) já existe.

## Plano

### 1. Adicionar colunas na tabela `crm_contacts`
Migração SQL para adicionar:
- `ride_count` (integer, default 0)
- `first_ride_at` (timestamptz, nullable)
- `last_ride_at` (timestamptz, nullable)

### 2. Atualizar os campos de mapeamento do CSV
No `CsvImportPage.tsx`, substituir os `CRM_CONTACT_FIELDS` para incluir os novos campos relevantes:
- Nome (obrigatório)
- Telefone
- E-mail
- CPF
- Gênero
- Sistema Operacional (os_platform)
- Quantidade de Corridas (ride_count)
- Ativo Desde (first_ride_at)
- Última Corrida (last_ride_at)
- Origem
- Tags

### 3. Atualizar a lógica de inserção do CSV
Ajustar o bloco de inserção `CRM_CONTACTS` para gravar os novos campos (`ride_count`, `first_ride_at`, `last_ride_at`) a partir dos dados mapeados.

### 4. Atualizar tipos do módulo CRM
Adicionar os novos campos na interface `CrmContact` em `src/modules/crm/types.ts`.

### 5. Exibir os novos dados na página de Contatos CRM
Atualizar `CrmContactsPage.tsx` para mostrar as novas colunas na tabela e no detalhe do contato.

