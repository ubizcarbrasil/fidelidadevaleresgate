

## Plano: Criação em massa de Achadinhos + Importação via planilha

### Problema atual
A página de Achadinhos só permite criar um item por vez via dialog. Falta campo para logo da loja parceira. Valores zerados (R$ 0,00) aparecem quando não preenchidos.

### 1. Migração SQL: adicionar coluna `store_logo_url`
Adicionar `store_logo_url text` na tabela `affiliate_deals` para armazenar o ícone/logo da loja parceira (ex: Mercado Livre, Amazon).

### 2. Reformular a página `AffiliateDealsPage.tsx`
Substituir o dialog de criação individual por uma experiência com **duas abas** (Tabs):

**Aba "Adicionar Manual":**
- Lista inline de cards editáveis na própria página (sem dialog)
- Botão `+ Adicionar Achadinho` cria um card vazio na lista
- Cada card contém: imagem do produto, logo da loja parceira, descrição/título, link do produto, preço atual, preço original (De/Para), categoria, nome da loja
- Todos os campos são opcionais exceto título e link
- Botão "Salvar Todos" insere todos os cards de uma vez via batch insert
- Botão de remover (X) em cada card para descartar antes de salvar

**Aba "Importar Planilha":**
- Upload de CSV/planilha com colunas: link imagem produto, descrição, valor, valor original (de/para), link logo loja parceira, link afiliado
- Preview dos dados antes de confirmar
- Inserção em lote com barra de progresso (reutilizando pattern do CsvImportPage)

### 3. Atualizar exibição na tabela de listagem
- Mostrar logo da loja parceira como miniatura ao lado do nome da loja
- Não exibir preço "R$ 0,00" quando price for 0 ou null -- mostrar "—" ou omitir

### 4. Atualizar o componente `AchadinhoSection.tsx` (customer)
- Renderizar `store_logo_url` como ícone pequeno no canto superior direito do card (como na imagem de referência com o logo do Mercado Livre)
- Não exibir preço se for 0 ou null

### 5. Tornar `price` opcional no banco
Alterar a coluna `price` para ter default null em vez de obrigatório, permitindo achadinhos sem preço definido.

### Arquivos afetados
- **Migração SQL**: adicionar `store_logo_url`, alterar `price` default
- **`src/pages/AffiliateDealsPage.tsx`**: reescrever com tabs (manual em massa + importação CSV)
- **`src/components/customer/AchadinhoSection.tsx`**: exibir store_logo_url, ocultar preço zerado

